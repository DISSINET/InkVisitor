import api from "api";
import { IEntity } from "@inkvisitor/shared/types";
import { ImportDataSource } from "./types";
import { ImportWriteApi } from "./writeImport";

// failures are reported inside the import modal, not as toasts
const quiet = { ignoreErrorToast: true };

export const importDataSource: ImportDataSource = {
  getEntities: async (entityIds) =>
    entityIds.length ? (await api.entitiesGet(entityIds, quiet)).data : [],
  getForwardRelations: async (entityId, type) =>
    (await api.relationsGet(entityId, { relationType: type }, true, quiet)).data,
};

// candidates shown for one draft
const MAX_CANDIDATES = 5;

/**
 * Database entities of the draft's class with a label (main or alternative)
 * that starts as one of the draft's labels, as the main search box finds
 * them; those with one of its labels exactly come first.
 */
export const searchCandidates = async (entity: IEntity): Promise<IEntity[]> => {
  // the search ignores case, so labels differing only in case are sent once
  const normalized = new Set(
    entity.labels.map((label) => label.trim().toLowerCase()).filter(Boolean)
  );
  const results = await Promise.all(
    [...normalized].map(
      async (label) =>
        (await api.entitiesSearch({ label: `${label}*`, class: entity.class }, quiet)).data
    )
  );
  const isExact = (candidate: IEntity) =>
    candidate.labels.some((label) => normalized.has(label.trim().toLowerCase()));
  const found = [...new Map(results.flat().map((candidate) => [candidate.id, candidate])).values()]
    .filter((candidate) => candidate.id !== entity.id && !candidate.isTemplate);
  return [...found.filter(isExact), ...found.filter((candidate) => !isExact(candidate))].slice(
    0,
    MAX_CANDIDATES
  );
};

export const importWriteApi: ImportWriteApi = {
  ...importDataSource,
  createEntity: async (entity) => {
    await api.entityCreate(entity, quiet);
  },
  updateEntity: async (entityId, changes) => {
    await api.entityUpdate(entityId, changes, quiet);
  },
  createRelation: async (relation) => {
    await api.relationCreate(relation, quiet);
  },
  deleteRelation: async (relationId) => {
    await api.relationDelete(relationId, quiet);
  },
  deleteEntities: async (entityIds) => {
    const results = await api.entitiesDelete(entityIds, quiet);
    const deleted = new Set(
      results.filter((result) => !("error" in result && result.error)).map((result) => result.entityId)
    );
    return entityIds.filter((entityId) => !deleted.has(entityId));
  },
};
