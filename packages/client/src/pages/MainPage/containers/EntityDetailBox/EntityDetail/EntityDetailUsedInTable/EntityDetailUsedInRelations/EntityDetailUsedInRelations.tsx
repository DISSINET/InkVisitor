import { IResponseDetail, Relation } from "@shared/types";
import React, { useEffect, useState } from "react";
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

  const { entities, relations } = entity;

  useEffect(() => {
    const filteredTypes = getEntityRelationRules(entity.class);
    setFilteredRelationTypes(filteredTypes);
  }, [entity]);

  return (
    <div>
      Used In Relations
      {filteredRelationTypes.map((relationType, key) => {
        const filteredRelations = relations.filter(
          (r) => r.type === relationType
        );
        // const isMultiple = Relation.RelationRules[relationType].multiple;
        const relationRule: Relation.RelationRule =
          Relation.RelationRules[relationType];
        return (
          <React.Fragment key={key}>
            {relationRule.asymmetrical && (
              <EntityDetailUsedInRelation
                entity={entity}
                relationType={relationType}
                relations={filteredRelations}
                entities={entities}
                // isMultiple={isMultiple}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
