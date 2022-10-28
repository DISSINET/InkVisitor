import {
  IResponseDetail,
  Relation,
  IEntity,
  IResponseEntity,
} from "@shared/types";
import { EntityTag } from "components/advanced";
import React from "react";
import { StyledHeading } from "./EntityDetailUsedInRelationStyles";

interface EntityDetailUsedInRelation {
  entity: IResponseDetail;
  // relationType: string;
  relationRule: Relation.RelationRule;
  relations: Relation.IRelation[];
  entities?: IResponseEntity[];
}
export const EntityDetailUsedInRelation: React.FC<
  EntityDetailUsedInRelation
> = ({ entity, relationRule, relations, entities }) => {
  return (
    <div>
      <StyledHeading>{relationRule.inverseLabel}</StyledHeading>
      {relations.map((relation, key) => {
        const relationEntity = entities?.find(
          (e) => e.id === relation.entityIds[0]
        );
        if (relation.entityIds[0] === entity.id || !relationEntity) return;

        return <EntityTag key={key} entity={relationEntity} />;
      })}
    </div>
  );
};
