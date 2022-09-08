import { RelationEnums } from "@shared/enums";
import { Relation } from "@shared/types/relation";
import { EntityTag } from "components/advanced";
import React from "react";
import {
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
} from "../../EntityDetailStyles";
import { StyledRelation } from "./EntityDetailRelationTypeBlockStyles";

interface EntityDetailRelationTypeBlock {
  // one type relations
  relations: Relation.IModel[];
  relationType: string;
}
export const EntityDetailRelationTypeBlock: React.FC<
  EntityDetailRelationTypeBlock
> = ({ relations, relationType }) => {
  return (
    <>
      <StyledDetailContentRow>
        <StyledDetailContentRowLabel>
          {Relation.RelationRules[relationType].label}
        </StyledDetailContentRowLabel>
        <StyledDetailContentRowValue>
          {relations.map((relation, key) => (
            <StyledRelation>
              {relation.entityIds.map(
                (entityId) =>
                  // <EntityTag entity={} />
                  entityId
              )}
            </StyledRelation>
          ))}
        </StyledDetailContentRowValue>
      </StyledDetailContentRow>
    </>
  );
};
