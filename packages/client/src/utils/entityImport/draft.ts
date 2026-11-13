import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IResponseDetail, ITerritory, Relation } from "@inkvisitor/shared/types";
import { EntityWrites, LOCAL_WRITE_RESPONSE } from "hooks/useEntityEditing";
import { v4 as uuidv4 } from "uuid";
import { AppendInfo, applyConflictChoice } from "./appendMerge";
import { buildEntityJson } from "./entityJson";
import { count, getAtPath, isPlainObject, setAtPath, unique } from "./helpers";
import { normalizeEntities } from "./normalizeEntities";
import { collectEntityRefs } from "./references";
import { ImportIssue, ImportPlan } from "./types";

/**
 * The entities of an import while they are edited in the modal, before any of
 * them exists in the database. Relations are kept in one list, since a
 * relation between two drafts belongs to both.
 */
export interface ImportDraft {
  entities: IEntity[];
  relations: Relation.IRelation[];
  // database entities the drafts refer to, for showing them as tags
  existing: Record<string, IEntity>;
  // the stored synonym group of each database entity in a draft synonym
  // relation (empty: it has none), loaded after the drafts open; Detail shows
  // the whole group the relation will join, but only the draft relation is
  // written, and the server merges the groups
  storedSynonyms?: Record<string, string[]>;
  // Values made for slots naming a stored Value: like a copy Detail makes on a
  // drop, they get no tab, show in their slot and are created only while a
  // draft still points at them
  valueCopyIds?: string[];
  // drafts whose id is taken: the stored entity with what the import adds;
  // their relations here are only the new ones
  appends?: Record<string, AppendInfo>;
  // drafts the user left out of the import; they keep their place and their
  // links, and come back when switched on again
  leftOutIds?: string[];
}

export const draftFromPlan = (plan: ImportPlan): ImportDraft => ({
  entities: plan.entities,
  relations: plan.relations,
  existing: plan.existingEntities,
  valueCopyIds: plan.valueCopyIds,
  appends: plan.appends,
});

/** The stored entities the drafts append to, as they were when merged. */
export const appendTargetsOf = (draft: ImportDraft): Record<string, IEntity> =>
  Object.fromEntries(
    Object.entries(draft.appends ?? {}).map(([entityId, append]) => [entityId, append.stored])
  );

/**
 * The drafts with one entity id replaced by another wherever it appears: as an
 * entity's own id, in metaprops, references, territory data and relations.
 */
export const replaceEntityId = (draft: ImportDraft, fromId: string, toId: string): ImportDraft => {
  const swap = (id: string) => (id === fromId ? toId : id);
  const swapProps = (props: IProp[]): IProp[] =>
    props.map((prop) => ({
      ...prop,
      type: { ...prop.type, entityId: swap(prop.type.entityId) },
      value: { ...prop.value, entityId: swap(prop.value.entityId) },
      children: swapProps(prop.children),
    }));
  const swapData = (entity: IEntity) => {
    if (entity.class !== EntityEnums.Class.Territory) {
      return entity.data;
    }
    const { parent, protocol } = (entity as ITerritory).data;
    return {
      ...entity.data,
      ...(parent ? { parent: { ...parent, territoryId: swap(parent.territoryId) } } : {}),
      ...(protocol
        ? {
            protocol: Object.fromEntries(
              Object.entries(protocol).map(([key, value]) => [
                key,
                Array.isArray(value) ? value.map(swap) : swap(value as string),
              ])
            ),
          }
        : {}),
    };
  };
  return {
    ...draft,
    entities: draft.entities.map((entity) => ({
      ...entity,
      id: swap(entity.id),
      props: swapProps(entity.props),
      references: entity.references.map((reference) => ({
        ...reference,
        resource: swap(reference.resource),
        value: swap(reference.value),
      })),
      data: swapData(entity),
    })),
    relations: draft.relations.map((relation) => ({
      ...relation,
      entityIds: relation.entityIds.map(swap),
    })),
    leftOutIds: draft.leftOutIds?.map(swap),
  };
};

