import { entitiesDict } from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { RelationEnums } from "@shared/enums";
import { IAction, IEntity, IResponseGeneric } from "@shared/types";
import { AxiosResponse } from "axios";
import { Dropdown, Input } from "components";
import React from "react";
import { UseMutationResult } from "react-query";
import {
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
  StyledDetailForm,
  StyledFormWrapper,
} from "../EntityDetailStyles";

interface EntityDetailValency {
  entity: IEntity;
  userCanEdit: boolean;
  updateEntityMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    any,
    unknown
  >;
}
export const EntityDetailValency: React.FC<EntityDetailValency> = ({
  entity,
  userCanEdit,
  updateEntityMutation,
}) => {
  // const { relations, entities } = entity;

  const types = RelationEnums.ActionTypes;

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
