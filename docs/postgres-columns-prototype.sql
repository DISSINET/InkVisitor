-- Prototype: STORED generated columns + trigger-maintained child tables.
-- doc stays the source of truth; the adapter's write SQL is unchanged.
\timing on
\set ON_ERROR_STOP on
SET maintenance_work_mem = '1GB';

-- audits ------------------------------------------------------------------
-- one ALTER so the table is rewritten once (ACCESS EXCLUSIVE for the duration)
ALTER TABLE audits
  ADD COLUMN date        text GENERATED ALWAYS AS (doc->>'date') STORED,
  ADD COLUMN type        text GENERATED ALWAYS AS (doc->>'type') STORED,
  ADD COLUMN "user"      text GENERATED ALWAYS AS (doc->>'user') STORED,
  ADD COLUMN audit_scope text GENERATED ALWAYS AS (doc->>'auditScope') STORED,
  ADD COLUMN model_id    text GENERATED ALWAYS AS (doc->>'modelId') STORED;
CREATE INDEX audits_scope_model_date ON audits (audit_scope, model_id, date);
CREATE INDEX audits_date_type_user_c ON audits (date, type, "user");
CREATE INDEX audits_type_user        ON audits (type, "user");
DROP INDEX audits_auditscope_modelid, audits_date, audits_date_type_user;

-- entities ----------------------------------------------------------------
ALTER TABLE entities
  ADD COLUMN class        text GENERATED ALWAYS AS (doc->>'class') STORED,
  ADD COLUMN status       text GENERATED ALWAYS AS (doc->>'status') STORED,
  ADD COLUMN territory_id text GENERATED ALWAYS AS (doc->'data'->'territory'->>'territoryId') STORED,
  ADD COLUMN parent_id    text GENERATED ALWAYS AS (doc->'data'->'parent'->>'territoryId') STORED;
CREATE INDEX entities_class_status ON entities (class, status);
CREATE INDEX entities_s_territory  ON entities (territory_id) WHERE class = 'S';
CREATE INDEX entities_parent       ON entities (parent_id);
DROP INDEX entities_class, entities_statement_territory, entities_territory_parent;

-- child tables ------------------------------------------------------------
-- (statement_id)/(entity_id) indexes on every child table serve the trigger's
-- DELETE and the FK cascade; without them each write seq-scans the child table.
CREATE TABLE statement_actants (
  statement_id text NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  ord int NOT NULL, position text, entity_id text);
CREATE TABLE statement_actions (
  statement_id text NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  ord int NOT NULL, action_id text);
CREATE TABLE statement_props (
  statement_id text NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  owner_id text, type_id text, value_id text);
CREATE TABLE entity_props (
  entity_id text NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  level int NOT NULL, type_id text, value_id text);
CREATE TABLE relation_entities (
  relation_id text NOT NULL REFERENCES relations(id) ON DELETE CASCADE,
  pos int NOT NULL, entity_id text NOT NULL);

