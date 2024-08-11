import { RelationEnums } from "@shared/enums";
import {
  IEntity,
  IResponseDetail,
  IResponseGeneric,
  Relation,
} from "@shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import React from "react";
import { EntityDetailValencySection } from "./EntityDetailValencySection/EntityDetailValencySection";
import { StyledGrid } from "./EntityDetailValencyStyles";
import { StyledBlockSeparator } from "../EntityDetailStyles";

interface EntityDetailValency {
  entity: IResponseDetail;
  userCanEdit: boolean;
  updateEntityMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    Partial<IEntity>,
    unknown
  >;
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
      changes: Partial<Relation.IRelation>;
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
export const EntityDetailValency: React.FC<EntityDetailValency> = ({
  entity,
  userCanEdit,
  updateEntityMutation,
  relationCreateMutation,
  relationUpdateMutation,
  relationDeleteMutation,
}) => {
  return (
    <StyledGrid>
      <EntityDetailValencySection
        entity={entity}
        relationType={RelationEnums.Type.SubjectSemantics}
        updateEntityMutation={updateEntityMutation}
        userCanEdit={userCanEdit}
        relationCreateMutation={relationCreateMutation}
        relationUpdateMutation={relationUpdateMutation}
        relationDeleteMutation={relationDeleteMutation}
      />

      <StyledBlockSeparator />

      <EntityDetailValencySection
        entity={entity}
        relationType={RelationEnums.Type.Actant1Semantics}
        updateEntityMutation={updateEntityMutation}
        userCanEdit={userCanEdit}
        relationCreateMutation={relationCreateMutation}
        relationUpdateMutation={relationUpdateMutation}
        relationDeleteMutation={relationDeleteMutation}
      />

      <StyledBlockSeparator />

      <EntityDetailValencySection
        entity={entity}
        relationType={RelationEnums.Type.Actant2Semantics}
        updateEntityMutation={updateEntityMutation}
        userCanEdit={userCanEdit}
        relationCreateMutation={relationCreateMutation}
        relationUpdateMutation={relationUpdateMutation}
        relationDeleteMutation={relationDeleteMutation}
      />
    </StyledGrid>
  );
};
