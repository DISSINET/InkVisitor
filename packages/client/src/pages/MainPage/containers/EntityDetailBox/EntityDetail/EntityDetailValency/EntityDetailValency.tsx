import { entitiesDict } from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { RelationEnums } from "@shared/enums";
import {
  IAction,
  IResponseDetail,
  IResponseGeneric,
  Relation,
} from "@shared/types";
import { AxiosResponse } from "axios";
import { Dropdown, Input } from "components";
import React from "react";
import { UseMutationResult } from "react-query";
import { EntityDetailRelationTypeBlock } from "../EntityDetailRelations/EntityDetailRelationTypeBlock/EntityDetailRelationTypeBlock";
import {
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
  StyledDetailForm,
  StyledFormWrapper,
} from "../EntityDetailStyles";

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

  // const relationRule: Relation.RelationRule = Relation.RelationRules[relationType]!;

  // const selectedRelations = relations[relationType]?.connections;

  // const sortedRelations = relationRule.multiple
  //   ? selectedRelations?.sort((a, b) =>
  //       a.order !== undefined && b.order !== undefined
  //         ? a.order > b.order
  //           ? 1
  //           : -1
  //         : 0
  //     )
  //   : selectedRelations;

  return (
    <StyledFormWrapper>
      <StyledDetailForm>
        <StyledDetailContentRow>
          <StyledDetailContentRowLabel>
            Subject entity type
          </StyledDetailContentRowLabel>
          <StyledDetailContentRowValue>
            <Dropdown
              allowAny
              disabled={!userCanEdit}
              isMulti
              options={entitiesDict}
              value={[allEntities]
                .concat(entitiesDict)
                .filter((i: any) =>
                  (entity as IAction).data.entities?.s.includes(i.value)
                )}
              width="full"
              noOptionsMessage={"no entity"}
              placeholder={"no entity"}
              onChange={(newValue: any) => {
                const oldData = { ...entity.data };
                updateEntityMutation.mutate({
                  data: {
                    ...oldData,
                    ...{
                      entities: {
                        s: newValue
                          ? (newValue as string[]).map((v: any) => v.value)
                          : [],
                        a1: entity.data.entities.a1,
                        a2: entity.data.entities.a2,
                      },
                    },
                  },
                });
              }}
            />
          </StyledDetailContentRowValue>
        </StyledDetailContentRow>

        <EntityDetailRelationTypeBlock
          entity={entity}
          relations={
            relations[RelationEnums.Type.SubjectSemantics]?.connections!
          }
          entities={entities}
          relationType={RelationEnums.Type.SubjectSemantics}
          relationCreateMutation={relationCreateMutation}
          relationUpdateMutation={relationUpdateMutation}
          relationDeleteMutation={relationDeleteMutation}
        />

        <StyledDetailContentRow>
          <StyledDetailContentRowLabel>
            Subject valency
          </StyledDetailContentRowLabel>
          <StyledDetailContentRowValue>
            <Input
              disabled={!userCanEdit}
              value={(entity as IAction).data.valencies?.s}
              width="full"
              onChangeFn={async (newValue: string) => {
                const oldData = { ...entity.data };
                updateEntityMutation.mutate({
                  data: {
                    ...oldData,
                    ...{
                      valencies: {
                        s: newValue,
                        a1: entity.data.valencies.a1,
                        a2: entity.data.valencies.a2,
                      },
                    },
                  },
                });
              }}
            />
          </StyledDetailContentRowValue>
        </StyledDetailContentRow>

        <StyledDetailContentRow>
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

        <EntityDetailRelationTypeBlock
          entity={entity}
          relations={
            relations[RelationEnums.Type.Actant1Semantics]?.connections!
          }
          entities={entities}
          relationType={RelationEnums.Type.Actant1Semantics}
          relationCreateMutation={relationCreateMutation}
          relationUpdateMutation={relationUpdateMutation}
          relationDeleteMutation={relationDeleteMutation}
        />

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
        </StyledDetailContentRow>

        <StyledDetailContentRow>
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

        <EntityDetailRelationTypeBlock
          entity={entity}
          relations={
            relations[RelationEnums.Type.Actant2Semantics]?.connections!
          }
          entities={entities}
          relationType={RelationEnums.Type.Actant2Semantics}
          relationCreateMutation={relationCreateMutation}
          relationUpdateMutation={relationUpdateMutation}
          relationDeleteMutation={relationDeleteMutation}
        />

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
        </StyledDetailContentRow>
      </StyledDetailForm>
    </StyledFormWrapper>
  );
};
