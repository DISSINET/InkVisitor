import { certaintyDict, entitiesDict } from "@shared/dictionaries";
import { EntityEnums, RelationEnums } from "@shared/enums";
import {
  IResponseDetail,
  IResponseEntity,
  IResponseGeneric,
  Relation,
} from "@shared/types";
import api from "api";
import { AxiosResponse } from "axios";
import { Button, Cloud, Dropdown, LetterIcon } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React, { useEffect, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { TbArrowNarrowRight, TbArrowsHorizontal } from "react-icons/tb";
import { UseMutationResult, useQuery } from "react-query";
import theme from "Theme/theme";
import { v4 as uuidv4 } from "uuid";
import {
  StyledCloudEntityWrapper,
  StyledEntityWrapper,
  StyledGrid,
  StyledLabel,
  StyledLabelSuggester,
  StyledRelation,
  StyledRelationType,
  StyledRelationValues,
  StyledSuggesterWrapper,
} from "./EntityDetailRelationTypeBlockStyles";

// relations for one type
interface EntityDetailRelationTypeBlock {
  relations: Relation.IRelation[];
  relationType: string;
  entities?: IResponseEntity[];
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
  entity: IResponseDetail;
}
export const EntityDetailRelationTypeBlock: React.FC<EntityDetailRelationTypeBlock> =
  ({
    relations,
    relationType,
    entities,
    relationCreateMutation,
    relationUpdateMutation,
    relationDeleteMutation,
    isCloudType,
    isMultiple,
    entity,
  }) => {
    const relationRule = Relation.RelationRules[relationType];

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
        return entitiesDict.map((e) => e.value as EntityEnums.Class);
      }
    };

    const handleCloudRemove = () => {
      if (relations[0]?.entityIds?.length > 2) {
        const newEntityIds = relations[0].entityIds.filter(
          (eId) => eId !== entity.id
        );
        relationUpdateMutation.mutate({
          relationId: relations[0].id,
          changes: { entityIds: newEntityIds },
        });
      } else {
        relationDeleteMutation.mutate(relations[0].id);
      }
    };

    const handleMultiRemove = (relationId: string) => {
      relationDeleteMutation.mutate(relationId);
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

    const renderCloudRelation = (
      relation: Relation.IRelation,
      key: number
    ): React.ReactElement => (
      <StyledGrid key={key}>
        {relation.entityIds.length > 0 && (
          <Cloud onUnlink={() => handleCloudRemove()}>
            <StyledRelation>
              {relation.entityIds.map((entityId, key) => {
                const relationEntity = entities?.find((e) => e.id === entityId);
                return (
                  <React.Fragment key={key}>
                    {relationEntity && relationEntity.id !== entity.id && (
                      <StyledCloudEntityWrapper>
                        <EntityTag fullWidth entity={relationEntity} />
                      </StyledCloudEntityWrapper>
                    )}
                  </React.Fragment>
                );
              })}
            </StyledRelation>
          </Cloud>
        )}
      </StyledGrid>
    );

    const shouldBeRendered = (key: number) =>
      !relationRule.asymmetrical || (relationRule.asymmetrical && key > 0);

    const renderNonCloudRelation = (
      relation: Relation.IRelation,
      key: number
    ): React.ReactElement => (
      <StyledGrid key={key} hasAttribute={relationRule.attributes.length > 0}>
        <StyledRelation>
          {relation.entityIds.map((entityId, key) => {
            const relationEntity = entities?.find((e) => e.id === entityId);
            return (
              <React.Fragment key={key}>
                {relationEntity &&
                  relationEntity.id !== entity.id &&
                  shouldBeRendered(key) && (
                    <StyledEntityWrapper key={key}>
                      <EntityTag
                        fullWidth
                        entity={relationEntity}
                        button={
                          <Button
                            key="d"
                            icon={<FaUnlink />}
                            color="plain"
                            inverted
                            tooltip="unlink"
                            onClick={() => handleMultiRemove(relation.id)}
                          />
                        }
                      />
                    </StyledEntityWrapper>
                  )}
              </React.Fragment>
            );
          })}
        </StyledRelation>

        {/* TODO: Make universal */}
        {/* Certainty (Identification) */}
        {relationType === RelationEnums.Type.Identification && (
          <div>
            <Dropdown
              width={140}
              placeholder="certainty"
              options={certaintyDict}
              value={{
                value: (relation as Relation.IIdentification).certainty,
                label: certaintyDict.find(
                  (c) =>
                    c.value === (relation as Relation.IIdentification).certainty
                )?.label,
              }}
              onChange={(newValue: any) => {
                relationUpdateMutation.mutate({
                  relationId: relation.id,
                  changes: { certainty: newValue.value as string },
                });
              }}
            />
          </div>
        )}
      </StyledGrid>
    );

    const [tempCloudEntityId, setTempCloudEntityId] =
      useState<string | false>(false);

    const {} = useQuery(
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
      const selectedEntityRelation = cloudEntity.relations.find(
        (r) => r.type === relationType
      );
      if (selectedEntityRelation) {
        // update existing relation
        const changes = {
          entityIds: [...selectedEntityRelation.entityIds, entity.id],
        };
        relationUpdateMutation.mutate({
          relationId: selectedEntityRelation.id,
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

    return (
      <>
        {/* Type column */}
        <StyledRelationType>
          <LetterIcon letter={relationType} color="info" />
          {relationRule.inverseLabel.length ? (
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
          {isMultiple
            ? relations
                .sort((a, b) =>
                  a.order && b.order ? (a.order > b.order ? -1 : 1) : 0
                )
                .map((relation, key) => renderNonCloudRelation(relation, key))
            : relations.map((relation, key) =>
                isCloudType
                  ? renderCloudRelation(relation, key)
                  : renderNonCloudRelation(relation, key)
              )}
        </StyledRelationValues>
      </>
    );
  };
