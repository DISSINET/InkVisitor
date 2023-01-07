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
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";
import { UseMutationResult } from "react-query";
import { v4 as uuidv4 } from "uuid";
import { EntityDetailRelationRow } from "../../EntityDetailRelations/EntityDetailRelationTypeBlock/EntityDetailRelationRow/EntityDetailRelationRow";
import { EntityDetailRelationTypeIcon } from "../../EntityDetailRelations/EntityDetailRelationTypeBlock/EntityDetailRelationTypeIcon/EntityDetailRelationTypeIcon";
import {
  StyledLabel,
  StyledLabelInputWrapper,
  StyledRelationsWrapper,
  StyledRelationTypeIconWrapper,
  StyledSectionHeading,
  StyledSemanticsWrapper,
} from "./EntityDetailValencySectionStyles";

interface EntityDetailValencySection {
  entity: IResponseDetail;
  relationType:
    | RelationEnums.Type.SubjectSemantics
    | RelationEnums.Type.Actant1Semantics
    | RelationEnums.Type.Actant2Semantics;

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
export const EntityDetailValencySection: React.FC<
  EntityDetailValencySection
> = ({
  entity,
  relationType,
  userCanEdit,
  updateEntityMutation,
  relationCreateMutation,
  relationUpdateMutation,
  relationDeleteMutation,
}) => {
  const { entities, relations } = entity;

  const relationRule = Relation.RelationRules[relationType]!;
  const selectedRelations: Relation.IRelation[] =
    relations[relationType]!.connections;

  const handleMultiSelected = (
    selectedId: string,
    relationType: RelationEnums.Type
  ) => {
    const newRelation: Relation.IRelation = {
      id: uuidv4(),
      entityIds: [entity.id, selectedId],
      type: relationType,
    };
    relationCreateMutation.mutate(newRelation);
  };

  const [usedEntityIds, setUsedEntityIds] = useState<string[]>([]);

  useEffect(() => {
    const entityIds = selectedRelations
      .map((relation) => relation.entityIds.map((entityId) => entityId))
      .flat(1)
      .concat(entity.id);
    setUsedEntityIds([...new Set(entityIds)]);
  }, [entities, selectedRelations]);

  useEffect(() => {
    setCurrentRelations(selectedRelations);
  }, [selectedRelations]);

  const [currentRelations, setCurrentRelations] = useState<
    Relation.IRelation[]
  >([]);

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRecord = currentRelations[dragIndex];
      setCurrentRelations(
        update(currentRelations, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRecord],
          ],
        })
      );
    },
    [currentRelations]
  );

  const updateOrderFn = (relationId: string, newOrder: number) => {
    let allOrders: number[] = selectedRelations.map((relation, key) =>
      relation.order !== undefined ? relation.order : 0
    );
    let finalOrder: number = 0;

    const currentRelation = selectedRelations.find(
      (relation) => relation.id === relationId
    );

    if (newOrder === 0) {
      finalOrder = allOrders[0] - 1;
    } else if (newOrder === selectedRelations.length - 1) {
      finalOrder = allOrders[newOrder - 1] + 1;
    } else {
      if (currentRelation?.order === allOrders[newOrder - 1]) {
        finalOrder = allOrders[newOrder];
      } else {
        finalOrder = allOrders[newOrder - 1];
      }
    }
    relationUpdateMutation.mutate({
      relationId: relationId,
      changes: { order: finalOrder },
    });
  };

  const getEntityTypeValue = () =>
    [allEntities].concat(entitiesDict).filter((i: any) => {
      switch (relationType) {
        case RelationEnums.Type.SubjectSemantics:
          return (entity as IAction).data.entities?.s.includes(i.value);
        case RelationEnums.Type.Actant1Semantics:
          return (entity as IAction).data.entities?.a1.includes(i.value);
        case RelationEnums.Type.Actant2Semantics:
          return (entity as IAction).data.entities?.a2.includes(i.value);
      }
    });

  const handleDropdownNewValue = (newValue: any) =>
    newValue ? (newValue as string[]).map((v: any) => v.value) : [];

  const getValencyValue = () => {
    switch (relationType) {
      case RelationEnums.Type.SubjectSemantics:
        return (entity as IAction).data.valencies?.s;
      case RelationEnums.Type.Actant1Semantics:
        return (entity as IAction).data.valencies?.a1;
      case RelationEnums.Type.Actant2Semantics:
        return (entity as IAction).data.valencies?.a2;
    }
  };

  return (
    <>
      {/* ENTITY TYPE ROW */}
      <StyledSectionHeading style={{ marginRight: ".8rem" }}>
        {relationRule.label.replace(" Semantics", "")}
      </StyledSectionHeading>

      <StyledLabelInputWrapper>
        <StyledLabel>Entity type</StyledLabel>
        <Dropdown
          allowAny
          disabled={!userCanEdit}
          isMulti
          options={entitiesDict}
          value={getEntityTypeValue()}
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
                    s:
                      relationType === RelationEnums.Type.SubjectSemantics
                        ? handleDropdownNewValue(newValue)
                        : entity.data.entities.s,
                    a1:
                      relationType === RelationEnums.Type.Actant1Semantics
                        ? handleDropdownNewValue(newValue)
                        : entity.data.entities.a1,
                    a2:
                      relationType === RelationEnums.Type.Actant2Semantics
                        ? handleDropdownNewValue(newValue)
                        : entity.data.entities.a2,
                  },
                },
              },
            });
          }}
        />
      </StyledLabelInputWrapper>

      {/* SEMANTICS ROW */}
      <StyledRelationTypeIconWrapper>
        <EntityDetailRelationTypeIcon relationType={relationType} />
      </StyledRelationTypeIconWrapper>

      <StyledSemanticsWrapper>
        <StyledLabelInputWrapper>
          <StyledLabel>Semantics</StyledLabel>
          <EntitySuggester
            categoryTypes={[EntityEnums.Class.Concept]}
            disableTemplatesAccept
            onSelected={(selectedId: string) => {
              handleMultiSelected(selectedId, relationType);
            }}
            excludedActantIds={usedEntityIds}
          />
        </StyledLabelInputWrapper>
        <StyledRelationsWrapper>
          {currentRelations.map((relation, key) => (
            <EntityDetailRelationRow
              key={key}
              index={key}
              relation={relation}
              entities={entities}
              entityId={entity.id}
              relationRule={relationRule}
              relationType={relationType}
              relationUpdateMutation={relationUpdateMutation}
              relationDeleteMutation={relationDeleteMutation}
              hasOrder={relationRule.order}
              moveRow={moveRow}
              updateOrderFn={updateOrderFn}
            />
          ))}
        </StyledRelationsWrapper>
      </StyledSemanticsWrapper>

      {/* VALENCY ROW */}
      <div />
      <StyledLabelInputWrapper>
        <StyledLabel>Grammatical valency</StyledLabel>
        <Input
          disabled={!userCanEdit}
          value={getValencyValue()}
          width="full"
          onChangeFn={async (newValue: string) => {
            const oldData = { ...entity.data };
            updateEntityMutation.mutate({
              data: {
                ...oldData,
                ...{
                  valencies: {
                    s:
                      relationType === RelationEnums.Type.SubjectSemantics
                        ? newValue
                        : entity.data.valencies.s,
                    a1:
                      relationType === RelationEnums.Type.Actant1Semantics
                        ? newValue
                        : entity.data.valencies.a1,
                    a2:
                      relationType === RelationEnums.Type.Actant2Semantics
                        ? newValue
                        : entity.data.valencies.a2,
                  },
                },
              },
            });
          }}
        />
      </StyledLabelInputWrapper>
    </>
  );
};
