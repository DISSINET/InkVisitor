import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Relation as RelationTypes } from "@inkvisitor/shared/types";
import { InternalServerError } from "@inkvisitor/shared/types/errors";
import { Query } from "@inkvisitor/shared/types/query";
import { TABLE } from "../../names";
import { Conn, ExploreResolvers } from "../../types";
import { collect, propPaths } from "../provision";
import { Params, arr, ident, indexHolds } from "../sql";
import { q } from "../tables";
import SearchNode, { ID_ORDER, Input, inputWhere } from "./nodes";

/**
 * One explore edge, the PostgreSQL counterpart of ../../rethink/query/edge.ts.
 * Every edge type is a predicate over alias `e` (the entity being tested) in
 * PREDICATES; run() wraps it in one SELECT over the input rows, so a match is
 * a subset of the input by construction, which positive matching and negation
 * (base minus match) both rely on.
 */
export default class SearchEdge implements Query.IEdge {
  type: Query.EdgeType;
  params: Query.IEdgeParams;
  logic: Query.EdgeLogic;
  id: string;
  node: SearchNode;
  /** id expansion and the territory lineage; injected by the plan, see setResolvers */
  protected resolvers?: ExploreResolvers;

  constructor(data: Partial<Query.IEdge>) {
    this.type = data.type || ("" as Query.EdgeType);
    this.params = data.params || {};
    this.logic = data.logic || Query.EdgeLogic.Positive;
    this.node = new SearchNode(data?.node || {});
    this.id = data.id || "";
  }

  setResolvers(resolvers: ExploreResolvers): void {
    this.resolvers = resolvers;
    this.node.setResolvers(resolvers);
  }

  protected resolve(): ExploreResolvers {
    if (!this.resolvers) {
      throw new InternalServerError("explore target expansion requires resolvers");
    }
    return this.resolvers;
  }

  /**
   * Explicit target-id set, resolved in prepare(): for a pinned target the
   * pinned entityId plus its toggle-driven expansion; for an unpinned node
   * the entities matching its status constraint. Null when the target is
   * neither pinned nor status-constrained.
   */
  protected targetEntityIds: string[] | null = null;

  /** the subtree below the pinned targets, resolved for I_CT: with the SUB toggle */
  protected descendantIds: string[] | null = null;

  /** the relation edges check an unpinned target's statuses on the far-side entity per relation */
  private checksUnpinnedTargetStatusInRun(): boolean {
    return this.type.startsWith("R:") || this.type.startsWith("I_R:");
  }

  /** on the territory-tree edges the SUB toggle picks how far the walk goes rather than widening a pinned target */
  private expandsPinnedSubordinates(): boolean {
    return !TERRITORY_TREE_EDGES.has(this.type);
  }

  /** classes the target picker offers this edge, narrowing the status lookup when the node picks no class */
  private statusTargetClasses(): EntityEnums.Class[] {
    return Query.EdgeTypeTargetNodeParams[this.type]?.entityId?.allowedClasses ?? [];
  }

  /** resolves the target set; the node evaluator calls it before run() */
  async prepare(conn: Conn): Promise<void> {
    const entityId = this.node.params.entityId;
    // the status narrows an empty target only: a pinned entity is the target itself, whatever its status
    const statuses = this.node.params.entityStatuses ?? [];
    this.descendantIds = null;

    if (!entityId) {
      // resolved into an id set so every predicate applies it through targetIds()
      this.targetEntityIds =
        statuses.length && !this.checksUnpinnedTargetStatusInRun() ? await this.statusTargetIds(conn, statuses) : null;
      return;
    }

    const expansion = await this.resolve().expand(conn, entityId, {
      equivalents: this.node.params.includeEquivalents === true,
      subordinates: this.expandsPinnedSubordinates() && this.node.params.includeSubordinates === true,
    });
    this.targetEntityIds = [entityId, ...expansion.equivalents, ...expansion.subordinates];

    if (this.type === Query.EdgeType["I_CT:"] && this.node.params.includeSubordinates === true) {
      this.descendantIds = await this.resolve().subordinates(conn, this.targetEntityIds);
    }
  }

