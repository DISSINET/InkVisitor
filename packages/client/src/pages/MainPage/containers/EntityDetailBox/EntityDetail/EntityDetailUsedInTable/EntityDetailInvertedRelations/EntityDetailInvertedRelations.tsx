import { IResponseDetail, Relation } from "@shared/types";
import api from "api";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { getRelationInvertedRules } from "utils";
import { EntityDetailInvertedRelation } from "./EntityDetailInvertedRelation/EntityDetailInvertedRelation";

interface EntityDetailInvertedRelations {
  entity: IResponseDetail;
}
export const EntityDetailInvertedRelations: React.FC<
  EntityDetailInvertedRelations
> = ({ entity }) => {
  const [filteredRelationTypes, setFilteredRelationTypes] = useState<string[]>(
    []
  );

  const { relations } = entity;

  useEffect(() => {
    const filteredTypes = getRelationInvertedRules(entity.class);
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
      {filteredRelationTypes.map((relationType, key) => {
        const filteredRelations = relations.filter(
          (r) => r.type === relationType && r.entityIds[0] !== entity.id
        );
        const relationRule: Relation.RelationRule =
          Relation.RelationRules[relationType];

        if (!relationRule.asymmetrical || !filteredRelations.length) return;

        return (
          <EntityDetailInvertedRelation
            key={key}
            entity={entity}
            relationRule={relationRule}
            relations={filteredRelations}
            entities={entities}
          />
        );
      })}
    </div>
  );
};
