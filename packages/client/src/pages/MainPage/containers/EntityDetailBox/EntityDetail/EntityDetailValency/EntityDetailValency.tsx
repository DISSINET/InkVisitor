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
  const { relations, entities } = entity;

  return (
    <StyledGrid>
      {/* SUBJECT */}
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

      {/* ACTANT 1 */}
      {/* <StyledDetailContentRow>
        <StyledDetailContentRowLabel>
          Actant1 entity type
        </StyledDetailContentRowLabel>
        <StyledDetailContentRowValue>
          <Dropdown
            disabled={!userCanEdit}
            isMulti
            options={entitiesDict}
            value={[allEntities]
              .concat(entitiesDict)
              .filter((i: any) =>
                (entity as IAction).data.entities?.a1.includes(i.value)
              )}
            placeholder={"no entity"}
            width="full"
            onChange={(newValue: any) => {
              const oldData = { ...entity.data };
              updateEntityMutation.mutate({
                data: {
                  ...oldData,
                  ...{
                    entities: {
                      a1: newValue
                        ? (newValue as string[]).map((v: any) => v.value)
                        : [],
                      s: entity.data.entities.s,
                      a2: entity.data.entities.a2,
                    },
                  },
                },
              });
            }}
          />
        </StyledDetailContentRowValue>
      </StyledDetailContentRow>

      <StyledDetailContentRow>
        <td colSpan={2}>
          <StyledRelationsGrid>
            <EntityDetailRelationTypeBlock
              entity={entity}
              relations={getSortedRelations(
                RelationEnums.Type.Actant1Semantics
              )}
              entities={entities}
              relationType={RelationEnums.Type.Actant1Semantics}
              relationCreateMutation={relationCreateMutation}
              relationUpdateMutation={relationUpdateMutation}
              relationDeleteMutation={relationDeleteMutation}
            />
          </StyledRelationsGrid>
        </td>
      </StyledDetailContentRow>

      <StyledDetailContentRow>
        <StyledDetailContentRowLabel>
          Actant1 valency
        </StyledDetailContentRowLabel>
        <StyledDetailContentRowValue>
          <Input
            disabled={!userCanEdit}
            value={(entity as IAction).data.valencies?.a1}
            width="full"
            onChangeFn={async (newValue: string) => {
              const oldData = { ...entity.data };
              updateEntityMutation.mutate({
                data: {
                  ...oldData,
                  ...{
                    valencies: {
                      s: entity.data.valencies.s,
                      a1: newValue,
                      a2: entity.data.valencies.a2,
                    },
                  },
                },
              });
            }}
          />
        </StyledDetailContentRowValue>
      </StyledDetailContentRow> */}

      {/* <StyledSectionSeparator colSpan={2} /> */}

      {/* ACTANT 2 */}
      {/* <StyledDetailContentRow>
        <StyledDetailContentRowLabel>
          Actant2 entity type
        </StyledDetailContentRowLabel>
        <StyledDetailContentRowValue>
          <Dropdown
            disabled={!userCanEdit}
            isMulti
            options={entitiesDict}
            value={[allEntities]
              .concat(entitiesDict)
              .filter((i: any) =>
                (entity as IAction).data.entities?.a2.includes(i.value)
              )}
            placeholder={"no entity"}
            width="full"
            onChange={(newValue: any) => {
              const oldData = { ...entity.data };

              updateEntityMutation.mutate({
                data: {
                  ...oldData,
                  ...{
                    entities: {
                      a2: newValue
                        ? (newValue as string[]).map((v: any) => v.value)
                        : [],
                      s: entity.data.entities.s,
                      a1: entity.data.entities.a1,
                    },
                  },
                },
              });
            }}
          />
        </StyledDetailContentRowValue>
      </StyledDetailContentRow>

      <StyledDetailContentRow>
        <td colSpan={2}>
          <StyledRelationsGrid>
            <EntityDetailRelationTypeBlock
              entity={entity}
              relations={getSortedRelations(
                RelationEnums.Type.Actant2Semantics
              )}
              entities={entities}
              relationType={RelationEnums.Type.Actant2Semantics}
              relationCreateMutation={relationCreateMutation}
              relationUpdateMutation={relationUpdateMutation}
              relationDeleteMutation={relationDeleteMutation}
            />
          </StyledRelationsGrid>
        </td>
      </StyledDetailContentRow>

      <StyledDetailContentRow>
        <StyledDetailContentRowLabel>
          Actant2 valency
        </StyledDetailContentRowLabel>
        <StyledDetailContentRowValue>
          <Input
            disabled={!userCanEdit}
            value={(entity as IAction).data.valencies?.a2}
            width="full"
            onChangeFn={async (newValue: string) => {
              const oldData = { ...entity.data };
              updateEntityMutation.mutate({
                data: {
                  ...oldData,
                  ...{
                    valencies: {
                      s: entity.data.valencies.s,
                      a1: entity.data.valencies.a1,
                      a2: newValue,
                    },
                  },
                },
              });
            }}
          />
        </StyledDetailContentRowValue>
      </StyledDetailContentRow> */}
    </StyledGrid>
  );
};