  /** ids of entities carrying one of `statuses`, narrowed by the node's classes, else by the classes the edge's target can hold */
  private async statusTargetIds(conn: Conn, statuses: EntityEnums.Status[]): Promise<string[]> {
    const nodeClasses = this.node.params.entityClasses ?? [];
    const classes = nodeClasses.length ? nodeClasses : this.statusTargetClasses();
    const p = new Params();
    const where = [`e.status = ${anyOf(p, statuses)}`];
    if (classes.length) {
      where.push(`e.class = ${anyOf(p, classes)}`);
    }
    const res = await q(conn, `SELECT e.id FROM ${ENTITIES} e WHERE ${where.join(" AND ")}`, p.list);
    return res.rows.map((row: { id: string }) => row.id);
  }

  /**
   * Target-id set for the predicates to match against, null when the target
   * is unconstrained. A pinned target always contains the pinned id; a
   * status-constrained one may be empty, which run() treats as "matches
   * nothing". Falls back to the raw params.entityId when prepare() has not run.
   */
  targetIds(): string[] | null {
    if (this.targetEntityIds) {
      return this.targetEntityIds;
    }
    const entityId = this.node.params.entityId;
    return entityId ? [entityId] : null;
  }

  /** classes of an unpinned target node */
  targetClasses(): EntityEnums.Class[] {
    return this.node.params.entityClasses ?? [];
  }

  /** statuses of an unpinned target for the per-relation check; a pinned target carries its status in the id set */
  unpinnedTargetStatuses(): EntityEnums.Status[] {
    return this.node.params.entityId ? [] : this.node.params.entityStatuses ?? [];
  }

  /** ancestors of the pinned targets through the tree cache: every level, or the direct parents only */
  ancestorIds(depth: "direct" | "any"): string[] {
    const out = new Set<string>();
    for (const territoryId of this.targetIds() ?? []) {
      const path = this.resolve().territoryPath(territoryId);
      for (const id of depth === "any" ? path : path.slice(-1)) {
        out.add(id);
      }
    }
    return [...out];
  }

  /** true when the SUB toggle turns a pinned I_CT: target into its whole subtree */
  anyDepth(): boolean {
    return !!this.node.params.entityId && this.node.params.includeSubordinates === true;
  }

  descendants(): string[] {
    return this.descendantIds ?? [];
  }

  /** ids of the input rows matching this edge */
  async run(conn: Conn, input: Input): Promise<string[]> {
    const targets = this.targetIds();
    // a status constraint no entity meets: the edge matches nothing, as ReQL intersecting with an empty set
    if (targets && !targets.length) {
      return [];
    }
    const p = new Params();
    const where = inputWhere(input, p);
    const predicate = PREDICATES[this.type](this, p);
    const res = await q(conn, `SELECT e.id FROM ${ENTITIES} e WHERE ${where} AND (${predicate}) ${ID_ORDER}`, p.list);
    return res.rows.map((row: { id: string }) => row.id);
  }
}

export type Predicate = (edge: SearchEdge, p: Params) => string;

export const ENTITIES = ident(TABLE.entities);
const RELATIONS = ident(TABLE.relations);
/** the relation row holds e.id, through the gin index; `doc` resolves to the relation inside the subquery */
const RELATION_HOLDS_E = indexHolds(TABLE.relations, DbEnums.Indexes.RelationsEntityIds, "e.id");
const TERRITORY_TREE_EDGES = new Set<string>([Query.EdgeType["CT:"], Query.EdgeType["CT:D"], Query.EdgeType["I_CT:"]]);
const S = EntityEnums.Class.Statement;
const T = EntityEnums.Class.Territory;

const anyOf = (p: Params, values: unknown[]): string => `ANY(${p.add(values)}::text[])`;
/** the row `x` is of class `cls` */
const isClass = (x: string, cls: EntityEnums.Class): string => `${x}.class = '${cls}'`;
/** a filled id read from json (ReQL `.default("").ne("")`) */
const nonEmpty = (x: string): string => `coalesce(${x}, '') <> ''`;

