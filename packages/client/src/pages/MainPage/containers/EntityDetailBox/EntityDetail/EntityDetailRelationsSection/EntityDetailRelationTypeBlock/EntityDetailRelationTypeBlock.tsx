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
import { StyledRelation } from "./EntityDetailRelationTypeBlockStyles";
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
    if (relations[0]?.entityIds.length > 0) {
      console.log("here");
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

  const handleMultiSelected = (selectedId: string) => {
    // relationCreateMutation.mutate()
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
                const entity = entities?.find((e) => e.id === entityId);
                return (
                  <React.Fragment key={key}>
                    {entity && (
                      <EntityTag
                        entity={entity}
                        button={
                          <Button
                            key="d"
                            icon={<FaUnlink />}
                            color="plain"
                            inverted
                            tooltip="unlink"
                            onClick={() => {
                              // TODO: unlink for coudType (removeRelation if empty)
                              // removeRelation for multiple
                            }}
                          />
                        }
                      />
                    )}
                  </React.Fragment>
                );
              })}
              <Button
                label="Remove relation"
                onClick={() => relationDeleteMutation.mutate(relation.id)}
              />
            </StyledRelation>
          ))}
          <EntitySuggester
            categoryTypes={
              getCategoryTypes() ||
              ([EntityEnums.Extension.Empty] as [EntityEnums.ExtendedClass])
            }
            onSelected={
              // TODO: add to cloudType / create new relation when multi
              (selectedId: string) => {
                if (isCloudType) {
                  handleCloudSelected(selectedId);
                } else {
                  console.log("multiple type");
                }
              }
            }
          />
        </StyledDetailContentRowValue>
      </StyledDetailContentRow>
    </>
  );
};
