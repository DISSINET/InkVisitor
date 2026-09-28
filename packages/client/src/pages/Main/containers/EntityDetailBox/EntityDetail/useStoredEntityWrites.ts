import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseStatement, Relation } from "@inkvisitor/shared/types";
import { useQueryClient } from "@tanstack/react-query";
import api from "api";
import { EntityWrites, useSearchParams } from "hooks";
import { DETAIL_TAB_ENTITIES_KEY } from "hooks/react-query";
import { invalidateAllExplorerQueries } from "pages/Query/useQueryData";
import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

/** Detail's writes to the database, each refreshing the queries it changes. */
export const useStoredEntityWrites = (): EntityWrites => {
  const queryClient = useQueryClient();
  const { statementId } = useSearchParams();

  return useMemo(() => {
    const afterEntityUpdate = (entity: IEntity, changes: Partial<IEntity>) => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      queryClient.invalidateQueries({ queryKey: ["audit", entity.id] });
      invalidateAllExplorerQueries(queryClient);

      // read the open statement from cache (the editor already fetched it) -
      // no need to subscribe and fetch it here just for this check
      const statement = queryClient.getQueryData<IResponseStatement>(["statement", statementId]);
      if (
        statementId &&
        (statementId === entity.id ||
          (statement?.entities && Object.keys(statement.entities).includes(entity.id)))
      ) {
        queryClient.invalidateQueries({ queryKey: ["statement"] });
      }

      if (changes.class) {
        queryClient.invalidateQueries({ queryKey: ["statement"] });
        if (changes.class === EntityEnums.Class.Territory) {
          queryClient.invalidateQueries({ queryKey: ["tree"] });
        }
        queryClient.invalidateQueries({ queryKey: ["territory"] });
        queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      }

      if (
        changes.references !== undefined ||
        changes.detail !== undefined ||
        changes.labels !== undefined ||
        changes.status ||
        changes.language !== undefined ||
        changes.data?.logicalType
      ) {
        queryClient.invalidateQueries({ queryKey: ["suggestion"] });
        if (entity.class === EntityEnums.Class.Territory) {
          queryClient.invalidateQueries({ queryKey: ["tree"] });
        }
        queryClient.invalidateQueries({ queryKey: ["territory"] });
        queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      }

      // a territory moved to another parent
      if (changes.data?.parent) {
        queryClient.invalidateQueries({ queryKey: ["tree"] });
        queryClient.invalidateQueries({ queryKey: ["territory"] });
      }

      if (changes.labels !== undefined) {
        queryClient.invalidateQueries({ queryKey: [DETAIL_TAB_ENTITIES_KEY] });
      }
      if (entity.isTemplate) {
        queryClient.invalidateQueries({ queryKey: ["templates"] });
      }
    };

    const afterRelationWrite = () => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      // refresh the Relation audits section on every open detail - a relation
      // touches more than the current entity
      queryClient.invalidateQueries({ queryKey: ["audit"] });
      invalidateAllExplorerQueries(queryClient);
    };

    const updateRelation: EntityWrites["updateRelation"] = async (relationId, changes) => {
      const response = await api.relationUpdate(relationId, changes);
      afterRelationWrite();
      return response;
    };

    const createRelation: EntityWrites["createRelation"] = async (relation) => {
      const response = await api.relationCreate(relation);
      afterRelationWrite();
      return response;
    };

    return {
      updateEntity: async (entity, changes) => {
        const response = await api.entityUpdate(entity.id, changes);
        afterEntityUpdate(entity, changes);
        return response;
      },
      createRelation,
      updateRelation,
      deleteRelation: async (relationId) => {
        const response = await api.relationDelete(relationId);
        afterRelationWrite();
        return response;
      },

      // stored relations carry order values; the server settles an order
      // equal to a sibling's by shifting the others
      moveRelation: (siblings, relationId, index) => {
        const allOrders = siblings.map((relation) =>
          relation.order !== undefined ? relation.order : 0
        );
        const moved = siblings.find((relation) => relation.id === relationId);

        let order: number;
        if (index === 0) {
          order = allOrders[0] - 1;
        } else if (index === siblings.length - 1) {
          order = allOrders[index - 1] + 1;
        } else if (moved?.order === allOrders[index - 1]) {
          order = allOrders[index];
        } else {
          order = allOrders[index - 1];
        }
        return updateRelation(relationId, { order });
      },

      // the new member joins the group the picked entity is in; the server
      // merges the groups that come to share a member
      joinSynonymGroup: async (entity, memberId) => {
        const member = await api.detailGet(memberId);
        const memberGroup = member.data.relations[RelationEnums.Type.Synonym]?.connections[0];
        if (memberGroup) {
          return updateRelation(memberGroup.id, {
            entityIds: [...memberGroup.entityIds, entity.id],
          });
        }
        return createRelation({
          id: uuidv4(),
          entityIds: [entity.id, memberId],
          type: RelationEnums.Type.Synonym,
        } as Relation.IRelation);
      },
    };
  }, [queryClient, statementId]);
};
