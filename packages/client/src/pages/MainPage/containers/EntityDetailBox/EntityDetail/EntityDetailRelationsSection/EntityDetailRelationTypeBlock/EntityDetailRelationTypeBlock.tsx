import { IResponseEntity, IResponseGeneric } from "@shared/types";
import { Relation } from "@shared/types/relation";
import { AxiosResponse } from "axios";
import { Button } from "components";
import { EntityTag } from "components/advanced";
import React from "react";
import { UseMutationResult } from "react-query";
import {
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
} from "../../EntityDetailStyles";
import { StyledRelation } from "./EntityDetailRelationTypeBlockStyles";

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
}) => {
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
                    {entity && <EntityTag entity={entity} />}
                  </React.Fragment>
                );
              })}
              <Button
                label="Remove relation"
                onClick={() => relationDeleteMutation.mutate(relation.id)}
              />
            </StyledRelation>
          ))}
        </StyledDetailContentRowValue>
      </StyledDetailContentRow>
    </>
  );
};
