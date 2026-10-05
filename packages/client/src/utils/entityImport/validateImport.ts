import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { unlinkEntity } from "./draft";
import { quote, unique } from "./helpers";
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

/** Sets the field at a path such as "props[0].value.entityId". */
const setAtPath = (target: object, path: string, value: string) => {
  const keys = path.match(/[^.[\]]+/g)!;
  let node = target as Record<string, unknown>;
  keys.slice(0, -1).forEach((key) => {
    node = node[key] as Record<string, unknown>;
  });
  node[keys[keys.length - 1]] = value;
};

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
  const notes = [...normalized.notes];

  // the entities lose their links to a left-out statement, so they can still
  // be created
  const leftOutIds = new Set(normalized.leftOutIds);
  const entities = normalized.entities.map((item) => {
    let entity = item.entity;
    const changes: string[] = [];
    leftOutIds.forEach((leftOutId) => {
      const unlinked = unlinkEntity(entity, leftOutId, undefined);
      entity = unlinked.entity;
      changes.push(...unlinked.changes);
    });
    if (changes.length) {
      notes.push({
        entityIndex: item.index,
        label: entity.labels[0],
        message: `${changes.join(", ")} (they pointed at a left-out statement)`,
      });
    }
    return { ...item, entity };
  });

  const relationItems = normalizeRelationItems(entities);
  relationItems.items = relationItems.items.filter((item) => {
    if (!item.relation.entityIds.some((entityId) => leftOutIds.has(entityId))) {
      return true;
    }
    notes.push({
      entityIndex: item.ownerIndex,
      label: entities.find((candidate) => candidate.index === item.ownerIndex)?.entity.labels[0],
      path: item.path,
      message: "removed, it pointed at a left-out statement",
    });
    return false;
  });
  const errors = [...normalized.errors, ...relationItems.errors];
  notes.push(...relationItems.notes);

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

  // A stored Value is never reused: a metaprop or reference that names one
  // gets its own copy, with the labels of the original, as a drop into the
  // slot in Detail makes one. The copies are created with the batch.
  const valueCopies: IEntity[] = [];
  for (const ref of refs) {
    const source = existing.get(ref.id);
    if (source?.class !== EntityEnums.Class.Value) {
      continue;
    }
    const copy = normalizeEntities([{ class: EntityEnums.Class.Value, labels: source.labels }], {
      defaultLanguage: context.defaultLanguage,
    }).entities[0].entity;
    const owner = entities.find((item) => item.index === ref.entityIndex)!.entity;
    setAtPath(owner, ref.path, copy.id);
    valueCopies.push(copy);
    notes.push({
      entityIndex: ref.entityIndex,
      label: ref.label,
      path: ref.path,
      message: `Value ${quote(source.labels[0])} gets a new id ${quote(copy.id)}; a stored Value is never reused`,
    });
  }

  return {
    errors,
    notes: byEntity(notes),
    plan: {
      entities: [...valueCopies, ...territories.ordered.map(({ entity }) => entity)],
      relations: relations.relations,
      existingEntities: Object.fromEntries(existing),
    },
  };
};
