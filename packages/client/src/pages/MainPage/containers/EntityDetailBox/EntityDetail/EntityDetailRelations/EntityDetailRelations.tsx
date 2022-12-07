import { RelationEnums } from "@shared/enums";
import { IResponseDetail, Relation } from "@shared/types";
import api from "api";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { getEntityRelationRules } from "utils";
import { EntityDetailInverseRelations } from "./EntityDetailInverseRelations/EntityDetailInverseRelations";
import { StyledRelationsGrid } from "./EntityDetailRelationsStyles";
import { EntityDetailRelationTypeBlock } from "./EntityDetailRelationTypeBlock/EntityDetailRelationTypeBlock";

interface EntityDetailRelations {
  entity: IResponseDetail;
}
export const EntityDetailRelations: React.FC<EntityDetailRelations> = ({
  entity,
}) => {
  const queryClient = useQueryClient();

  const relationCreateMutation = useMutation(
    async (newRelation: Relation.IRelation) =>
      await api.relationCreate(newRelation),
    {
      onSuccess: (data, variables) => {
        // TODO
        queryClient.invalidateQueries("entity");
      },
    }
  );

  const relationUpdateMutation = useMutation(
    async (relationObject: { relationId: string; changes: any }) =>
      await api.relationUpdate(
        relationObject.relationId,
        relationObject.changes
      ),
    {
      onSuccess: (data, variables) => {
        // TODO
        queryClient.invalidateQueries("entity");
      },
    }
  );
  const relationDeleteMutation = useMutation(
    async (relationId: string) => await api.relationDelete(relationId),
    {
      onSuccess: (data, variables) => {
        // TODO
        queryClient.invalidateQueries("entity");
      },
    }
  );

  const [filteredRelationTypes, setFilteredRelationTypes] = useState<
    RelationEnums.Type[]
  >([]);

  useEffect(() => {
    const filteredTypes = getEntityRelationRules(entity.class);
    setFilteredRelationTypes(filteredTypes);
  }, [entity]);

  const { relations, entities } = entity;

  return (
    <>
      <StyledRelationsGrid>
        {filteredRelationTypes.map((relationType, key) => {
          const relationRule: Relation.RelationRule =
            Relation.RelationRules[relationType]!;
          const { cloudType, multiple, order } = relationRule;

          const selectedRelations = relations[relationType]?.connections;

          const sortedRelations = multiple
            ? selectedRelations?.sort((a, b) =>
                a.order !== undefined && b.order !== undefined
                  ? a.order > b.order
                    ? 1
                    : -1
                  : 0
              )
            : selectedRelations;

          return (
            <EntityDetailRelationTypeBlock
              key={key}
              entities={entities}
              relationType={relationType}
              relations={sortedRelations}
              isCloudType={cloudType}
              isMultiple={multiple}
              hasOrder={order}
              relationCreateMutation={relationCreateMutation}
              relationUpdateMutation={relationUpdateMutation}
              relationDeleteMutation={relationDeleteMutation}
              entity={entity}
            />
          );
        })}
      </StyledRelationsGrid>
      {/* Inverse relations */}
      <EntityDetailInverseRelations entity={entity} />
    </>
  );
};
