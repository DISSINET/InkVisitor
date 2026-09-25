import { RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseDetail, Relation } from "@inkvisitor/shared/types";
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
}

export const draftFromPlan = (plan: ImportPlan): ImportDraft => ({
  entities: plan.entities,
  relations: plan.relations,
  existing: plan.existingEntities,
});

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

export const deleteDraftRelation = (draft: ImportDraft, relationId: string): ImportDraft => ({
  ...draft,
  relations: draft.relations.filter((relation) => relation.id !== relationId),
});

/** Leaves an entity out of the import, together with every relation it is in. */
export const removeDraftEntity = (
  draft: ImportDraft,
  entityId: string
): { draft: ImportDraft; removedRelations: Relation.IRelation[] } => {
  const removedRelations = draft.relations.filter((relation) =>
    relation.entityIds.includes(entityId)
  );
  return {
    draft: {
      ...draft,
      entities: draft.entities.filter((entity) => entity.id !== entityId),
      relations: draft.relations.filter((relation) => !removedRelations.includes(relation)),
    },
    removedRelations,
  };
};

const isAsymmetrical = (type: RelationEnums.Type) =>
  !!Relation.RelationRules[type]?.asymmetrical;

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
      connections: ofType.filter((relation) =>
        isAsymmetrical(type)
          ? relation.entityIds[0] === entityId
          : relation.entityIds.includes(entityId)
      ),
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
export const draftToImportJson = (draft: ImportDraft): object[] =>
  draft.entities.map((entity) => ({
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

/** Entities the drafts refer to that are neither drafts nor loaded yet. */
export const missingEntityIds = (draft: ImportDraft): string[] => {
  const known = new Set([
    ...Object.keys(draft.existing),
    ...draft.entities.map((entity) => entity.id),
  ]);
  const refs = collectEntityRefs(
    draft.entities.map((entity, position) => ({ index: position + 1, entity, rawRelations: [] }))
  ).map((ref) => ref.id);
  const relationIds = draft.relations.flatMap((relation) => relation.entityIds);
  return unique([...refs, ...relationIds]).filter((id) => !known.has(id));
};
