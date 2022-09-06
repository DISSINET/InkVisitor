import { EntityEnums, RelationEnums } from "@shared/enums";
import React from "react";

const attributeTypes = {
  [RelationEnums.Type.Superclass]: {
    entityClasses: [EntityEnums.Class.Concept, EntityEnums.Class.Action],
    multi: true,
  },
  [RelationEnums.Type.Synonym]: {
    entityClasses: [EntityEnums.Class.Concept, EntityEnums.Class.Action],
    multi: false,
  },
  [RelationEnums.Type.Antonym]: {
    entityClasses: [EntityEnums.Class.Concept, EntityEnums.Class.Action],
    multi: true,
  },
  [RelationEnums.Type.PropertyReciprocal]: {
    entityClasses: [EntityEnums.Class.Concept],
    multi: false,
  },
  [RelationEnums.Type.ActionEventEquivalent]: {
    entityClasses: [EntityEnums.Class.Concept, EntityEnums.Class.Action],
    multi: false,
  },
  [RelationEnums.Type.Related]: {
    entityClasses: [
      EntityEnums.Class.Concept,
      EntityEnums.Class.Action,
      EntityEnums.Class.Location,
      EntityEnums.Class.Person,
      EntityEnums.Class.Object,
      EntityEnums.Class.Group,
      EntityEnums.Class.Event,
      EntityEnums.Class.Statement,
      EntityEnums.Class.Territory,
      EntityEnums.Class.Resource,
    ],
    multi: true,
  },
  [RelationEnums.Type.Holonymy]: {
    entityClasses: [EntityEnums.Class.Concept],
    multi: true,
  },
  [RelationEnums.Type.Troponym]: {
    entityClasses: [EntityEnums.Class.Action],
    multi: false,
  },
  [RelationEnums.Type.SubjectActantReciprocal]: {
    entityClasses: [EntityEnums.Class.Action],
    multi: false,
  },
  [RelationEnums.Type.Implication]: {
    entityClasses: [EntityEnums.Class.Action],
    multi: true,
  },
  [RelationEnums.Type.SuperordinateLocation]: {
    entityClasses: [EntityEnums.Class.Location],
    multi: true,
  },
  [RelationEnums.Type.Classification]: {
    entityClasses: [
      EntityEnums.Class.Location,
      EntityEnums.Class.Person,
      EntityEnums.Class.Object,
      EntityEnums.Class.Group,
      EntityEnums.Class.Event,
      EntityEnums.Class.Statement,
      EntityEnums.Class.Territory,
      EntityEnums.Class.Resource,
    ],
    multi: true,
  },
  [RelationEnums.Type.Identification]: {
    entityClasses: [
      EntityEnums.Class.Location,
      EntityEnums.Class.Person,
      EntityEnums.Class.Object,
      EntityEnums.Class.Group,
      EntityEnums.Class.Event,
      EntityEnums.Class.Statement,
      EntityEnums.Class.Territory,
      EntityEnums.Class.Resource,
    ],
    multi: true,
  },
};

interface EntityDetailRelationsSection {}
export const EntityDetailRelationsSection: React.FC<
  EntityDetailRelationsSection
> = ({}) => {
  return <>Ahoj</>;
};