/** an existing entity `idSql` of the classes and statuses; an empty list does not constrain (entityMatchesClassesAndStatuses) */
function entityMatches(p: Params, idSql: string, classes: EntityEnums.Class[], statuses: EntityEnums.Status[]): string {
  const parts = [`t.id = ${idSql}`];
  if (classes.length) {
    parts.push(`t.class = ${anyOf(p, classes)}`);
  }
  if (statuses.length) {
    parts.push(`t.status = ${anyOf(p, statuses)}`);
  }
  return `EXISTS (SELECT 1 FROM ${ENTITIES} t WHERE ${parts.join(" AND ")})`;
}

/**
 * some element of the text[] `idsSql` is an existing entity of one of `classes` (hasIdOfClasses);
 * ANY reads a bare parenthesized subquery as a row source; the cast makes it an array expression
 */
const hasIdOfClasses = (p: Params, idsSql: string, classes: EntityEnums.Class[]): string =>
  `EXISTS (SELECT 1 FROM ${ENTITIES} t WHERE t.id = ANY(${idsSql}::text[]) AND t.class = ${anyOf(p, classes)})`;

/** the collected text[] `idsSql` meets a target, holds an entity of the classes, or holds anything */
function idsMatch(p: Params, idsSql: string, targets: string[] | null, classes: EntityEnums.Class[]): string {
  if (targets) {
    return `${idsSql} && ${p.add(targets)}::text[]`;
  }
  if (classes.length) {
    return hasIdOfClasses(p, idsSql, classes);
  }
  return `cardinality(${idsSql}) > 0`;
}

/** text[] of the ids `paths` collect from document `doc`; null and empty ids are dropped, as every ReQL collector does */
const collected = (paths: string[], doc: string): string => `(${collect(paths, "v IS NOT NULL AND v <> ''", doc)})`;

// ---- relations ------------------------------------------------------------

/** relations of `type` with e.id on the source side whose far side meets the target (runRelationTargetEdge) */
function relationTarget(e: SearchEdge, p: Params, type: RelationEnums.Type, inverse = false): string {
  const far = `r.entity_ids[${inverse ? 1 : 2}]`;
  const targets = e.targetIds();
  const classes = e.targetClasses();
  const statuses = e.unpinnedTargetStatuses();
  let check = "TRUE";
  if (targets) {
    check = `${far} = ${anyOf(p, targets)}`;
  } else if (classes.length || statuses.length) {
    check = entityMatches(p, far, classes, statuses);
  }
  return (
    `EXISTS (SELECT 1 FROM ${RELATIONS} r WHERE ${RELATION_HOLDS_E} AND r.type = ${p.add(type)}` +
    ` AND r.entity_ids[${inverse ? 2 : 1}] = e.id AND ${check})`
  );
}

/**
 * text[] of the partners of `id` in relation r: every id that is not `id`, and
 * `id` itself when the row holds it twice, a self loop (relationPartners)
 */
const partners = (selfLoop: boolean, id = "e.id"): string =>
  selfLoop
    ? `(array_remove(r.entity_ids, ${id}) || CASE WHEN cardinality(array_positions(r.entity_ids, ${id})) > 1 THEN ARRAY[${id}] ELSE '{}'::text[] END)`
    : `array_remove(r.entity_ids, ${id})`;

/** a partner is a target, a partner is of the classes and statuses, or there is a partner at all */
function partnersMatch(
  p: Params,
  partnersSql: string,
  targets: string[] | null,
  classes: EntityEnums.Class[],
  statuses: EntityEnums.Status[]
): string {
  if (targets) {
    return `${partnersSql} && ${p.add(targets)}::text[]`;
  }
  if (classes.length || statuses.length) {
    return `EXISTS (SELECT 1 FROM unnest(${partnersSql}) pid WHERE ${entityMatches(p, "pid", classes, statuses)})`;
  }
  return `cardinality(${partnersSql}) > 0`;
}

