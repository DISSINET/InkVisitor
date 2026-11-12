import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import {
  AppendInfo,
  emptySkips,
  isStale,
  keepStoredIds,
  mergeIntoStored,
  sameEntityBy,
} from "./appendMerge";
import { unlinkEntity } from "./draft";
import { className, quote, setAtPath, unique } from "./helpers";
import { normalizeEntities } from "./normalizeEntities";
import { parseImportInput } from "./parse";
import {
  collectEntityRefs,
  validateBatchIds,
  validateEntityRefs,
} from "./references";
import { normalizeRelationItems, validateRelations } from "./relations";
import { validateTerritories } from "./territories";
import { ImportDataSource, ImportIssue, ImportValidation, maxImportEntities } from "./types";

/** Issues grouped by entity in input order; issues of no single entity last. */
const byEntity = (issues: ImportIssue[]): ImportIssue[] =>
  [...issues].sort(
    (a, b) => (a.entityIndex ?? Infinity) - (b.entityIndex ?? Infinity)
  );

export interface ImportValidationContext {
  role: UserEnums.Role;
  defaultLanguage: EntityEnums.Language;
  source: ImportDataSource;
  // Entities the drafts already append to, as stored when they were merged.
  // Their input is the final state of the entity, merged no more.
  appendTargets?: Record<string, IEntity>;
  // false: a taken id not among appendTargets is an error, not a new append
  allowAppend?: boolean;
}

/** Ids of every entity the stored version of an entity points at. */
const storedRefIds = (stored: IEntity): Set<string> =>
  new Set(collectEntityRefs([{ index: 0, entity: stored, rawRelations: [] }]).map((ref) => ref.id));

/**
 * Runs every check on the pasted text and, when nothing blocks the import,
 * returns the plan of what gets created. All errors are collected; the checks
 * never stop at the first one.
 */
