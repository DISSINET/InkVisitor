import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { unique } from "./helpers";
import { normalizeEntities } from "./normalizeEntities";
import { parseImportInput } from "./parse";
import { collectEntityRefs, validateBatchIds, validateEntityRefs } from "./references";
import { normalizeRelationItems, validateRelations } from "./relations";
import { validateTerritories } from "./territories";
import { ImportDataSource, ImportIssue, ImportValidation } from "./types";

/** Issues grouped by entity in input order; issues of no single entity last. */
const byEntity = (issues: ImportIssue[]): ImportIssue[] =>
  [...issues].sort(
    (a, b) => (a.entityIndex ?? Infinity) - (b.entityIndex ?? Infinity)
  );

export interface ImportValidationContext {
  role: UserEnums.Role;
  defaultLanguage: EntityEnums.Language;
  source: ImportDataSource;
}

/**
 * Runs every check on the pasted text and, when nothing blocks the import,
 * returns the plan of what gets created. All errors are collected; the checks
 * never stop at the first one.
 */
export const validateImport = async (
  text: string,
  context: ImportValidationContext
): Promise<ImportValidation> => {
  const parsed = parseImportInput(text);
  if (parsed.errors.length) {
    return { errors: parsed.errors, notes: [], plan: null };
  }

  const normalized = normalizeEntities(parsed.items, {
    defaultLanguage: context.defaultLanguage,
  });
  const relationItems = normalizeRelationItems(normalized.entities);
  const errors = [...normalized.errors, ...relationItems.errors];
  const notes = [...normalized.notes, ...relationItems.notes];

  const entities = normalized.entities;
  const batchIds = unique(entities.map(({ entity }) => entity.id));
  const batch = new Map<string, IEntity>();
  entities.forEach(({ entity }) => batch.has(entity.id) || batch.set(entity.id, entity));

  // one request answers both which input ids are taken and which referenced
  // entities exist
  const refs = collectEntityRefs(entities);
  const referencedIds = unique([
    ...refs.map((ref) => ref.id),
    ...relationItems.items.flatMap((item) => item.relation.entityIds),
  ]).filter((entityId) => !batch.has(entityId));
  const requestedIds = unique([...batchIds, ...referencedIds]);
  const found = requestedIds.length ? await context.source.getEntities(requestedIds) : [];

  const takenIds = new Set(
    found.filter((entity) => batch.has(entity.id)).map((entity) => entity.id)
  );
  const existing = new Map(
    found.filter((entity) => !batch.has(entity.id)).map((entity) => [entity.id, entity])
  );

  errors.push(...validateBatchIds(entities, takenIds));
  errors.push(...validateEntityRefs(refs, batch, existing));

  const territories = validateTerritories(entities, context.role);
  errors.push(...territories.errors);

  const relations = await validateRelations(
    relationItems.items,
    entities,
    existing,
    context.source
  );
  errors.push(...relations.errors);
  notes.push(...relations.notes);

  if (errors.length) {
    return { errors: byEntity(errors), notes: byEntity(notes), plan: null };
  }

  return {
    errors,
    notes: byEntity(notes),
    plan: {
      entities: territories.ordered.map(({ entity }) => entity),
      relations: relations.relations,
      existingEntities: Object.fromEntries(existing),
    },
  };
};
