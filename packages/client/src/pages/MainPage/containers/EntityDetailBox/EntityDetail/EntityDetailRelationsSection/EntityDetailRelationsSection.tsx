import { EntityEnums, RelationEnums } from "@shared/enums";
import { IResponseDetail } from "@shared/types";
import { Relation } from "@shared/types/relation";
import api from "api";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

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
  const [filteredRelationRules, setFilteredRelationRules] = useState<string[]>(
    []
  );

  // useEffect(() => {
  //   const newRelation: Relation.IModel = {
  //     id: uuidv4(),
  //     type: RelationEnums.Type.Related,
  //     entityIds: [entity.id, ""],
  //   };
  //   api.relationCreate(newRelation);
  // }, []);

  useEffect(() => {
    const relationRules = Object.keys(Relation.RelationRules);
    const filteredRules = relationRules.filter((rule) => {
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

    setFilteredRelationRules(filteredRules);
  }, [entity]);

  const { relations } = entity;

  return (
    <>
      {filteredRelationRules.map((relationRule, key) => (
        <div key={key}>{relationRule}</div>
      ))}
    </>
  );
};
