import {
  IEntity,
  IResponseDetail,
  IResponseEntity,
  Relation,
} from "@shared/types";
import { LetterIcon } from "components";
import { EntityTag } from "components/advanced";
import React from "react";
import {
  StyledHeading,
  StyledInverseRelationGroup,
  StyledTagWrapper,
} from "./EntityDetailInverseRelationStyles";

interface EntityDetailInverseRelation {
  entity: IResponseDetail;
  relationRule: Relation.RelationRule;
  relationType: string;
  relations?: Relation.IRelation[];
  entities: Record<string, IEntity>;
}
export const EntityDetailInverseRelation: React.FC<
  EntityDetailInverseRelation
> = ({ entity, relationType, relationRule, relations, entities }) => {
  return (
    <>
      <StyledHeading>
        <div>
          {relationRule.inverseLabel}
          <i> - inverse of</i>
        </div>
        <LetterIcon letter={relationType} color="info" />
      </StyledHeading>
      <StyledInverseRelationGroup>
        {relations?.map((relation, key) => {
          const relationEntity = entities[relation.entityIds[0]];

          if (relation.entityIds[0] === entity.id || !relationEntity) return;

          return (
            <StyledTagWrapper key={key}>
              <EntityTag entity={relationEntity} fullWidth />
            </StyledTagWrapper>
          );
        })}
      </StyledInverseRelationGroup>
    </>
  );
};
