import { IResponseDetail, Relation } from "@shared/types";
import api from "api";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { getEntityRelationRules } from "utils";
import { EntityDetailUsedInRelation } from "./EntityDetailUsedInRelation/EntityDetailUsedInRelation";

interface EntityDetailUsedInRelations {
  entity: IResponseDetail;
}
export const EntityDetailUsedInRelations: React.FC<
  EntityDetailUsedInRelations
> = ({ entity }) => {
  const [filteredRelationTypes, setFilteredRelationTypes] = useState<string[]>(
    []
  );

  const { relations } = entity;

  useEffect(() => {
    const filteredTypes = getEntityRelationRules(entity.class);
    setFilteredRelationTypes(filteredTypes);
  }, [entity]);

  const allEntityIds = relations.map((r) => r.entityIds).flat(1);
  const noDuplicates = [...new Set(allEntityIds)].filter((id) => id.length > 0);

  const { data: entities } = useQuery(
    ["relation-entities", noDuplicates],
    async () => {
      const res = await api.entitiesSearch({ entityIds: noDuplicates });
      return res.data;
    },
    {
      enabled: api.isLoggedIn() && noDuplicates.length > 0,
    }
  );

  return (
    <div>
      Used In Relations
      {filteredRelationTypes.map((relationType, key) => {
        const filteredRelations = relations.filter(
          (r) => r.type === relationType
        );
        const relationRule: Relation.RelationRule =
          Relation.RelationRules[relationType];

        if (!relationRule.asymmetrical) return;
        return (
          <EntityDetailUsedInRelation
            key={key}
            entity={entity}
            // relationType={relationType}
            relationRule={relationRule}
            relations={filteredRelations}
            entities={entities}
          />
        );
      })}
    </div>
  );
};
