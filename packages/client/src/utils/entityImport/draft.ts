import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IResponseDetail, ITerritory, Relation } from "@inkvisitor/shared/types";
import { EntityWrites, LOCAL_WRITE_RESPONSE } from "hooks/useEntityEditing";
import { v4 as uuidv4 } from "uuid";
import { buildEntityJson } from "./entityJson";
import { isPlainObject, unique } from "./helpers";
import { normalizeEntities } from "./normalizeEntities";
import { collectEntityRefs } from "./references";
import { ImportPlan } from "./types";

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
}

export const draftFromPlan = (plan: ImportPlan): ImportDraft => ({
  entities: plan.entities,
  relations: plan.relations,
  existing: plan.existingEntities,
  valueCopyIds: plan.valueCopyIds,
});

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

/** What leaving an entity out changed in one of the remaining drafts. */
export interface DraftCleanup {
  entityId: string;
  changes: string[];
}

const count = (amount: number, singular: string, plural: string) =>
  `${amount} ${amount === 1 ? singular : plural}`;

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

/**
 * Leaves an entity out of the import: every relation it is in goes with it,
 * and the other drafts lose their links to it, so what remains can still be
 * created.
 */
export const removeDraftEntity = (
  draft: ImportDraft,
  entityId: string
): { draft: ImportDraft; removedRelations: Relation.IRelation[]; cleanups: DraftCleanup[] } => {
  const removed = draft.entities.find((entity) => entity.id === entityId);
  // a territory under the left-out one keeps a place in the tree
  const removedParent =
    removed?.class === EntityEnums.Class.Territory
      ? (removed as ITerritory).data.parent || undefined
      : undefined;

  const removedRelations = draft.relations.filter((relation) =>
    relation.entityIds.includes(entityId)
  );

  const cleanups: DraftCleanup[] = [];
  const entities = draft.entities
    .filter((entity) => entity.id !== entityId)
    .map((entity) => {
      const result = unlinkEntity(entity, entityId, removedParent?.territoryId);
      if (result.changes.length) {
        cleanups.push({ entityId: entity.id, changes: result.changes });
      }
      return result.entity;
    });

  return {
    draft: {
      ...draft,
      entities,
      relations: draft.relations.filter((relation) => !removedRelations.includes(relation)),
    },
    removedRelations,
    cleanups,
  };
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

/** The draft entity a relation is written under in the import JSON. */
const relationOwner = (draft: ImportDraft, relation: Relation.IRelation): string | undefined =>
  isAsymmetrical(relation.type)
    ? relation.entityIds[0]
    : relation.entityIds.find((id) => draft.entities.some((entity) => entity.id === id));

/**
 * The drafts in the import format, each relation listed once under the entity
 * it belongs to, so the edited drafts pass through the same validation as
 * pasted JSON.
 */
export const draftToImportJson = (draft: ImportDraft): object[] => {
  // a Value copy no draft points at any more is not created
  const pointedAt = new Set(
    collectEntityRefs(
      tabEntities(draft).map((entity, position) => ({ index: position + 1, entity, rawRelations: [] }))
    ).map((ref) => ref.id)
  );
  return draft.entities
    .filter((entity) => !isValueCopy(draft, entity.id) || pointedAt.has(entity.id))
    .map((entity) => ({
      ...buildEntityJson(entity, undefined),
      relations: draft.relations
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