/**
 * The drafts validated again after one was appended to a stored entity. The
 * copies of stored Values come back as Values of the input and keep being
 * copies; the drafts appended before keep their settled conflicts; the drafts
 * left out stay left out, so the validation has to include them.
 */
export const draftAfterAppend = (previous: ImportDraft, plan: ImportPlan): ImportDraft => {
  const ids = new Set(plan.entities.map((entity) => entity.id));
  const keptAppends = Object.entries(previous.appends ?? {}).filter(([id]) => id in plan.appends);
  return {
    ...draftFromPlan(plan),
    valueCopyIds: [
      ...(previous.valueCopyIds ?? []).filter((id) => ids.has(id)),
      ...plan.valueCopyIds,
    ],
    appends: { ...plan.appends, ...Object.fromEntries(keptAppends) },
    storedSynonyms: previous.storedSynonyms,
    leftOutIds: previous.leftOutIds?.filter((id) => ids.has(id)),
  };
};

/** What undoing one "append to it" needs, taken just before the append. */
export interface AppendUndo {
  entityId: string;
  storedId: string;
  // the draft as it was
  entity: IEntity;
  // the links of the other drafts to it
  links: { ownerId: string; path: string }[];
  // its relations as they were
  relations: Relation.IRelation[];
  // the entities it points at; the append may leave out some of them
  entities: IEntity[];
  // which of those are Value copies
  copyIds: string[];
}

export const appendUndoOf = (
  draft: ImportDraft,
  entityId: string,
  storedId: string
): AppendUndo => {
  const ownerOf = (index: number) => draft.entities[index - 1].id;
  const refs = collectEntityRefs(
    draft.entities.map((entity, position) => ({ index: position + 1, entity, rawRelations: [] }))
  );
  const pointedAt = new Set(
    refs.filter((ref) => ownerOf(ref.entityIndex) === entityId).map((ref) => ref.id)
  );
  const entities = draft.entities.filter((entity) => pointedAt.has(entity.id));
  return {
    entityId,
    storedId,
    entity: draft.entities.find((entity) => entity.id === entityId)!,
    links: refs
      .filter((ref) => ref.id === entityId && ownerOf(ref.entityIndex) !== entityId)
      .map((ref) => ({ ownerId: ownerOf(ref.entityIndex), path: ref.path })),
    relations: draft.relations.filter((relation) => relation.entityIds.includes(entityId)),
    entities,
    copyIds: entities.filter((entity) => isValueCopy(draft, entity.id)).map((entity) => entity.id),
  };
};

/**
 * The undo of an earlier append after a later "append to it" gave another
 * draft a stored id, so undoing the earlier one keeps the later one.
 */
export const replaceUndoEntityId = (
  undo: AppendUndo,
  fromId: string,
  toId: string
): AppendUndo => {
  const swap = (id: string) => (id === fromId ? toId : id);
  const replaced = replaceEntityId(
    { entities: [undo.entity, ...undo.entities], relations: undo.relations, existing: {} },
    fromId,
    toId
  );
  const [entity, ...entities] = replaced.entities;
  return {
    ...undo,
    entity,
    entities,
    relations: replaced.relations,
    links: undo.links.map((link) => ({ ...link, ownerId: swap(link.ownerId) })),
    copyIds: undo.copyIds.map(swap),
  };
};

/**
 * Undoes one "append to it". The draft comes back as it was before the
 * append, the links the append moved to the stored entity point at it again,
 * and so do its relations; the other drafts keep every change made since. A
 * link changed since to point elsewhere stays as it is.
 */