/**
 * relations of `type` holding e.id whose partners meet the target (runHasUnorderedRelationEdge);
 * a semi-join over the members m of every relation of the type, which reads those relations once,
 * where an EXISTS over the gin index probes it per input row
 */
function unorderedRelation(e: SearchEdge, p: Params, type: RelationEnums.Type): string {
  const selfLoop = RelationTypes.RelationRules[type]?.selfLoop ?? false;
  return (
    `e.id IN (SELECT m.id FROM ${RELATIONS} r, unnest(r.entity_ids) m(id) WHERE r.type = ${p.add(type)}` +
    ` AND ${partnersMatch(p, partners(selfLoop, "m.id"), e.targetIds(), e.targetClasses(), e.unpinnedTargetStatuses())})`
  );
}

/**
 * Any relation holding e.id: one holding a target too (the whole array, so a
 * target that is e itself matches), one with a partner of the classes and
 * statuses, or any relation at all (EdgeHasRelation).
 */
function anyRelation(e: SearchEdge, p: Params): string {
  const targets = e.targetIds();
  const classes = e.targetClasses();
  const statuses = e.unpinnedTargetStatuses();
  let check = "TRUE";
  if (targets) {
    check = p.index(TABLE.relations, DbEnums.Indexes.RelationsEntityIds, targets);
  } else if (classes.length || statuses.length) {
    check = `EXISTS (SELECT 1 FROM unnest(${partners(true)}) pid WHERE ${entityMatches(p, "pid", classes, statuses)})`;
  }
  return `EXISTS (SELECT 1 FROM ${RELATIONS} r WHERE ${RELATION_HOLDS_E} AND ${check})`;
}

/** entityIds ordered [source, target]; the edge walks from e at [0] to [1] */
const ORDERED: Record<string, RelationEnums.Type> = {
  "R:SCL": RelationEnums.Type.Superclass,
  "R:SOE": RelationEnums.Type.SuperordinateEntity,
  "R:CLA": RelationEnums.Type.Classification,
  "R:HOL": RelationEnums.Type.Holonym,
  "R:AEE": RelationEnums.Type.ActionEventEquivalent,
  "R:IMP": RelationEnums.Type.Implication,
  "R:SUS": RelationEnums.Type.SubjectSemantics,
  "R:A1S": RelationEnums.Type.Actant1Semantics,
  "R:A2S": RelationEnums.Type.Actant2Semantics,
};
/** the same relations walked from e at [1] back to [0] */
const INVERSE_ORDERED: Record<string, RelationEnums.Type> = {
  "I_R:SCL": RelationEnums.Type.Superclass,
  "I_R:SOE": RelationEnums.Type.SuperordinateEntity,
  "I_R:CLA": RelationEnums.Type.Classification,
  "I_R:HOL": RelationEnums.Type.Holonym,
  "I_R:AEE": RelationEnums.Type.ActionEventEquivalent,
};
/** relations that put no meaning on the entityIds order: the symmetric pairs and the Synonym cloud */
const UNORDERED: Record<string, RelationEnums.Type> = {
  "R:SYN": RelationEnums.Type.Synonym,
  "R:ANT": RelationEnums.Type.Antonym,
  "R:PRR": RelationEnums.Type.PropertyReciprocal,
  "R:SAR": RelationEnums.Type.SubjectActant1Reciprocal,
  "R:IDE": RelationEnums.Type.Identification,
  "R:REL": RelationEnums.Type.Related,
};
function fromMap(map: Record<string, RelationEnums.Type>, build: (type: RelationEnums.Type) => Predicate): Record<string, Predicate> {
  const out: Record<string, Predicate> = {};
  for (const [edgeType, type] of Object.entries(map)) {
    out[edgeType] = build(type);
  }
  return out;
}

// ---- props and references -------------------------------------------------

/** the top-level props of row `x`, one element `pr` each */
const PROPS = (x: string): string => `jsonb_array_elements(${arr(`${x}.doc->'props'`)}) pr`;
const propId = (kind: "type" | "value"): string => `coalesce(pr->'${kind}'->>'entityId', '')`;

