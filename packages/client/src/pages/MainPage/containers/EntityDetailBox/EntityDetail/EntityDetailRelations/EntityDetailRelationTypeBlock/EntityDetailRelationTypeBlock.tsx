import { entitiesDict } from "@shared/dictionaries";
import { EntityEnums, RelationEnums } from "@shared/enums";
import {
  IEntity,
  IResponseDetail,
  IResponseGeneric,
  Relation,
} from "@shared/types";
import api from "api";
import { AxiosResponse } from "axios";
import { LetterIcon } from "components";
import { EntitySuggester } from "components/advanced";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";
import { TbArrowNarrowRight, TbArrowsHorizontal } from "react-icons/tb";
import { UseMutationResult, useQuery } from "react-query";
import { restrictedIDEClasses } from "Theme/constants";
import theme from "Theme/theme";
import { v4 as uuidv4 } from "uuid";
import { EntityDetailCloudRelation } from "./EntityDetailCloudRelation/EntityDetailCloudRelation";
import { EntityDetailRelationRow } from "./EntityDetailRelationRow/EntityDetailRelationRow";
import {
  StyledLabel,
  StyledLabelSuggester,
  StyledRelationType,
  StyledRelationValues,
  StyledSuggesterWrapper,
} from "./EntityDetailRelationTypeBlockStyles";

// relations for one type
interface EntityDetailRelationTypeBlock {
  relations?: Relation.IRelation[];
  relationType: RelationEnums.Type;
  entities: Record<string, IEntity>;
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
  isCloudType: boolean;
  isMultiple: boolean;
  hasOrder: boolean;
  entity: IResponseDetail;
}
export const EntityDetailRelationTypeBlock: React.FC<
  EntityDetailRelationTypeBlock
