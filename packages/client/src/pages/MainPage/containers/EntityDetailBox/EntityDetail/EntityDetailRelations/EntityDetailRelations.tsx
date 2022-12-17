import { RelationEnums } from "@shared/enums";
import { IResponseDetail, IResponseGeneric, Relation } from "@shared/types";
import { AxiosResponse } from "axios";
import React, { useEffect, useState } from "react";
import { UseMutationResult } from "react-query";
import { getEntityRelationRules } from "utils";
import { EntityDetailInverseRelations } from "./EntityDetailInverseRelations/EntityDetailInverseRelations";
import { StyledRelationsGrid } from "./EntityDetailRelationsStyles";
import { EntityDetailRelationTypeBlock } from "./EntityDetailRelationTypeBlock/EntityDetailRelationTypeBlock";

interface EntityDetailRelations {
  entity: IResponseDetail;
  relationCreateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    Relation.IRelation,
    unknown
  >;
  relationUpdateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      relationId: string;
      changes: any;
    },
    unknown
  >;
  relationDeleteMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    string,
    unknown
  >;
}

export const EntityDetailRelations: React.FC<EntityDetailRelations> = ({
  entity,
  relationCreateMutation,
  relationUpdateMutation,
  relationDeleteMutation,
}) => {
  const [filteredRelationTypes, setFilteredRelationTypes] = useState<
    RelationEnums.Type[]
  >([]);

  useEffect(() => {
    const filteredTypes = getEntityRelationRules(
      entity.class,
      RelationEnums.EntityDetailTypes
    );
    setFilteredRelationTypes(filteredTypes);
  }, [entity]);

  const { relations, entities } = entity;

  return (
    <>
      <StyledRelationsGrid>
        {filteredRelationTypes.map((relationType, key) => {
          const relationRule: Relation.RelationRule =
            Relation.RelationRules[relationType]!;

          const selectedRelations = relations[relationType]?.connections;

          // TODO: probably not needed (handled on BE)
          const sortedRelations = relationRule.multiple
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
              selectedRelations={sortedRelations}
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
