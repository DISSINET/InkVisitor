import { entitiesDict } from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { EntityEnums, RelationEnums } from "@shared/enums";
import {
  IAction,
  IResponseDetail,
  IResponseGeneric,
  Relation,
} from "@shared/types";
import { AxiosResponse } from "axios";
import { Dropdown, Input } from "components";
import { EntitySuggester } from "components/advanced";
import React from "react";
import { UseMutationResult } from "react-query";
import { EntityDetailRelationRow } from "../EntityDetailRelations/EntityDetailRelationTypeBlock/EntityDetailRelationRow/EntityDetailRelationRow";
import { EntityDetailRelationTypeIcon } from "../EntityDetailRelations/EntityDetailRelationTypeBlock/EntityDetailRelationTypeIcon/EntityDetailRelationTypeIcon";
import {
  StyledGrid,
  StyledLabel,
  StyledLabelInputWrapper,
  StyledSectionSeparator,
  StyledSemanticsWrapper,
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

  const getSortedRelations = (relationType: RelationEnums.Type) => {
    const relationRule = Relation.RelationRules[relationType]!;
    const selectedRelations = relations[relationType]?.connections;

    return relationRule.multiple
      ? selectedRelations?.sort((a, b) =>
          a.order !== undefined && b.order !== undefined
            ? a.order > b.order
              ? 1
              : -1
            : 0
        )
      : selectedRelations;
  };

  return (
    <StyledGrid>
      {/* SUBJECT */}
      <StyledLabel style={{ marginRight: ".8rem" }}>Subject</StyledLabel>

      <StyledLabelInputWrapper>
        <StyledLabel>Entity type</StyledLabel>
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
      </StyledLabelInputWrapper>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <EntityDetailRelationTypeIcon
          relationType={RelationEnums.Type.SubjectSemantics}
        />
      </div>

      <StyledSemanticsWrapper>
        <StyledLabelInputWrapper>
          <StyledLabel>Semantics</StyledLabel>
          <EntitySuggester
            categoryTypes={[EntityEnums.Class.Concept]}
            onSelected={(selectedId: string) => {
              console.log(selectedId);
              // handleMultiSelected(selectedId)}
            }}
            // excludedActantIds={usedEntityIds}
          />
        </StyledLabelInputWrapper>
        {/* {currentRelations.map((relation, key) => (
          <EntityDetailRelationRow
            key={key}
            index={key}
            relation={relation}
            entities={entities}
            entityId={entity.id}
            relationRule={relationRule}
            relationType={RelationEnums.Type.SubjectSemantics}
            relationUpdateMutation={relationUpdateMutation}
            relationDeleteMutation={relationDeleteMutation}
            hasOrder={hasOrder && currentRelations.length > 1}
            moveRow={moveRow}
            updateOrderFn={updateOrderFn}
          />
        ))} */}
      </StyledSemanticsWrapper>

      <div />
      <StyledLabelInputWrapper>
        <StyledLabel>Grammatical valency</StyledLabel>
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
      </StyledLabelInputWrapper>

      <StyledSectionSeparator />

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
