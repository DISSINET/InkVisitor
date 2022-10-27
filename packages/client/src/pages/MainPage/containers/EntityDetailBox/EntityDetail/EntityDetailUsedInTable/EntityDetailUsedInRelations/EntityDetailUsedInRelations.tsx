import { IResponseDetail } from "@shared/types";
import React, { useEffect, useState } from "react";
import { getEntityRelationRules } from "utils";

interface EntityDetailUsedInRelations {
  entity: IResponseDetail;
}
export const EntityDetailUsedInRelations: React.FC<
  EntityDetailUsedInRelations
> = ({ entity }) => {
  const [filteredRelationTypes, setFilteredRelationTypes] = useState<string[]>(
    []
  );

  const { entities, relations } = entity;

  useEffect(() => {
    const filteredTypes = getEntityRelationRules(entity.class);
    setFilteredRelationTypes(filteredTypes);
  }, [entity]);

  return <div>Used In Relations</div>;
};