/** a top-level prop of e whose `kind` side is a target, or any filled one (EP:T, HP:V); HP:V narrows an empty target by class */
function hasProp(e: SearchEdge, p: Params, kind: "type" | "value", narrowByClass: boolean): string {
  const targets = e.targetIds();
  const classes = e.targetClasses();
  if (!targets && narrowByClass && classes.length) {
    return hasIdOfClasses(p, `ARRAY(SELECT ${propId(kind)} FROM ${PROPS("e")})`, classes);
  }
  const match = targets ? `${propId(kind)} = ${anyOf(p, targets)}` : `${propId(kind)} <> ''`;
  return `EXISTS (SELECT 1 FROM ${PROPS("e")} WHERE ${match})`;
}

/** the rows `s` an edge targets: by id when pinned, by the node's classes when unpinned, every row otherwise (entitiesOfClasses) */
function targetRows(e: SearchEdge, p: Params): string {
  const targets = e.targetIds();
  const classes = e.targetClasses();
  if (targets) {
    return `s.id = ${anyOf(p, targets)}`;
  }
  return classes.length ? `s.class = ${anyOf(p, classes)}` : "TRUE";
}

/** e is a filled `kind` side of a top-level prop of a target entity (runInversePropEdge) */
const isProp = (e: SearchEdge, p: Params, kind: "type" | "value"): string =>
  `e.id IN (SELECT ${propId(kind)} FROM ${ENTITIES} s, ${PROPS("s")} WHERE ${targetRows(e, p)})`;

/** the references of row `x`, one element `ref` each; a string `references` reads as empty */
const REFS = (x: string): string => `jsonb_array_elements(${arr(`${x}.doc->'references'`)}) ref`;

/** a reference of e whose `kind` side is a target, or is non-empty (HR:R, HR:V) */
function hasReference(e: SearchEdge, p: Params, kind: "resource" | "value"): string {
  const targets = e.targetIds();
  const match = targets ? `ref->>'${kind}' = ${anyOf(p, targets)}` : nonEmpty(`ref->>'${kind}'`);
  return `EXISTS (SELECT 1 FROM ${REFS("e")} WHERE ${match})`;
}

/** e is a resource the target entities' references point at (runIsReferenceResourceEdge) */
const isReferenceResource = (e: SearchEdge, p: Params): string =>
  `e.id IN (SELECT coalesce(ref->>'resource', '') FROM ${ENTITIES} s, ${REFS("s")} WHERE ${targetRows(e, p)})`;

// ---- statements -----------------------------------------------------------

/** the statements `s` an edge targets by id, or every statement (targetStatements) */
function targetStatements(e: SearchEdge, p: Params): string {
  const targets = e.targetIds();
  return targets ? `s.id = ${anyOf(p, targets)}` : "TRUE";
}

/** one side of the in-statement props (actions and actants), three levels deep */
const statementPropPaths = (kind: "type" | "value"): string[] => [
  ...propPaths("$.data.actions[*].props[*]", 3, kind),
  ...propPaths("$.data.actants[*].props[*]", 3, kind),
];

/** statements whose in-statement props reference a target by `kind`, an entity of the classes (SP:V), or anything (runStatementPropEdge) */
const statementHasProp = (e: SearchEdge, p: Params, kind: "type" | "value", narrowByClass: boolean): string =>
  `${isClass("e", S)} AND ${idsMatch(p, collected(statementPropPaths(kind), "e.doc"), e.targetIds(), narrowByClass ? e.targetClasses() : [])}`;

/** candidate statements through `index` for the targets; every statement without a target (candidateStatements) */
const candidates = (p: Params, index: string, targets: string[] | null): string =>
  targets ? p.index(TABLE.entities, index, targets) : "TRUE";

/** the actants of the statement row `x`, one element `a` each */
const ACTANTS = (x: string): string => `jsonb_array_elements(${arr(`${x}.doc->'data'->'actants'`)}) a`;