export const undoAppend = (draft: ImportDraft, undo: AppendUndo): ImportDraft => {
  const { entityId, storedId } = undo;
  const swapBack = (id: string) => (id === storedId ? entityId : id);
  const present = new Set(draft.entities.map((entity) => entity.id));

  const entities = draft.entities.map((entity) => {
    if (entity.id === storedId) {
      return undo.entity;
    }
    const links = undo.links.filter((link) => link.ownerId === entity.id);
    if (!links.length) {
      return entity;
    }
    const copy = structuredClone(entity);
    links.forEach(({ path }) => {
      if (getAtPath(copy, path) === storedId) {
        setAtPath(copy, path, entityId);
      }
    });
    return copy;
  });
  // what the append left out as already stored comes back with the draft
  const restored = undo.entities.filter((entity) => !present.has(entity.id));

  // the relations the append moved to the stored entity, or left out as
  // stored, are replaced by the ones the draft had
  const sameMembers = (relation: Relation.IRelation, original: Relation.IRelation) =>
    relation.type === original.type &&
    relation.entityIds.length === original.entityIds.length &&
    relation.entityIds.every((id) => original.entityIds.includes(swapBack(id)));
  const relations = draft.relations.filter(
    (relation) =>
      !relation.entityIds.includes(storedId) ||
      !undo.relations.some((original) => sameMembers(relation, original))
  );

  const appends = { ...draft.appends };
  delete appends[storedId];
  return {
    ...draft,
    entities: [...entities, ...restored],
    relations: [...relations, ...undo.relations],
    appends,
    valueCopyIds: [
      ...(draft.valueCopyIds ?? []),
      ...undo.copyIds.filter((id) => !present.has(id)),
    ],
    leftOutIds: draft.leftOutIds?.map(swapBack),
  };
};

/** Settles one conflict of an appended draft to the stored or the imported value. */
export const setConflictChoice = (
  draft: ImportDraft,
  entityId: string,
  conflictIndex: number,
  useImported: boolean
): ImportDraft => {
  const append = draft.appends?.[entityId];
  const conflict = append?.conflicts[conflictIndex];
  if (!append || !conflict) {
    return draft;
  }
  return {
    ...draft,
    entities: draft.entities.map((entity) =>
      entity.id === entityId ? applyConflictChoice(entity, conflict, useImported) : entity
    ),
    appends: {
      ...draft.appends,
      [entityId]: {
        ...append,
        conflicts: append.conflicts.map((candidate, index) =>
          index === conflictIndex ? { ...candidate, useImported } : candidate
        ),
      },
    },
  };
};

/**
 * Settles every conflict of every appended draft to the stored or the
 * imported value; a conflict already settled that way is left as it is.
 */
export const setAllConflictChoices = (draft: ImportDraft, useImported: boolean): ImportDraft =>
  Object.entries(draft.appends ?? {}).reduce(
    (current, [entityId, append]) =>
      append.conflicts.reduce(
        (next, conflict, conflictIndex) =>
          conflict.useImported === useImported
            ? next
            : setConflictChoice(next, entityId, conflictIndex, useImported),
        current
      ),
    draft
  );

const isValueCopy = (draft: ImportDraft, entityId: string) =>
  !!draft.valueCopyIds?.includes(entityId);

/** The drafts that have a tab: every one but the Value copies. */
export const tabEntities = (draft: ImportDraft): IEntity[] =>
  draft.entities.filter((entity) => !isValueCopy(draft, entity.id));

/**
 * Applies changes the way the server applies an entity update: nested objects
 * (data) merge, arrays and plain values are replaced.
 */
export const mergeChanges = <T extends object>(target: T, changes: Partial<T>): T => {
  const out = { ...target } as Record<string, unknown>;
  for (const [key, value] of Object.entries(changes)) {
    out[key] =
      isPlainObject(value) && isPlainObject(out[key])
        ? mergeChanges(out[key] as Record<string, unknown>, value)
        : value;
  }
  return out as T;
};

// the data of one class does not fit another, so a class change starts over
// from the defaults of the new class
const defaultDataFor = (entityClass: IEntity["class"]): object =>
  normalizeEntities([{ class: entityClass, labels: ["-"] }], {
    defaultLanguage: "" as IEntity["language"],
  }).entities[0].entity.data;

