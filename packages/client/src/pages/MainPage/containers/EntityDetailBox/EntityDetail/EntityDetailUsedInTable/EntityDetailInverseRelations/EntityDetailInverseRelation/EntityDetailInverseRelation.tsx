import { RelationEnums } from "@shared/enums";
import { IResponseDetail, IResponseEntity, Relation } from "@shared/types";
import { LetterIcon } from "components";
import { EntityTag } from "components/advanced";
import React from "react";
import {
  StyledHeading,
  StyledInverseRelation,
  StyledTagWrapper,
} from "./EntityDetailInverseRelationStyles";

interface EntityDetailInverseRelation {
  entity: IResponseDetail;
  relationRule: Relation.RelationRule;
  relationType: string;
  relations: Relation.IRelation[];
  entities?: IResponseEntity[];
}
export const EntityDetailInverseRelation: React.FC<
  EntityDetailInverseRelation
> = ({ entity, relationType, relationRule, relations, entities }) => {
  return (
    <StyledInverseRelation>
      <StyledHeading>
        {relationRule.inverseLabel} - inverse of
        <LetterIcon letter={relationType} color="info" />
      </StyledHeading>
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
    </StyledInverseRelation>
  );
};
