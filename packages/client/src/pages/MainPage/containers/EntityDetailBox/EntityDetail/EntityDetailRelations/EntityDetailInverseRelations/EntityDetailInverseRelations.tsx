import { IResponseDetail, Relation } from "@shared/types";
import api from "api";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { getRelationInvertedRules } from "utils";
import {
  StyledDetailSectionHeader,
  StyledDetailSectionContent,
} from "../../EntityDetailStyles";
import { EntityDetailInverseRelation } from "./EntityDetailInverseRelation/EntityDetailInverseRelation";
import { StyledInverseRelations } from "./EntityDetailInverseRelationsStyles";

interface EntityDetailInverseRelations {
  entity: IResponseDetail;
}
export const EntityDetailInverseRelations: React.FC<
  EntityDetailInverseRelations
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
    <>
      {filteredRelationTypes.length > 0 && (
        <>
          <StyledDetailSectionHeader secondary>
            Inverse relations
          </StyledDetailSectionHeader>
          <StyledDetailSectionContent>
            <StyledInverseRelations>
              {filteredRelationTypes.map((relationType, key) => {
                const filteredRelations = relations.filter(
                  (r) => r.type === relationType && r.entityIds[0] !== entity.id
                );
                const relationRule: Relation.RelationRule =
                  Relation.RelationRules[relationType];

                if (!relationRule.asymmetrical) return;

                return (
                  <EntityDetailInverseRelation
                    key={key}
                    entity={entity}
                    relationRule={relationRule}
                    relationType={relationType}
                    relations={filteredRelations}
                    entities={entities}
                  />
                );
              })}
            </StyledInverseRelations>
          </StyledDetailSectionContent>
        </>
      )}
    </>
  );
};
