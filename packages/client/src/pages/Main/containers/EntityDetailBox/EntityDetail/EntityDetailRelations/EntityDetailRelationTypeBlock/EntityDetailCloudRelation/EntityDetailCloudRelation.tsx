import { IEntity, IResponseGeneric, Relation } from "@shared/types";
import { AxiosResponse } from "axios";
import { Cloud } from "components";
import { EntityTag } from "components/advanced";
import React, { useMemo } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import {
  StyledCloudEntityWrapper,
  StyledRelation,
} from "../EntityDetailRelationTypeBlockStyles";

interface EntityDetailCloudRelation {
  relation: Relation.IRelation;
  entityId: string;
  entities: Record<string, IEntity>;
  relations: Relation.IRelation[];
  relationUpdateMutation?: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      relationId: string;
      changes: Partial<Relation.IRelation>;
    },
    unknown
  >;
  relationDeleteMutation?: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    string,
    unknown
  >;
  userCanEdit: boolean;
}
export const EntityDetailCloudRelation: React.FC<EntityDetailCloudRelation> = ({
  relation,
  entityId,
  entities,
  relations,
  relationUpdateMutation,
  relationDeleteMutation,
  userCanEdit,
}) => {
  const handleCloudRemove = () => {
    if (relations[0]?.entityIds?.length > 2) {
      const newEntityIds = relations[0].entityIds.filter(
        (eId) => eId !== entityId
      );
      relationUpdateMutation?.mutate({
        relationId: relations[0].id,
        changes: { entityIds: newEntityIds },
      });
    } else {
      relationDeleteMutation?.mutate(relations[0].id);
    }
  };

  // entity for which the relation is shown
  const originEntity = useMemo<IEntity | undefined>(() => {
    return entities[entityId];
  }, [entities, entityId]);

  return (
    <div style={{ display: "grid" }}>
      {relation.entityIds.length > 0 && (
        // TODO: disable unlink for read mode
        <Cloud
          onUnlink={() => handleCloudRemove()}
          originEntity={originEntity}
          disabled={!userCanEdit}
        >
          <StyledRelation>
            {relation.entityIds.map((relationEntityId, key) => {
              const relationEntity = entities[relationEntityId];

              const isOrigin = relationEntityId === entityId;

              return (
                <React.Fragment key={key}>
                  {relationEntity && (
                    <StyledCloudEntityWrapper>
                      <EntityTag
                        fullWidth
                        entity={relationEntity}
                        isSelected={isOrigin}
                      />
                    </StyledCloudEntityWrapper>
                  )}
                </React.Fragment>
              );
            })}
          </StyledRelation>
        </Cloud>
      )}
    </div>
  );
};