export const updateDraftEntity = (
  draft: ImportDraft,
  entityId: string,
  changes: Partial<IEntity>
): ImportDraft => ({
  ...draft,
  entities: draft.entities.map((entity) => {
    if (entity.id !== entityId) {
      return entity;
    }
    if (changes.class && changes.class !== entity.class) {
      return { ...mergeChanges(entity, changes), data: defaultDataFor(changes.class) };
    }
    return mergeChanges(entity, changes);
  }),
});

export const createDraftRelation = (
  draft: ImportDraft,
  relation: Relation.IRelation
): ImportDraft => ({ ...draft, relations: [...draft.relations, relation] });

export const updateDraftRelation = (
  draft: ImportDraft,
  relationId: string,
  changes: Partial<Relation.IRelation>
): ImportDraft => ({
  ...draft,
  relations: draft.relations.map((relation) =>
    relation.id === relationId ? mergeChanges(relation, changes) : relation
  ),
});

/**
 * Puts the given relations in the given order. A draft keeps no order values:
 * relations are shown and created in list order, and the server appends each
 * new relation last, so the list order is the order they end up with.
 */
export const reorderDraftRelations = (draft: ImportDraft, orderedIds: string[]): ImportDraft => {
  const byId = new Map(draft.relations.map((relation) => [relation.id, relation]));
  const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as Relation.IRelation[];
  let next = 0;
  return {
    ...draft,
    // the moved relations take the slots they held before, in the new order
    relations: draft.relations.map((relation) =>
      orderedIds.includes(relation.id) ? reordered[next++] : relation
    ),
  };
};

export const deleteDraftRelation = (draft: ImportDraft, relationId: string): ImportDraft => ({
  ...draft,
  relations: draft.relations.filter((relation) => relation.id !== relationId),
});

/**
 * Removes every link to `removedId` from one draft: a metaprop typed by it
 * goes (with its children), a metaprop or reference value pointing at it is
 * cleared, a reference to it as resource goes, protocol entries go, and a
 * territory under it moves to `newParentId`.
 */
export const unlinkEntity = (
  entity: IEntity,
  removedId: string,
  newParentId: string | undefined
): { entity: IEntity; changes: string[] } => {
  let removedProps = 0;
  let clearedProps = 0;
  const cleanProps = (props: IProp[]): IProp[] =>
    props
      .filter((prop) => {
        if (prop.type.entityId === removedId) {
          removedProps++;
          return false;
        }
        return true;
      })
      .map((prop) => {
        const value =
          prop.value.entityId === removedId
            ? (clearedProps++, { ...prop.value, entityId: "" })
            : prop.value;
        return { ...prop, value, children: cleanProps(prop.children) };
      });
  const props = cleanProps(entity.props);

  let removedReferences = 0;
  let clearedReferences = 0;
  const references = entity.references
    .filter((reference) => {
      if (reference.resource === removedId) {
        removedReferences++;
        return false;
      }
      return true;
    })
    .map((reference) =>
      reference.value === removedId
        ? (clearedReferences++, { ...reference, value: "" })
        : reference
    );

  const changes: string[] = [];
  if (removedProps) changes.push(`${count(removedProps, "metaprop", "metaprops")} removed`);
  if (clearedProps) changes.push(`${count(clearedProps, "metaprop value", "metaprop values")} cleared`);
  if (removedReferences) changes.push(`${count(removedReferences, "reference", "references")} removed`);
  if (clearedReferences) changes.push(`${count(clearedReferences, "reference value", "reference values")} cleared`);

  let data = entity.data;
  if (entity.class === EntityEnums.Class.Territory) {
    const territoryData = (entity as ITerritory).data;
    const nextData = { ...territoryData };
    if (territoryData.parent && territoryData.parent.territoryId === removedId && newParentId) {
      nextData.parent = { ...territoryData.parent, territoryId: newParentId };
      changes.push("moved to the parent of the left-out territory");
    }
    if (territoryData.protocol) {
      const protocol = { ...territoryData.protocol } as unknown as Record<string, string | string[]>;
      let removedEntries = 0;
      for (const [key, value] of Object.entries(protocol)) {
        if (Array.isArray(value) && value.includes(removedId)) {
          protocol[key] = value.filter((id) => id !== removedId);
          removedEntries++;
        } else if (value === removedId) {
          protocol[key] = "";
          removedEntries++;
        }
      }
      if (removedEntries) {
        nextData.protocol = protocol as unknown as ITerritory["data"]["protocol"];
        changes.push(`${count(removedEntries, "protocol entry", "protocol entries")} removed`);
      }
    }
    data = nextData;
  }

  return { entity: changes.length ? { ...entity, props, references, data } : entity, changes };
};

