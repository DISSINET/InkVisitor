import { RelationEnums } from "@shared/enums";
import { IResponseDetail, Relation } from "@shared/types";
import React, { useEffect, useState } from "react";
import { getRelationInvertedRules } from "utils";
import {
  StyledDetailSectionContent,
  StyledDetailSectionHeader,
} from "../../EntityDetailStyles";
import { EntityDetailInverseRelation } from "./EntityDetailInverseRelation/EntityDetailInverseRelation";
import { StyledInverseRelationRow } from "./EntityDetailInverseRelationsStyles";

interface EntityDetailInverseRelations {
  entity: IResponseDetail;
}
export const EntityDetailInverseRelations: React.FC<
  EntityDetailInverseRelations
> = ({ entity }) => {
  const [filteredRelationTypes, setFilteredRelationTypes] = useState<
    RelationEnums.Type[]
  >([]);

  const { relations, entities } = entity;

  useEffect(() => {
    const filteredTypes = getRelationInvertedRules(entity.class);
    setFilteredRelationTypes(filteredTypes);
  }, [entity]);

  return (
    <>
      {filteredRelationTypes.length > 0 && (
        <>
          <StyledDetailSectionHeader secondary>
            Inverse relations
          </StyledDetailSectionHeader>
          <StyledDetailSectionContent>
            {filteredRelationTypes.map((relationType, key) => {
              const selectedRelations = relations[relationType]?.iConnections;
              const relationRule: Relation.RelationRule =
                Relation.RelationRules[relationType]!;

              if (!relationRule.asymmetrical) return;

              return (
                <StyledInverseRelationRow key={key}>
                  <EntityDetailInverseRelation
                    entity={entity}
                    relationRule={relationRule}
                    relationType={relationType}
                    relations={selectedRelations}
                    entities={entities}
                  />
                </StyledInverseRelationRow>
              );
            })}
          </StyledDetailSectionContent>
        </>
      )}
    </>
  );
};
