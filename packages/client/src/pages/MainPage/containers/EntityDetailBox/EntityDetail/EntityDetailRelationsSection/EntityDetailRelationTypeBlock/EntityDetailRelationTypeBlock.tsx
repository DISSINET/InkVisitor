import { EntityEnums, RelationEnums } from "@shared/enums";
import {
  IResponseDetail,
  IResponseEntity,
  IResponseGeneric,
} from "@shared/types";
import { Relation } from "@shared/types/relation";
import { AxiosResponse } from "axios";
import { Button } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React from "react";
import { UseMutationResult } from "react-query";
import {
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
} from "../../EntityDetailStyles";
import {
  StyledEntityWrapper,
  StyledRelation,
} from "./EntityDetailRelationTypeBlockStyles";
import { entitiesDict } from "@shared/dictionaries";
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
    // TODO: solve for assymetrical! (from another side)
    const entitiesPattern =
      Relation.RelationRules[relationType].allowedEntitiesPattern;
    if (entitiesPattern.length > 0) {
      if (isCloudType) {
        return entitiesPattern.flat(1);
      } else {
        const pair = entitiesPattern.find((array) => array[0] === entity.class);
        if (pair) {
          return [pair[1]];
        }
      }
    } else {
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

  const handleCloudRemove = (entityId: string) => {
    if (relations[0]?.entityIds?.length > 2) {
      const newEntityIds = relations[0].entityIds.filter(
        (eId) => eId !== entityId
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

  return (
    <>
      <StyledDetailContentRow>
        <StyledDetailContentRowLabel>
          {Relation.RelationRules[relationType].label}
        </StyledDetailContentRowLabel>
        <StyledDetailContentRowValue>
          {relations.map((relation, key) => (
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
                            <Button
                              key="d"
                              icon={<FaUnlink />}
                              color="plain"
                              inverted
                              tooltip="unlink"
                              onClick={() => {
                                if (isCloudType) {
                                  handleCloudRemove(relationEntity.id);
                                } else {
                                  handleMultiRemove(relation.id);
                                }
                              }}
                            />
                          }
                        />
                      </StyledEntityWrapper>
                    )}
                  </React.Fragment>
                );
              })}
            </StyledRelation>
          ))}
          <EntitySuggester
            categoryTypes={
              getCategoryTypes() ||
              ([EntityEnums.Extension.Empty] as [EntityEnums.ExtendedClass])
            }
            onSelected={(selectedId: string) => {
              if (isCloudType) {
                handleCloudSelected(selectedId);
              } else {
                handleMultiSelected(selectedId);
              }
            }}
            excludedActantIds={[entity.id]}
          />
        </StyledDetailContentRowValue>
      </StyledDetailContentRow>
    </>
  );
};