const isAsymmetrical = (type: RelationEnums.Type) =>
  !!Relation.RelationRules[type]?.asymmetrical;

/** The relation's members plus, for a synonym, the stored groups it joins. */
const shownEntityIds = (draft: ImportDraft, relation: Relation.IRelation): string[] =>
  relation.type === RelationEnums.Type.Synonym
    ? unique([
        ...relation.entityIds,
        ...relation.entityIds.flatMap((id) => draft.storedSynonyms?.[id] ?? []),
      ])
    : relation.entityIds;

/** Database entities in draft synonyms whose stored group is not loaded yet. */
export const missingSynonymGroupIds = (draft: ImportDraft): string[] => {
  const draftIds = new Set(draft.entities.map((entity) => entity.id));
  return unique(
    draft.relations
      .filter((relation) => relation.type === RelationEnums.Type.Synonym)
      .flatMap((relation) => relation.entityIds)
      .filter((id) => !draftIds.has(id) && !(id in (draft.storedSynonyms ?? {})))
  );
};

/**
 * Applies new members to a draft synonym. The members Detail shows only from
 * stored groups are dropped, as the draft relation never holds them; a group
 * left with fewer than two members, or with no draft, is removed.
 */
const setSynonymMembers = (
  draft: ImportDraft,
  relationId: string,
  entityIds: string[]
): ImportDraft => {
  const relation = draft.relations.find((candidate) => candidate.id === relationId);
  if (!relation) {
    return draft;
  }
  const shownOnly = shownEntityIds(draft, relation).filter(
    (id) => !relation.entityIds.includes(id)
  );
  const members = entityIds.filter((id) => !shownOnly.includes(id));
  const hasDraft = members.some((id) => draft.entities.some((entity) => entity.id === id));
  return members.length < 2 || !hasDraft
    ? deleteDraftRelation(draft, relationId)
    : updateDraftRelation(draft, relationId, { entityIds: members });
};

/**
 * What the detail endpoint would answer for a draft, so Detail renders it as
 * it renders a stored entity: the entities it shows as tags, and its relations
 * split into its own (connections) and those pointing at it (iConnections).
 * Relations come as their first level; drafts have no usages or warnings.
 */
export const buildDraftDetail = (
  draft: ImportDraft,
  entityId: string,
  right: UserEnums.RoleMode
): IResponseDetail | undefined => {
  const entity = draft.entities.find((candidate) => candidate.id === entityId);
  if (!entity) {
    return undefined;
  }

  const relations = {} as Relation.IUsedRelations;
  for (const type of RelationEnums.AllTypes) {
    const ofType = draft.relations.filter((relation) => relation.type === type);
    (relations as Record<string, Relation.IDetailType<Relation.IRelation>>)[type] = {
      connections: ofType
        .filter((relation) =>
          isAsymmetrical(type)
            ? relation.entityIds[0] === entityId
            : relation.entityIds.includes(entityId)
        )
        .map((relation) => ({ ...relation, entityIds: shownEntityIds(draft, relation) })),
      iConnections: isAsymmetrical(type)
        ? ofType.filter((relation) => relation.entityIds.slice(1).includes(entityId))
        : [],
    };
  }

  return {
    ...entity,
    right,
    entities: {
      ...draft.existing,
      ...Object.fromEntries(draft.entities.map((candidate) => [candidate.id, candidate])),
    },
    usedInStatements: [],
    usedInStatementProps: [],
    usedInMetaProps: [],
    usedInDocuments: [],
    usedInStatementIdentifications: [],
    usedInStatementClassifications: [],
    usedInReferences: [],
    usedInReferenceParts: [],
    usedAsTemplate: [],
    relations,
    warnings: [],
  };
};

