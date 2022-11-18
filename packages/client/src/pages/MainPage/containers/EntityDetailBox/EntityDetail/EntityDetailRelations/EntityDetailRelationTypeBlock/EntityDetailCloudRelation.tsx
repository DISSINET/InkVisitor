import { IResponseEntity, IResponseGeneric, Relation } from "@shared/types";
import { AxiosResponse } from "axios";
import { Cloud } from "components";
import { EntityTag } from "components/advanced";
import React from "react";
import { UseMutationResult } from "react-query";
import {
  StyledCloudEntityWrapper,
  StyledGrid,
  StyledRelation,
} from "./EntityDetailRelationTypeBlockStyles";

interface EntityDetailCloudRelation {
  relation: Relation.IRelation;
  entityId: string;
  entities?: IResponseEntity[];
  relations: Relation.IRelation[];
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
export const EntityDetailCloudRelation: React.FC<EntityDetailCloudRelation> = ({
  relation,
  entityId,
  entities,
  relations,
  relationUpdateMutation,
  relationDeleteMutation,
}) => {
  const handleCloudRemove = () => {
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

  return (
    <StyledGrid>
      {relation.entityIds.length > 0 && (
        <Cloud onUnlink={() => handleCloudRemove()}>
          <StyledRelation>
            {relation.entityIds.map((relationEntityId, key) => {
              const relationEntity = entities?.find(
                (e) => e.id === relationEntityId
              );
              return (
                <React.Fragment key={key}>
                  {relationEntity && relationEntity.id !== entityId && (
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
};