> = ({
  relations = [],
  relationType,
  entities,
  relationCreateMutation,
  relationUpdateMutation,
  relationDeleteMutation,
  isCloudType,
  isMultiple,
  hasOrder,
  entity,
}) => {
  const relationRule = Relation.RelationRules[relationType]!;

  // For suggester
  const getCategoryTypes = (): EntityEnums.ExtendedClass[] | undefined => {
    const entitiesPattern = relationRule.allowedEntitiesPattern;

    if (entitiesPattern.length > 0) {
      if (isCloudType) {
        if (relationRule.allowedSameEntityClassesOnly) {
          return [entity.class];
        } else {
          return entitiesPattern.flat(1);
        }
      } else if (!relationRule.asymmetrical) {
        // Symetrical
        const pairs = entitiesPattern.filter(
          (array) => array[0] === entity.class
        );
        if (pairs.length > 0) {
          return [...new Set(pairs.map((pair) => pair[1]))];
        }
      } else {
        // Asymetrical
        let collectedEntities: EntityEnums.Class[] = [];
        const leftSide = entitiesPattern.filter(
          (array) => array[0] === entity.class
        );
        if (leftSide.length > 0) {
          const collectedLeft = leftSide.map((r) => r[1]);
          collectedEntities.push(...collectedLeft);
        }

        return [...new Set(collectedEntities)];
      }
    } else {
      // Multiple
      const allEntities = entitiesDict.map((e) => e.value as EntityEnums.Class);
      if (relationType === RelationEnums.Type.Identification) {
        return allEntities.filter((e) => !restrictedIDEClasses.includes(e));
      } else {
        return allEntities;
      }
    }
  };

  const handleMultiSelected = (selectedId: string) => {
    if (relationType === RelationEnums.Type.Identification) {
      const newRelation: Relation.IIdentification = {
        id: uuidv4(),
        entityIds: [entity.id, selectedId],
        type: RelationEnums.Type.Identification,
        certainty: EntityEnums.Certainty.Certain,
      };
      relationCreateMutation.mutate(newRelation);
    } else {
      const newRelation: Relation.IRelation = {
        id: uuidv4(),
        entityIds: [entity.id, selectedId],
        type: relationType as RelationEnums.Type,
      };
      relationCreateMutation.mutate(newRelation);
    }
  };

  const [usedEntityIds, setUsedEntityIds] = useState<string[]>([]);

  useEffect(() => {
    const entityIds = relations
      .map((relation) => relation.entityIds.map((entityId) => entityId))
      .flat(1)
      .concat(entity.id);
    setUsedEntityIds([...new Set(entityIds)]);
  }, [entities, relations]);

  const [tempCloudEntityId, setTempCloudEntityId] = useState<string | false>(
    false
  );

  const { isLoading, isFetching } = useQuery(
    ["relation-entity-temp", tempCloudEntityId],
    async () => {
      if (tempCloudEntityId) {
        const res = await api.detailGet(tempCloudEntityId);
        if (res.data) {
          addToCloud(res.data);
          setTempCloudEntityId(false);
        }
      }
    },
    {
      enabled: api.isLoggedIn() && !!tempCloudEntityId,
    }
  );

  const addToCloud = (cloudEntity: IResponseDetail) => {
    const selectedEntityRelation =
      cloudEntity.relations[relationType]?.connections;
    // console.log(cloudEntity);

    if (selectedEntityRelation?.length) {
      // update existing relation
      const changes = {
        entityIds: [...selectedEntityRelation[0].entityIds, entity.id],
      };
      relationUpdateMutation.mutate({
        relationId: selectedEntityRelation[0].id,
        changes: changes,
      });
    } else {
      // Create new relation (cloud init)
      const newRelation: Relation.IRelation = {
        id: uuidv4(),
        entityIds: [entity.id, cloudEntity.id],
        type: relationType as RelationEnums.Type,
      };
      relationCreateMutation.mutate(newRelation);
    }
  };

  useEffect(() => {
    setCurrentRelations(relations);
  }, [relations]);

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
    let allOrders: number[] = relations.map((relation, key) =>
      relation.order !== undefined ? relation.order : 0
    );
    let finalOrder: number = 0;

    const currentRelation = relations.find(
      (relation) => relation.id === relationId
    );

    if (newOrder === 0) {
      finalOrder = allOrders[0] - 1;
    } else if (newOrder === relations.length - 1) {
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

  return (
    <>
      {/* Type column */}
      <StyledRelationType>
        <LetterIcon letter={relationType} color="info" />
        {relationRule.inverseLabel ? (
          <TbArrowsHorizontal color={theme.color["info"]} />
        ) : (
          <TbArrowNarrowRight color={theme.color["info"]} />
        )}
      </StyledRelationType>
      {/* Label & Suggester column */}
      <StyledLabelSuggester>
        <StyledLabel>{relationRule.label}</StyledLabel>
        {(isMultiple || relations.length < 1) && (
          <StyledSuggesterWrapper>
            <EntitySuggester
              categoryTypes={
                getCategoryTypes() ||
                ([EntityEnums.Extension.Empty] as [EntityEnums.ExtendedClass])
              }
              onSelected={(selectedId: string) => {
                if (isCloudType) {
                  setTempCloudEntityId(selectedId);
                } else {
                  handleMultiSelected(selectedId);
                }
              }}
              excludedActantIds={usedEntityIds}
            />
          </StyledSuggesterWrapper>
        )}
      </StyledLabelSuggester>
      {/* Values column */}
      <StyledRelationValues>
        {currentRelations.map((relation, key) =>
          isCloudType ? (
            <EntityDetailCloudRelation
              key={key}
              relation={relation}
              entityId={entity.id}
              relations={relations}
              entities={entities}
              relationUpdateMutation={relationUpdateMutation}
              relationDeleteMutation={relationDeleteMutation}
            />
          ) : (
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
              hasOrder={hasOrder && currentRelations.length > 1}
              moveRow={moveRow}
              updateOrderFn={updateOrderFn}
            />
          )
        )}
      </StyledRelationValues>
    </>
  );
};
