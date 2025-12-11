import { RelationEnums } from "@shared/enums";
import { IResponseDetail, IResponseGeneric, Relation } from "@shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { StyledEditorEmptyState } from "pages/Main/containers/StatementEditorBox/StatementEditorBoxStyles";
import React, { useMemo } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { getEntityRelationRules } from "utils/utils";
import { EntityDetailInverseRelations } from "./EntityDetailInverseRelations/EntityDetailInverseRelations";
import { StyledRelationsGrid } from "./EntityDetailRelationsStyles";
import { EntityDetailRelationTypeBlock } from "./EntityDetailRelationTypeBlock/EntityDetailRelationTypeBlock";

interface EntityDetailRelations {
  entity: IResponseDetail;
  relationCreateMutation?: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    Relation.IRelation,
    unknown
  >;
  relationUpdateMutation?: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      relationId: string;
      changes: Partial<Relation.IRelation | Relation.IIdentification>;
    },
    unknown
  >;
  relationDeleteMutation?: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    string,
    unknown
  >;
  userCanEdit: boolean;
}

export const EntityDetailRelations: React.FC<EntityDetailRelations> = ({
  entity,
  relationCreateMutation,
  relationUpdateMutation,
  relationDeleteMutation,
  userCanEdit,
}) => {
  const relationTypes = useMemo<RelationEnums.Type[]>(() => {
    return getEntityRelationRules(
      entity.class,
      RelationEnums.EntityDetailTypes,
      entity.isTemplate
    );
  }, [entity]);

  const { relations, entities } = entity;

  return (
    <>
      <StyledRelationsGrid>
        {relationTypes.length === 0 && (
          <>
            <StyledEditorEmptyState>
              <BsInfoCircle size="20" style={{ marginRight: "5px" }} />
              This entity cannot have any relations
            </StyledEditorEmptyState>
          </>
        )}
        {relationTypes.map((relationType, key) => {
          const selectedRelations = relations[relationType]?.connections;

          return (
            <EntityDetailRelationTypeBlock
              key={key}
              entities={entities}
              relationType={relationType}
              selectedRelations={selectedRelations}
              relationCreateMutation={relationCreateMutation}
              relationUpdateMutation={relationUpdateMutation}
              relationDeleteMutation={relationDeleteMutation}
              entity={entity}
              userCanEdit={userCanEdit}
            />
          );
        })}
      </StyledRelationsGrid>
      {/* Inverse relations */}
      <EntityDetailInverseRelations entity={entity} />
    </>
  );
};