-- extractors, shared by the backfill and the triggers
CREATE FUNCTION jarr(x jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT CASE WHEN jsonb_typeof(x) = 'array' THEN x ELSE '[]'::jsonb END $$;

-- props tree flattened to maxlvl levels (1 = top)
CREATE FUNCTION props_flat(props jsonb, maxlvl int)
RETURNS TABLE(level int, type_id text, value_id text) LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  WITH RECURSIVE p(level, prop) AS (
    SELECT 1, x FROM jsonb_array_elements(jarr(props)) x
    UNION ALL
    SELECT p.level + 1, c FROM p, jsonb_array_elements(jarr(p.prop->'children')) c WHERE p.level < maxlvl)
  SELECT level, prop->'type'->>'entityId', prop->'value'->>'entityId' FROM p $$;

-- "position" is a keyword and cannot name an OUT parameter
CREATE FUNCTION statement_actants_of(doc jsonb)
RETURNS TABLE(ord int, actant_position text, entity_id text) LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT (o - 1)::int, a->>'position', a->>'entityId'
  FROM jsonb_array_elements(jarr(doc->'data'->'actants')) WITH ORDINALITY t(a, o) $$;

CREATE FUNCTION statement_actions_of(doc jsonb)
RETURNS TABLE(ord int, action_id text) LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT (o - 1)::int, a->>'actionId'
  FROM jsonb_array_elements(jarr(doc->'data'->'actions')) WITH ORDINALITY t(a, o) $$;

-- in-statement props on actants and actions, 3 levels; owner = actant/action row id
CREATE FUNCTION statement_props_of(doc jsonb)
RETURNS TABLE(owner_id text, type_id text, value_id text) LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT o->>'id', f.type_id, f.value_id
  FROM jsonb_array_elements(jarr(doc->'data'->'actants') || jarr(doc->'data'->'actions')) o,
       props_flat(o->'props', 3) f $$;

CREATE FUNCTION relation_entities_of(doc jsonb)
RETURNS TABLE(pos int, entity_id text) LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT (o - 1)::int, v FROM jsonb_array_elements_text(jarr(doc->'entityIds')) WITH ORDINALITY t(v, o)
  WHERE v IS NOT NULL $$;

-- backfill
INSERT INTO statement_actants SELECT e.id, x.* FROM entities e, statement_actants_of(e.doc) x WHERE e.class = 'S';
INSERT INTO statement_actions SELECT e.id, x.* FROM entities e, statement_actions_of(e.doc) x WHERE e.class = 'S';
INSERT INTO statement_props   SELECT e.id, x.* FROM entities e, statement_props_of(e.doc) x WHERE e.class = 'S';
INSERT INTO entity_props      SELECT e.id, x.* FROM entities e, props_flat(e.doc->'props', 4) x;
INSERT INTO relation_entities SELECT r.id, x.* FROM relations r, relation_entities_of(r.doc) x;

CREATE INDEX statement_actants_entity_pos ON statement_actants (entity_id, position);
CREATE INDEX statement_actants_statement  ON statement_actants (statement_id);
CREATE INDEX statement_actions_action     ON statement_actions (action_id);
CREATE INDEX statement_actions_statement  ON statement_actions (statement_id);
CREATE INDEX statement_props_type         ON statement_props (type_id);
CREATE INDEX statement_props_value        ON statement_props (value_id);
CREATE INDEX statement_props_statement    ON statement_props (statement_id);
CREATE INDEX entity_props_type            ON entity_props (type_id);
CREATE INDEX entity_props_value           ON entity_props (value_id);
CREATE INDEX entity_props_entity          ON entity_props (entity_id);
CREATE INDEX relation_entities_entity     ON relation_entities (entity_id);
CREATE INDEX relation_entities_relation   ON relation_entities (relation_id);

-- triggers: AFTER, so NEW carries the computed generated columns (NEW.id, NEW.class)
CREATE FUNCTION entities_sync_children() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM statement_actants WHERE statement_id = OLD.id;
    DELETE FROM statement_actions WHERE statement_id = OLD.id;
    DELETE FROM statement_props   WHERE statement_id = OLD.id;
    DELETE FROM entity_props      WHERE entity_id    = OLD.id;
  END IF;
  IF NEW.class = 'S' THEN
    INSERT INTO statement_actants SELECT NEW.id, x.* FROM statement_actants_of(NEW.doc) x;
    INSERT INTO statement_actions SELECT NEW.id, x.* FROM statement_actions_of(NEW.doc) x;
    INSERT INTO statement_props   SELECT NEW.id, x.* FROM statement_props_of(NEW.doc) x;
  END IF;
  INSERT INTO entity_props SELECT NEW.id, x.* FROM props_flat(NEW.doc->'props', 4) x;
  RETURN NULL;
END $$;
CREATE TRIGGER entities_sync_children AFTER INSERT OR UPDATE OF doc ON entities
  FOR EACH ROW EXECUTE FUNCTION entities_sync_children();

CREATE FUNCTION relations_sync_children() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM relation_entities WHERE relation_id = OLD.id;
  END IF;
  INSERT INTO relation_entities SELECT NEW.id, x.* FROM relation_entities_of(NEW.doc) x;
  RETURN NULL;
END $$;
CREATE TRIGGER relations_sync_children AFTER INSERT OR UPDATE OF doc ON relations
  FOR EACH ROW EXECUTE FUNCTION relations_sync_children();

VACUUM ANALYZE audits, entities, relations, statement_actants, statement_actions,
  statement_props, entity_props, relation_entities;
