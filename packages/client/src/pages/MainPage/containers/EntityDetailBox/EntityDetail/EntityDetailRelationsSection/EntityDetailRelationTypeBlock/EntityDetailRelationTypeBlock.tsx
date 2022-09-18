import { EntityEnums, RelationEnums } from "@shared/enums";
import {
  IResponseDetail,
  IResponseEntity,
  IResponseGeneric,
} from "@shared/types";
import { Relation } from "@shared/types/relation";
import { AxiosResponse } from "axios";
import { Button, Cloud, Dropdown } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React, { useEffect, useState } from "react";
import { UseMutationResult } from "react-query";
import {
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
} from "../../EntityDetailStyles";
import {
  StyledCloudEntityWrapper,
  StyledEntityWrapper,
  StyledRelation,
} from "./EntityDetailRelationTypeBlockStyles";
import { certaintyDict, entitiesDict } from "@shared/dictionaries";
import { v4 as uuidv4 } from "uuid";
import { FaUnlink } from "react-icons/fa";

// relations for one type
interface EntityDetailRelationTypeBlock {
  relations: Relation.IModel[];
  relationType: string;
  entities: IResponseEntity[] | undefined;
  relationCreateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    Relation.IModel,
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
export const EntityDetailRelationTypeBlock: React.FC<
  EntityDetailRelationTypeBlock
> = ({
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
  const getCategoryTypes = (): EntityEnums.ExtendedClass[] | undefined => {
    const entitiesPattern =
      Relation.RelationRules[relationType].allowedEntitiesPattern;

    if (entitiesPattern.length > 0) {
      if (isCloudType) {
        if (Relation.RelationRules[relationType].allowedSameEntityClassesOnly) {
          return [entity.class];
        } else {
          return entitiesPattern.flat(1);
        }
      } else if (!Relation.RelationRules[relationType].asymmetrical) {
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
        const rightSide = entitiesPattern.filter(
          (array) => array[1] === entity.class
        );
        if (rightSide.length > 0) {
          const collectedRight = rightSide.map((r) => r[0]);
          collectedEntities.push(...collectedRight);
        }
        return [...new Set(collectedEntities)];
      }
    } else {
      // Multiple
      return entitiesDict.map((e) => e.value as EntityEnums.Class);
    }
  };

  const handleCloudSelected = (selectedId: string) => {
    if (relations[0]?.entityIds?.length > 0) {
      const changes = { entityIds: [...relations[0].entityIds, selectedId] };
      relationUpdateMutation.mutate({
        relationId: relations[0].id,
        changes: changes,
      });
    } else {
      const newRelation: Relation.IModel = {
        id: uuidv4(),
        entityIds: [entity.id, selectedId],
        type: relationType as RelationEnums.Type,
      };
      relationCreateMutation.mutate(newRelation);
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
    const newRelation: Relation.IModel = {
      id: uuidv4(),
      entityIds: [entity.id, selectedId],
      type: relationType as RelationEnums.Type,
    };
    relationCreateMutation.mutate(newRelation);
  };

  const [usedEntityIds, setUsedEntityIds] = useState<string[]>([]);

  useEffect(() => {
    const entityIds = relations
      .map((relation) => relation.entityIds.map((entityId) => entityId))
      .flat(1);
    setUsedEntityIds([...new Set(entityIds)]);
  }, [entities, relations]);

  const renderCloudRelation = (relation: Relation.IModel, key: number) => (
    <StyledRelation key={key}>
      {relation.entityIds.map((entityId, key) => {
        const relationEntity = entities?.find((e) => e.id === entityId);
        return (
          <React.Fragment key={key}>
            {relationEntity && relationEntity.id !== entity.id && (
              <StyledCloudEntityWrapper>
                <EntityTag entity={relationEntity} />
              </StyledCloudEntityWrapper>
            )}
          </React.Fragment>
        );
      })}
    </StyledRelation>
  );

  const unlinkButtonEnabled = (key: number) =>
    !Relation.RelationRules[relationType].asymmetrical ||
    (Relation.RelationRules[relationType].asymmetrical && key > 0);

  const renderNonCloudRelation = (relation: Relation.IModel, key: number) => (
    <StyledRelation key={key}>
      {relation.entityIds.map((entityId, key) => {
        const relationEntity = entities?.find((e) => e.id === entityId);
        return (
          <React.Fragment key={key}>
            {relationEntity && relationEntity.id !== entity.id && (
              <StyledEntityWrapper>
                <EntityTag
                  entity={relationEntity}
                  button={
                    unlinkButtonEnabled(key) && (
                      <Button
                        key="d"
                        icon={<FaUnlink />}
                        color="plain"
                        inverted
                        tooltip="unlink"
                        onClick={() => handleMultiRemove(relation.id)}
                      />
                    )
                  }
                />
              </StyledEntityWrapper>
            )}
          </React.Fragment>
        );
      })}
      {/* TODO: Make universal */}
      {relationType === RelationEnums.Type.Identification && (
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
      )}
    </StyledRelation>
  );

  return (
    <>
      <StyledDetailContentRow>
        <StyledDetailContentRowLabel>
          {Relation.RelationRules[relationType].label}
        </StyledDetailContentRowLabel>
        <StyledDetailContentRowValue>
          {relations.map((relation, key) =>
            isCloudType ? (
              <Cloud key={key} onUnlink={() => handleCloudRemove()}>
                {renderCloudRelation(relation, key)}
              </Cloud>
            ) : (
              renderNonCloudRelation(relation, key)
            )
          )}
          {!isCloudType && (
            <div style={{ marginTop: "0.3rem" }}>
              <EntitySuggester
                categoryTypes={
                  getCategoryTypes() ||
                  ([EntityEnums.Extension.Empty] as [EntityEnums.ExtendedClass])
                }
                onSelected={(selectedId: string) => {
                  if (isCloudType) {
                    // TODO: new BE function to adding to cloud
                    // handleCloudSelected(selectedId);
                  } else {
                    handleMultiSelected(selectedId);
                  }
                }}
                excludedActantIds={usedEntityIds}
              />
            </div>
          )}
        </StyledDetailContentRowValue>
      </StyledDetailContentRow>
    </>
  );
};
