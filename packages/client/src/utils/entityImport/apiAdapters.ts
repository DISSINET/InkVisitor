import api from "api";
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

export const importWriteApi: ImportWriteApi = {
  ...importDataSource,
  createEntity: async (entity) => {
    await api.entityCreate(entity, quiet);
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