export const validateImport = async (
  text: string,
  context: ImportValidationContext
): Promise<ImportValidation> => {
  const parsed = parseImportInput(text, maxImportEntities(context.role));
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

  const existing = new Map(
    found.filter((entity) => !batch.has(entity.id)).map((entity) => [entity.id, entity])
  );

  // An input entity with a taken id is appended to the stored entity.
  const appendTargets = context.appendTargets ?? {};
  const itemById = new Map(entities.map((item) => [item.entity.id, item]));
  const takenIds = new Set<string>();
  const appends: Record<string, AppendInfo> = {};
  // appended by this validation, merged with the stored entity below
  const toMerge = new Set<string>();
  for (const stored of found.filter((entity) => batch.has(entity.id))) {
    const item = itemById.get(stored.id)!;
    const report = (path: string, message: string) =>
      errors.push({ entityIndex: item.index, label: item.entity.labels[0], path, message });
    const known = appendTargets[stored.id];
    if (known) {
      if (isStale(known, stored)) {
        report(
          "id",
          `${quote(stored.labels[0])} was changed in the database after the import was validated; go back to JSON and validate again`
        );
      }
      appends[stored.id] = { stored: known, conflicts: [], skipped: emptySkips() };
    } else if (context.allowAppend === false) {
      takenIds.add(stored.id);
    } else if (stored.class !== item.entity.class) {
      report(
        "class",
        `${quote(stored.labels[0])} with this id is a ${className(stored.class)} in the database; the import appends only to an entity of the same class`
      );
    } else if (stored.isTemplate) {
      report("id", `${quote(stored.labels[0])} is a template; the import can't append to it`);
    } else {
      appends[stored.id] = { stored, conflicts: [], skipped: emptySkips() };
      toMerge.add(stored.id);
    }
  }
  const appendIds = new Set(Object.keys(appends));

  // what the stored entity already points at was checked when it was saved
  const storedRefsByOwner = new Map(
    Object.entries(appends).map(([entityId, { stored }]) => [entityId, storedRefIds(stored)])
  );
  const ownerIdByIndex = new Map(entities.map((item) => [item.index, item.entity.id]));
  const newRefs = refs.filter(
    (ref) => !storedRefsByOwner.get(ownerIdByIndex.get(ref.entityIndex)!)?.has(ref.id)
  );

  // the entities the stored entities point at, so Detail shows them and the
  // merge can compare Values by their text
  const storedRefsToLoad = unique(
    [...toMerge].flatMap((entityId) => [...storedRefsByOwner.get(entityId)!])
  ).filter((entityId) => !batch.has(entityId) && !existing.has(entityId));
  if (storedRefsToLoad.length) {
    (await context.source.getEntities(storedRefsToLoad)).forEach((entity) =>
      existing.set(entity.id, entity)
    );
  }

  errors.push(...validateBatchIds(entities, takenIds));
  errors.push(...validateEntityRefs(newRefs, batch, existing));

  const territories = validateTerritories(entities, context.role);
  errors.push(...territories.errors);

  const relations = await validateRelations(
    relationItems.items,
    entities,
    existing,
    context.source,
    appendIds
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
  // the input entity each copy was made for
  const copyOwnerIndex = new Map<string, number>();
  for (const ref of newRefs) {
    const source = existing.get(ref.id);
    if (source?.class !== EntityEnums.Class.Value) {
      continue;
    }
    const copy = normalizeEntities([{ class: EntityEnums.Class.Value, labels: source.labels }], {
      defaultLanguage: context.defaultLanguage,
    }).entities[0].entity;
    const owner = itemById.get(ownerIdByIndex.get(ref.entityIndex)!)!.entity;
    setAtPath(owner, ref.path, copy.id);
    valueCopies.push(copy);
    copyOwnerIndex.set(copy.id, ref.entityIndex);
    notes.push({
      entityIndex: ref.entityIndex,
      label: ref.label,
      path: ref.path,
      message: `Value ${quote(source.labels[0])} gets a new id ${quote(copy.id)}; a stored Value is never reused`,
    });
  }

  const entityById = new Map<string, IEntity>([
    ...existing,
    ...valueCopies.map((copy) => [copy.id, copy] as const),
    ...batch,
  ]);
  const same = sameEntityBy((entityId) => entityById.get(entityId));
  const merged = new Map<string, IEntity>();
  for (const item of entities) {
    const stored = appends[item.entity.id]?.stored;
    if (!stored) {
      continue;
    }
    if (toMerge.has(item.entity.id)) {
      const raw = parsed.items[item.index - 1] as Record<string, unknown>;
      const result = mergeIntoStored(stored, item.entity, same, raw.language !== undefined);
      merged.set(item.entity.id, result.entity);
      appends[item.entity.id].conflicts = result.conflicts;
      appends[item.entity.id].skipped = result.skipped;
    } else {
      merged.set(item.entity.id, keepStoredIds(stored, item.entity));
    }
  }

  relations.skipped.forEach((item) => {
    const ownerId = ownerIdByIndex.get(item.ownerIndex)!;
    const appendedId = appends[ownerId]
      ? ownerId
      : item.relation.entityIds.find((entityId) => appends[entityId]);
    if (appendedId) {
      appends[appendedId].skipped.relations++;
    }
  });

  const finalEntities = [...valueCopies, ...territories.ordered.map(({ entity }) => entity)].map(
    (entity) => merged.get(entity.id) ?? entity
  );

  // Values of the input that only skipped metaprops or references used are
  // not created
  const stillUsed = new Set([
    ...collectEntityRefs(
      finalEntities.map((entity, position) => ({ index: position, entity, rawRelations: [] }))
    ).map((ref) => ref.id),
    ...relations.relations.flatMap((relation) => relation.entityIds),
  ]);
  const valueOwners: [string, number][] = [
    ...newRefs
      .filter((ref) => batch.get(ref.id)?.class === EntityEnums.Class.Value)
      .map((ref) => [ref.id, ref.entityIndex] as [string, number]),
    ...copyOwnerIndex,
  ];
  const unusedValueIds = new Set<string>();
  for (const [valueId, ownerIndex] of valueOwners) {
    // a Value two skipped slots used is counted once
    if (unusedValueIds.has(valueId)) {
      continue;
    }
    const ownerId = ownerIdByIndex.get(ownerIndex)!;
    if (toMerge.has(ownerId) && !appendIds.has(valueId) && !stillUsed.has(valueId)) {
      unusedValueIds.add(valueId);
      appends[ownerId].skipped.values++;
    }
  }

  return {
    errors,
    notes: byEntity(notes),
    plan: {
      entities: finalEntities.filter((entity) => !unusedValueIds.has(entity.id)),
      relations: relations.relations,
      existingEntities: Object.fromEntries(existing),
      valueCopyIds: valueCopies
        .filter((copy) => !unusedValueIds.has(copy.id))
        .map((copy) => copy.id),
      appends,
    },
  };
};