/**
 * The drafts the import leaves out, each with the draft that is the reason:
 * a draft the user left out names itself; a draft that points at a left-out
 * one through a metaprop, a reference or its parent territory can't be created
 * without it and names that one; and a Value of the input that only left-out
 * drafts point at names the first of them.
 */
export const leftOutDrafts = (draft: ImportDraft): Map<string, string> => {
  const leftOut = new Map((draft.leftOutIds ?? []).map((entityId) => [entityId, entityId]));
  if (!leftOut.size) {
    return leftOut;
  }
  const links = collectEntityRefs(
    draft.entities.map((entity, position) => ({ index: position + 1, entity, rawRelations: [] }))
  ).map((ref) => ({ from: draft.entities[ref.entityIndex - 1].id, to: ref.id }));
  const values = new Set(
    tabEntities(draft)
      .filter((entity) => entity.class === EntityEnums.Class.Value)
      .map((entity) => entity.id)
  );
  // each round can leave out more, so it runs until a round adds nothing
  let grew = true;
  while (grew) {
    grew = false;
    for (const { from, to } of links) {
      if (!leftOut.has(from) && leftOut.has(to)) {
        leftOut.set(from, to);
        grew = true;
      }
    }
    for (const valueId of values) {
      const users = links.filter((link) => link.to === valueId).map((link) => link.from);
      if (!leftOut.has(valueId) && users.length && users.every((user) => leftOut.has(user))) {
        leftOut.set(valueId, users[0]);
        grew = true;
      }
    }
  }
  return leftOut;
};

/** Leaves the draft out of the import, or brings it back. */
export const toggleLeftOut = (draft: ImportDraft, entityId: string): ImportDraft => {
  const leftOutIds = draft.leftOutIds ?? [];
  return {
    ...draft,
    leftOutIds: leftOutIds.includes(entityId)
      ? leftOutIds.filter((id) => id !== entityId)
      : [...leftOutIds, entityId],
  };
};

/** The draft entity a relation is written under in the import JSON. */
const relationOwner = (draft: ImportDraft, relation: Relation.IRelation): string | undefined =>
  isAsymmetrical(relation.type)
    ? relation.entityIds[0]
    : relation.entityIds.find((id) => draft.entities.some((entity) => entity.id === id));

// the entities draftToImportJson lists, in its order
const importJsonEntities = (draft: ImportDraft): IEntity[] => {
  const leftOut = leftOutDrafts(draft);
  const included = tabEntities(draft).filter((entity) => !leftOut.has(entity.id));
  // a Value copy no draft points at any more is not created
  const pointedAt = new Set(
    collectEntityRefs(
      included.map((entity, position) => ({ index: position + 1, entity, rawRelations: [] }))
    ).map((ref) => ref.id)
  );
  return draft.entities.filter((entity) =>
    isValueCopy(draft, entity.id) ? pointedAt.has(entity.id) : !leftOut.has(entity.id)
  );
};

// A relation keeps out the left-out drafts: a synonym cloud only drops them
// as members, any other relation goes with them.
const importJsonRelations = (draft: ImportDraft): Relation.IRelation[] => {
  const leftOut = leftOutDrafts(draft);
  return draft.relations
    .map((relation) =>
      Relation.RelationRules[relation.type]?.cloudType
        ? { ...relation, entityIds: relation.entityIds.filter((id) => !leftOut.has(id)) }
        : relation
    )
    .filter(
      (relation) =>
        relation.entityIds.length >= 2 && relation.entityIds.every((id) => !leftOut.has(id))
    );
};

