import { IResponseDetail, IResponseEntity, Relation } from "@shared/types";
import { EntityTag } from "components/advanced";
import React from "react";
import {
  StyledHeading,
  StyledTagWrapper,
} from "./EntityDetailInvertedRelationStyles";

interface EntityDetailInvertedRelation {
  entity: IResponseDetail;
  relationRule: Relation.RelationRule;
  relations: Relation.IRelation[];
  entities?: IResponseEntity[];
}
export const EntityDetailInvertedRelation: React.FC<
  EntityDetailInvertedRelation
> = ({ entity, relationRule, relations, entities }) => {
  return (
    <div>
      <StyledHeading>{relationRule.inverseLabel}</StyledHeading>
      {relations.map((relation, key) => {
        const relationEntity = entities?.find(
          (e) => e.id === relation.entityIds[0]
        );
        if (relation.entityIds[0] === entity.id || !relationEntity) return;

        return (
          <StyledTagWrapper>
            <EntityTag key={key} entity={relationEntity} />
          </StyledTagWrapper>
        );
      })}
    </div>
  );
};
