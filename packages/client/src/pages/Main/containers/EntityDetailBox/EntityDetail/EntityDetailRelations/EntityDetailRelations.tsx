import { RelationEnums } from "@shared/enums";
import { IResponseDetail, IResponseGeneric, Relation } from "@shared/types";
import { AxiosResponse } from "axios";
import React, { useEffect, useState } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { getEntityRelationRules } from "utils/utils";
import { EntityDetailInverseRelations } from "./EntityDetailInverseRelations/EntityDetailInverseRelations";
import { StyledRelationsGrid } from "./EntityDetailRelationsStyles";
import { EntityDetailRelationTypeBlock } from "./EntityDetailRelationTypeBlock/EntityDetailRelationTypeBlock";
import { StyledEditorEmptyState } from "pages/Main/containers/StatementEditorBox/StatementEditorBoxStyles";
import { BsInfoCircle } from "react-icons/bs";

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
  const [filteredRelationTypes, setFilteredRelationTypes] = useState<
    RelationEnums.Type[]
  >([]);

  useEffect(() => {
    const filteredTypes = getEntityRelationRules(
      entity.class,
      RelationEnums.EntityDetailTypes,
      entity.isTemplate
    );
    setFilteredRelationTypes(filteredTypes);
  }, [entity]);

  const { relations, entities } = entity;

  return (
    <>
      <StyledRelationsGrid>
        {filteredRelationTypes.length === 0 && (
          <>
            <StyledEditorEmptyState>
              <BsInfoCircle size="20" style={{ marginRight: "5px" }} />
              This entity cannot have any relations
            </StyledEditorEmptyState>
          </>
        )}
        {filteredRelationTypes.map((relationType, key) => {
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
