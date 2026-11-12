import { RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation } from "@inkvisitor/shared/types";
import { appendChanges, isStale, storedFields } from "./appendMerge";
import { errorMessage, quote, unique } from "./helpers";
import { ImportDataSource, ImportIssue, ImportPlan } from "./types";

export interface ImportWriteApi extends ImportDataSource {
  createEntity: (entity: IEntity) => Promise<void>;
  updateEntity: (entityId: string, changes: Partial<IEntity>) => Promise<void>;
  createRelation: (relation: Relation.IRelation) => Promise<void>;
  deleteRelation: (relationId: string) => Promise<void>;
  // resolves to the ids the server did not delete
  deleteEntities: (entityIds: string[]) => Promise<string[]>;
}

export type ImportWriteOutcome =
  | { status: "created"; entityIds: string[]; appendedIds: string[]; relationCount: number }
  // an input id was taken, or an appended entity changed, while the preview
  // was open; nothing was written
  | { status: "conflict"; errors: ImportIssue[] }
  | {
      status: "rolledBack";
      failure: string;
      entityCount: number;
      appendCount: number;
      relationCount: number;
    }
  | { status: "rollbackFailed"; failure: string; leftovers: string[] };

/**
 * Creates the planned entities, appends to the stored ones, then creates the
 * relations, one request at a time. On the first failed write everything
 * written so far is undone, so an import lands whole or not at all.
 *
 * Creating a synonym relation makes the server merge every synonym group
 * sharing a member into it and delete those groups, so the groups of existing
 * entities are recorded before each synonym write and restored, ids included,
 * by the rollback.
 */
