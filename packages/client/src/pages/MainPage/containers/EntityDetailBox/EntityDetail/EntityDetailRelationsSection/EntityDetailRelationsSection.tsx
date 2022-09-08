import { EntityEnums, RelationEnums } from "@shared/enums";
import { IResponseDetail } from "@shared/types";
import { Relation } from "@shared/types/relation";
import api from "api";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { StyledDetailForm } from "../EntityDetailStyles";
import { EntityDetailRelationTypeBlock } from "./EntityDetailRelationTypeBlock/EntityDetailRelationTypeBlock";

const restrictedIClasses = [
  EntityEnums.Class.Action,
  EntityEnums.Class.Concept,
];
interface EntityDetailRelationsSection {
  entity: IResponseDetail;
}
export const EntityDetailRelationsSection: React.FC<
  EntityDetailRelationsSection
> = ({ entity }) => {
  const [filteredRelationTypes, setFilteredRelationTypes] = useState<string[]>(
    []
  );

  // useEffect(() => {
  //   const newRelation: Relation.IModel = {
  //     id: uuidv4(),
  //     type: RelationEnums.Type.Classification,
  //     entityIds: [entity.id, "T1"],
  //   };
  //   api.relationCreate(newRelation);
  // }, []);

  useEffect(() => {
    const relationRules = Object.keys(Relation.RelationRules);
    const filteredTypes = relationRules.filter((rule) => {
      if (
        !Relation.RelationRules[rule].allowedEntitiesPattern.length &&
        !(
          rule === RelationEnums.Type.Identification &&
          restrictedIClasses.includes(entity.class)
        )
      ) {
        return rule;
      } else if (
        Relation.RelationRules[rule].allowedEntitiesPattern.some(
          (pair) => pair[0] === entity.class
        )
      ) {
        return rule;
      }
    });

    setFilteredRelationTypes(filteredTypes);
  }, [entity]);

  const { relations } = entity;

  return (
    <StyledDetailForm>
      {filteredRelationTypes.map((relationType, key) => {
        const filteredRelations = relations.filter(
          (r) => r.type === relationType
        );
        return (
          <EntityDetailRelationTypeBlock
            relationType={relationType}
            relations={filteredRelations}
            key={key}
          />
        );
      })}
    </StyledDetailForm>
  );
};