/** actants of the candidate statements satisfying `actantMatch`, each judged on its own (emitMatchingActants) */
function actantEdge(cands: string, actantMatch: string): string {
  return `e.id IN (SELECT a->>'entityId' FROM ${ENTITIES} s, ${ACTANTS("s")} WHERE ${isClass("s", S)} AND ${cands} AND ${actantMatch})`;
}

/** the actant carrying an in-statement prop that references a target by `kind` (runInverseStatementPropEdge) */
const isStatementProp = (e: SearchEdge, p: Params, kind: "type" | "value", narrowByClass: boolean): string =>
  actantEdge(
    candidates(p, DbEnums.Indexes.StatementDataProps, e.targetIds()),
    idsMatch(p, collected(propPaths("$.props[*]", 3, kind), "a"), e.targetIds(), narrowByClass ? e.targetClasses() : [])
  );

type ActantField = "classifications" | "identifications";

/** statements with an actant classification or identification pointing at a target, or any (runStatementActantFieldEdge) */
const statementHasActantField = (e: SearchEdge, p: Params, field: ActantField): string =>
  `${isClass("e", S)} AND ${idsMatch(p, collected([`$.data.actants[*].${field}[*].entityId`], "e.doc"), e.targetIds(), [])}`;

/** the actant whose classifications or identifications point at a target (runInverseStatementActantFieldEdge) */
const isActantField = (e: SearchEdge, p: Params, field: ActantField): string =>
  actantEdge(
    candidates(p, DbEnums.Indexes.StatementActantsCI, e.targetIds()),
    idsMatch(p, collected([`$.${field}[*].entityId`], "a"), e.targetIds(), [])
  );

/** statements with an actant in `positions` pointing at a target, at an entity of the classes, or at anything (runStatementHasActantEdge) */
function statementHasActant(e: SearchEdge, p: Params, positions: EntityEnums.Position[]): string {
  const targets = e.targetIds();
  const classes = e.targetClasses();
  let check = "TRUE";
  if (targets) {
    check = `a->>'entityId' = ${anyOf(p, targets)}`;
  } else if (classes.length) {
    check = entityMatches(p, "a->>'entityId'", classes, []);
  }
  return `${isClass("e", S)} AND EXISTS (SELECT 1 FROM ${ACTANTS("e")} WHERE a->>'position' = ${anyOf(p, positions)} AND ${check})`;
}

/**
 * statements with an action pointing at a target, at an entity of the classes, or with any action at all,
 * an unlinked one (actionId "") included, as ReQL counts the unfiltered actionId list (runStatementHasActionEdge)
 */
function statementHasAction(e: SearchEdge, p: Params): string {
  const targets = e.targetIds();
  const classes = e.targetClasses();
  if (!targets && !classes.length) {
    return `${isClass("e", S)} AND jsonb_path_exists(e.doc, '$.data.actions[*].actionId')`;
  }
  return `${isClass("e", S)} AND ${idsMatch(p, collected(["$.data.actions[*].actionId"], "e.doc"), targets, classes)}`;
}

/** every id the two statement indexes cover: actions, actants, tags, the direct territory, in-statement prop types and values */
const STATEMENT_INDEXED_PATHS = [
  "$.data.actions[*].actionId",
  "$.data.actants[*].entityId",
  "$.data.tags[*]",
  "$.data.territory.territoryId",
  ...statementPropPaths("type"),
  ...statementPropPaths("value"),
];

/** statements referencing a target where the indexes look; unpinned: every statement, or those referencing an entity of the classes (runStatementHasEntityEdge) */
function statementHasEntity(e: SearchEdge, p: Params): string {
  const targets = e.targetIds();
  const classes = e.targetClasses();
  if (targets) {
    return (
      `${isClass("e", S)} AND (${p.index(TABLE.entities, DbEnums.Indexes.StatementEntities, targets)}` +
      ` OR ${p.index(TABLE.entities, DbEnums.Indexes.StatementDataProps, targets)})`
    );
  }
  if (!classes.length) {
    return isClass("e", S);
  }
  return `${isClass("e", S)} AND ${hasIdOfClasses(p, collected(STATEMENT_INDEXED_PATHS, "e.doc"), classes)}`;
}

