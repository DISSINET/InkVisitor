import { IResponseEntity } from "@shared/types";
import { Relation } from "@shared/types/relation";
import { EntityTag } from "components/advanced";
import React from "react";
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
}
export const EntityDetailRelationTypeBlock: React.FC<
  EntityDetailRelationTypeBlock
> = ({ relations, relationType, entities }) => {
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
            </StyledRelation>
          ))}
        </StyledDetailContentRowValue>
      </StyledDetailContentRow>
    </>
  );
};