/**
 * The issues of a validation of draftToImportJson(draft), each with the id of
 * the draft it is about; the ids stay right when tabs close afterwards.
 */
export const issuesWithEntityIds = (draft: ImportDraft, issues: ImportIssue[]): ImportIssue[] => {
  const entities = importJsonEntities(draft);
  return issues.map((issue) =>
    issue.entityIndex ? { ...issue, entityId: entities[issue.entityIndex - 1]?.id } : issue
  );
};

/**
 * The drafts in the import format, each relation listed once under the entity
 * it belongs to, so the edited drafts pass through the same validation as
 * pasted JSON. The drafts left out are not in it.
 */
export const draftToImportJson = (draft: ImportDraft): object[] => {
  const relations = importJsonRelations(draft);
  return importJsonEntities(draft).map((entity) => ({
    ...buildEntityJson(entity, undefined),
    relations: relations
      .filter((relation) => relationOwner(draft, relation) === entity.id)
      .map((relation) => ({
        type: relation.type,
        entityIds: relation.entityIds,
        ...(relation.type === RelationEnums.Type.Identification
          ? { certainty: (relation as Relation.IIdentification).certainty }
          : {}),
      })),
  }));
};

/** Entities the drafts refer to that are neither drafts nor loaded yet. */
export const missingEntityIds = (draft: ImportDraft): string[] => {
  const known = new Set([
    ...Object.keys(draft.existing),
    ...draft.entities.map((entity) => entity.id),
  ]);
  const refs = collectEntityRefs(
    draft.entities.map((entity, position) => ({ index: position + 1, entity, rawRelations: [] }))
  ).map((ref) => ref.id);
  const relationIds = draft.relations.flatMap((relation) => shownEntityIds(draft, relation));
  return unique([...refs, ...relationIds]).filter((id) => !known.has(id));
};

/**
 * Detail's writes for the drafts: each one changes the draft through
 * `change`, and nothing reaches the database.
 */
export const createDraftWrites = (
  change: (update: (draft: ImportDraft) => ImportDraft) => void
): EntityWrites => {
  const settle = (update: (draft: ImportDraft) => ImportDraft) => {
    change(update);
    return Promise.resolve(LOCAL_WRITE_RESPONSE);
  };

  return {
    updateEntity: (entity, changes) =>
      settle((draft) => updateDraftEntity(draft, entity.id, changes)),
    createRelation: (relation) => settle((draft) => createDraftRelation(draft, relation)),
    updateRelation: (relationId, changes) =>
      settle((draft) => {
        const relation = draft.relations.find((candidate) => candidate.id === relationId);
        return relation?.type === RelationEnums.Type.Synonym && changes.entityIds
          ? setSynonymMembers(draft, relationId, changes.entityIds)
          : updateDraftRelation(draft, relationId, changes);
      }),
    deleteRelation: (relationId) => settle((draft) => deleteDraftRelation(draft, relationId)),
    moveRelation: (siblings, relationId, index) => {
      const ids = siblings.map((relation) => relation.id).filter((id) => id !== relationId);
      ids.splice(index, 0, relationId);
      return settle((draft) => reorderDraftRelations(draft, ids));
    },
    // a draft joins its own group; groups of stored entities are merged by
    // the server when the import creates the relation
    joinSynonymGroup: (entity, memberId, ownGroup) =>
      ownGroup
        ? settle((draft) =>
            setSynonymMembers(draft, ownGroup.id, [...ownGroup.entityIds, memberId])
          )
        : settle((draft) =>
            createDraftRelation(draft, {
              id: uuidv4(),
              entityIds: [entity.id, memberId],
              type: RelationEnums.Type.Synonym,
            })
          ),
  };
};