/** the entities in `positions` of the target statements (runIsInStatementActantEdge) */
const isInStatementAs = (e: SearchEdge, p: Params, positions: EntityEnums.Position[]): string =>
  `e.id IN (SELECT a->>'entityId' FROM ${ENTITIES} s, ${ACTANTS("s")} WHERE ${isClass("s", S)} AND ${targetStatements(e, p)}` +
  ` AND a->>'position' = ${anyOf(p, positions)})`;

/** the actions of the target statements (runIsInStatementActionEdge) */
const isInStatementAsAction = (e: SearchEdge, p: Params): string =>
  `e.id IN (SELECT ac->>'actionId' FROM ${ENTITIES} s, jsonb_array_elements(${arr("s.doc->'data'->'actions'")}) ac` +
  ` WHERE ${isClass("s", S)} AND ${targetStatements(e, p)})`;

/**
 * Every id collectStatementEntityIds gathers from one statement: its own
 * props, references, actions with their props, actants with classifications,
 * identifications and props, tags. The reference paths are strict because
 * ReQL reads references only when they are an array; a strict path over
 * anything else yields nothing.
 */
const STATEMENT_ENTITY_PATHS = [
  ...propPaths("$.props[*]", 3),
  "strict $.references[*].resource",
  "strict $.references[*].value",
  "$.data.actions[*].actionId",
  ...propPaths("$.data.actions[*].props[*]", 3),
  "$.data.actants[*].entityId",
  "$.data.actants[*].classifications[*].entityId",
  "$.data.actants[*].identifications[*].entityId",
  ...propPaths("$.data.actants[*].props[*]", 3),
  "$.data.tags[*]",
];

/** entities used anywhere in the statements `cands` selects (SQL over the statement row `s`) */
const usedInStatements = (cands: string): string =>
  `e.id IN (SELECT unnest(${collected(STATEMENT_ENTITY_PATHS, "s.doc")}) FROM ${ENTITIES} s WHERE ${isClass("s", S)} AND ${cands})`;

// ---- territories ----------------------------------------------------------

const PARENT_ID = (x: string): string => `${x}.parent_id`;
/** the root carries `parent: false`, every other territory an object */
const HAS_PARENT = (x: string): string => `jsonb_typeof(${x}.doc->'data'->'parent') = 'object'`;

/** territories holding a target below them at `depth`; unpinned: every territory with a child (runTerritoryHasChildEdge) */
function territoryHasChild(e: SearchEdge, p: Params, depth: "direct" | "any"): string {
  if (e.targetIds() === null) {
    return `e.id IN (SELECT ${PARENT_ID("t")} FROM ${ENTITIES} t WHERE ${isClass("t", T)} AND ${HAS_PARENT("t")})`;
  }
  const ancestors = e.ancestorIds(depth);
  return ancestors.length ? `e.id = ${anyOf(p, ancestors)}` : "FALSE";
}

/** territories below a target: its whole subtree with SUB, else its direct children; unpinned: every territory with a parent (EdgeTerritoryHasParent) */
function territoryHasParent(e: SearchEdge, p: Params): string {
  const targets = e.targetIds();
  if (targets === null) {
    return `${isClass("e", T)} AND ${HAS_PARENT("e")}`;
  }
  if (e.anyDepth()) {
    const below = e.descendants();
    return below.length ? `e.id = ${anyOf(p, below)}` : "FALSE";
  }
  return `${HAS_PARENT("e")} AND ${PARENT_ID("e")} = ${anyOf(p, targets)}`;
}

/** statements under a target territory through the index; unpinned: every statement with a territory (EdgeSUnderT) */
function statementUnderTerritory(e: SearchEdge, p: Params): string {
  const targets = e.targetIds();
  if (targets) {
    return `${isClass("e", S)} AND ${p.index(TABLE.entities, DbEnums.Indexes.StatementTerritory, targets)}`;
  }
  return `${isClass("e", S)} AND ${nonEmpty("e.territory_id")}`;
}