export const writeImport = async (
  plan: ImportPlan,
  api: ImportWriteApi,
  onProgress: (done: number, total: number) => void = () => {}
): Promise<ImportWriteOutcome> => {
  const entityById = new Map<string, IEntity>([
    ...Object.entries(plan.existingEntities),
    ...plan.entities.map((entity) => [entity.id, entity] as const),
  ]);
  const labelOf = (entityId: string) => quote(entityById.get(entityId)?.labels[0] ?? entityId);

  const found = await api.getEntities(plan.entities.map((entity) => entity.id));
  const conflicts = found.filter((entity) => {
    const append = plan.appends[entity.id];
    return !append || isStale(append.stored, entity);
  });
  if (conflicts.length) {
    return {
      status: "conflict",
      errors: conflicts.map((entity) => {
        const planned = plan.entities.findIndex((candidate) => candidate.id === entity.id);
        return {
          entityIndex: planned + 1,
          label: plan.entities[planned]?.labels[0],
          path: "id",
          message: plan.appends[entity.id]
            ? `${quote(entity.labels[0])} was changed in the database while the preview was open; go back to JSON and validate again`
            : `id ${quote(entity.id)} was created in the database while the preview was open`,
        };
      }),
    };
  }

  const toCreate = plan.entities.filter((entity) => !plan.appends[entity.id]);
  const toAppend = plan.entities
    .filter((entity) => plan.appends[entity.id])
    .map((entity) => ({
      entity,
      changes: appendChanges(plan.appends[entity.id].stored, entity),
    }))
    .filter(({ changes }) => Object.keys(changes).length > 0);

  const total = toCreate.length + toAppend.length + plan.relations.length;
  let done = 0;
  const createdEntityIds: string[] = [];
  const appendedIds: string[] = [];
  const createdRelationIds: string[] = [];
  // relations of this import the server already deleted by merging them
  const mergedAwayRelationIds = new Set<string>();
  const replacedSynonymGroups: Relation.IRelation[] = [];
  let failure: string | null = null;

  for (const entity of toCreate) {
    try {
      await api.createEntity(entity);
    } catch (error) {
      failure = `Failed at entity ${quote(entity.labels[0])}: ${errorMessage(error)}`;
      break;
    }
    createdEntityIds.push(entity.id);
    onProgress(++done, total);
  }

  // appended metaprops may point at the entities created above
  if (!failure) {
    for (const { entity, changes } of toAppend) {
      try {
        await api.updateEntity(entity.id, changes);
      } catch (error) {
        failure = `Failed at appending to ${quote(entity.labels[0])}: ${errorMessage(error)}`;
        break;
      }
      appendedIds.push(entity.id);
      onProgress(++done, total);
    }
  }

  if (!failure) {
    for (const [relationIndex, relation] of plan.relations.entries()) {
      const rule = Relation.RelationRules[relation.type]!;
      const describe = `relation ${relationIndex + 1} (${rule.label} ${relation.entityIds
        .map(labelOf)
        .join(rule.asymmetrical ? " → " : ", ")})`;

      try {
        let groupsToMerge: Relation.IRelation[] = [];
        if (relation.type === RelationEnums.Type.Synonym) {
          const groups = await Promise.all(
            relation.entityIds.map((entityId) =>
              api.getForwardRelations(entityId, RelationEnums.Type.Synonym)
            )
          );
          groupsToMerge = unique(groups.flat().map((group) => group.id)).map(
            (groupId) => groups.flat().find((group) => group.id === groupId)!
          );
        }

        await api.createRelation(relation);

        for (const group of groupsToMerge) {
          if (createdRelationIds.includes(group.id)) {
            mergedAwayRelationIds.add(group.id);
          } else if (!replacedSynonymGroups.some((replaced) => replaced.id === group.id)) {
            replacedSynonymGroups.push(group);
          }
        }
      } catch (error) {
        failure = `Failed at ${describe}: ${errorMessage(error)}`;
        break;
      }
      createdRelationIds.push(relation.id);
      onProgress(++done, total);
    }
  }

  if (!failure) {
    return {
      status: "created",
      entityIds: createdEntityIds,
      appendedIds,
      relationCount: createdRelationIds.length - mergedAwayRelationIds.size,
    };
  }

  // rollback: relations first, since the server refuses to delete an entity
  // that is still linked to one
  const leftovers: string[] = [];
  const relationsToDelete = createdRelationIds.filter((id) => !mergedAwayRelationIds.has(id));
  for (const relationId of [...relationsToDelete].reverse()) {
    try {
      await api.deleteRelation(relationId);
    } catch (error) {
      leftovers.push(`relation ${relationId}: ${errorMessage(error)}`);
    }
  }

  for (const group of replacedSynonymGroups) {
    const groupLabel = `synonym group ${group.entityIds.map(labelOf).join(", ")} (${group.id})`;
    // restoring next to a synonym relation of this import that is still there
    // would merge the group into it again
    if (leftovers.length) {
      leftovers.push(`${groupLabel}: not restored`);
      continue;
    }
    try {
      await api.createRelation({ id: group.id, type: group.type, entityIds: group.entityIds });
    } catch (error) {
      leftovers.push(`${groupLabel}: not restored, ${errorMessage(error)}`);
    }
  }

  // the appended metaprops can point at created entities, so the appends are
  // undone before those are deleted
  // the appends ran in order and stopped at the first failure
  for (const { entity, changes } of toAppend.slice(0, appendedIds.length)) {
    try {
      await api.updateEntity(entity.id, storedFields(plan.appends[entity.id].stored, changes));
    } catch (error) {
      leftovers.push(
        `appended to ${labelOf(entity.id)} (${entity.id}): not undone, ${errorMessage(error)}`
      );
    }
  }

  if (createdEntityIds.length) {
    let notDeleted: string[];
    try {
      notDeleted = await api.deleteEntities(createdEntityIds);
    } catch {
      notDeleted = createdEntityIds;
    }
    notDeleted.forEach((entityId) => leftovers.push(`entity ${labelOf(entityId)} (${entityId})`));
  }

  if (leftovers.length) {
    return { status: "rollbackFailed", failure, leftovers };
  }
  return {
    status: "rolledBack",
    failure,
    entityCount: createdEntityIds.length,
    appendCount: appendedIds.length,
    relationCount: relationsToDelete.length,
  };
};
