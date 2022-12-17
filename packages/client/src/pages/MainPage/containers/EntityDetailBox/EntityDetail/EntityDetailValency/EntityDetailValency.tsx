import { RelationEnums } from "@shared/enums";
import { IResponseDetail, IResponseGeneric, Relation } from "@shared/types";
import { AxiosResponse } from "axios";
import React from "react";
import { UseMutationResult } from "react-query";
import { EntityDetailValencySection } from "./EntityDetailValencySection/EntityDetailValencySection";
import {
  StyledGrid,
  StyledSectionSeparator,
} from "./EntityDetailValencyStyles";

interface EntityDetailValency {
  entity: IResponseDetail;
  userCanEdit: boolean;
  updateEntityMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    any,
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

      <StyledSectionSeparator />

      <EntityDetailValencySection
        entity={entity}
        relationType={RelationEnums.Type.Actant1Semantics}
        updateEntityMutation={updateEntityMutation}
        userCanEdit={userCanEdit}
        relationCreateMutation={relationCreateMutation}
        relationUpdateMutation={relationUpdateMutation}
        relationDeleteMutation={relationDeleteMutation}
      />

      <StyledSectionSeparator />

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