/** the direct territories of the target statements (EdgeTerritoryHasStatement) */
const territoryHasStatement = (e: SearchEdge, p: Params): string =>
  `e.id IN (SELECT s.territory_id FROM ${ENTITIES} s WHERE ${isClass("s", S)} AND ${targetStatements(e, p)})`;

/** SQL over alias `e` for each edge type; a type missing here is unknown to the evaluator */
export const PREDICATES: Record<string, Predicate> = {
  "R:": anyRelation,
  ...fromMap(ORDERED, (type) => (e, p) => relationTarget(e, p, type)),
  ...fromMap(INVERSE_ORDERED, (type) => (e, p) => relationTarget(e, p, type, true)),
  ...fromMap(UNORDERED, (type) => (e, p) => unorderedRelation(e, p, type)),
  "EP:T": (e, p) => hasProp(e, p, "type", false),
  "HP:V": (e, p) => hasProp(e, p, "value", true),
  "I_EP:T": (e, p) => isProp(e, p, "type"),
  "I_HP:V": (e, p) => isProp(e, p, "value"),
  "HR:R": (e, p) => hasReference(e, p, "resource"),
  "HR:V": (e, p) => hasReference(e, p, "value"),
  "I_HR:R": isReferenceResource,
  "SP:T": (e, p) => statementHasProp(e, p, "type", false),
  "SP:V": (e, p) => statementHasProp(e, p, "value", true),
  "I_SP:T": (e, p) => isStatementProp(e, p, "type", false),
  "I_SP:V": (e, p) => isStatementProp(e, p, "value", true),
  SC: (e, p) => statementHasActantField(e, p, "classifications"),
  SI: (e, p) => statementHasActantField(e, p, "identifications"),
  I_SC: (e, p) => isActantField(e, p, "classifications"),
  I_SI: (e, p) => isActantField(e, p, "identifications"),
  "I_IS:": statementHasEntity,
  "I_IS:S": (e, p) => statementHasActant(e, p, [EntityEnums.Position.Subject]),
  "I_IS:A1": (e, p) => statementHasActant(e, p, [EntityEnums.Position.Actant1]),
  "I_IS:A2": (e, p) => statementHasActant(e, p, [EntityEnums.Position.Actant2]),
  "I_IS:PS": (e, p) => statementHasActant(e, p, [EntityEnums.Position.PseudoActant]),
  "I_IS:A": statementHasAction,
  "IS:": (e, p) => usedInStatements(targetStatements(e, p)),
  "IS:S": (e, p) => isInStatementAs(e, p, [EntityEnums.Position.Subject]),
  "IS:A1": (e, p) => isInStatementAs(e, p, [EntityEnums.Position.Actant1]),
  "IS:A2": (e, p) => isInStatementAs(e, p, [EntityEnums.Position.Actant2]),
  "IS:PS": (e, p) => isInStatementAs(e, p, [EntityEnums.Position.PseudoActant]),
  "IS:A": isInStatementAsAction,
  "SUT:": statementUnderTerritory,
  "I_SUT:": territoryHasStatement,
  "EUT:": (e, p) => {
    const targets = e.targetIds();
    return usedInStatements(targets ? p.index(TABLE.entities, DbEnums.Indexes.StatementTerritory, targets) : "TRUE");
  },
  "CT:": (e, p) => territoryHasChild(e, p, "any"),
  "CT:D": (e, p) => territoryHasChild(e, p, "direct"),
  "I_CT:": territoryHasParent,
};

export function getEdgeInstance(data: Partial<Query.IEdge>, resolvers?: ExploreResolvers): SearchEdge {
  // the type comes from the request body, so inherited Object.prototype keys must not count as known
  if (!data.type || !Object.prototype.hasOwnProperty.call(PREDICATES, data.type)) {
    throw new InternalServerError(`unknown edge type: ${data.type}`);
  }
  const edge = new SearchEdge(data);
  if (resolvers) {
    edge.setResolvers(resolvers);
  }
  return edge;
}
