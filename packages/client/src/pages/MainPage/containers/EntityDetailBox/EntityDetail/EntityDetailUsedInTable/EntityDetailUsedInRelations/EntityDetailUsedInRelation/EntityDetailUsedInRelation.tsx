import { IResponseDetail, Relation, IEntity } from "@shared/types";
import React from "react";

interface EntityDetailUsedInRelation {
  entity: IResponseDetail;
  relationType: string;
  relations: Relation.IRelation[];
  entities: Record<string, IEntity>;
}
export const EntityDetailUsedInRelation: React.FC<
  EntityDetailUsedInRelation
> = ({ entity, relationType, relations, entities }) => {
  return <div>{relationType}</div>;
};
