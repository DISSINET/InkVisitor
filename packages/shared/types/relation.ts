import {
  EntityClass,
  Logic,
  Mood,
  MoodVariant,
  Operator,
  RelationType,
} from "../enums";

export interface IRelation {
  id: string;
  type: RelationType;
  entities: [string, string];
}

export interface IRelationSuperClassRelation extends IRelation {
  type: RelationType.Superclass;
}
export interface IRelationSynonym extends IRelation {
  type: RelationType.Synonym;
}
export interface IRelationAntonym extends IRelation {
  type: RelationType.Antonym;
}
export interface IRelationTroponym extends IRelation {
  type: RelationType.Troponym;
}
export interface IRelationPropertyReciprocal extends IRelation {
  type: RelationType.PropertyReciprocal;
}
export interface IRelationSubjectActantReciprocal extends IRelation {
  type: RelationType.SubjectActantReciprocal;
}
export interface IRelationActionEventEquivalent extends IRelation {
  type: RelationType.ActionEventEquivalent;
}
export interface IRelationRelated extends IRelation {
  type: RelationType.Related;
}
export interface IRelationClass extends IRelation {
  type: RelationType.Class;
  statement?: string;
}
export interface IRelationIdentity extends IRelation {
  type: RelationType.Identity;
  statement?: string;
  logic: Logic;
  mood: Mood[];
  moodvariant: MoodVariant;
  bundleOperator: Operator;
  bundleStart: boolean;
  bundleEnd: boolean;
}

/**
 * Relation Rules
 */

const RelationRules = {};

RelationRules[RelationType.Superclass] = {
  allowedEntities: [
    [EntityClass.Action, EntityClass.Concept],
    [EntityClass.Action, EntityClass.Concept],
  ],
  sameClass: true,
  symmetrical: false,
};
RelationRules[RelationType.Synonym] = {
  allowedEntities: [
    [EntityClass.Action, EntityClass.Concept],
    [EntityClass.Action, EntityClass.Concept],
  ],
  sameClass: true,
  symmetrical: true,
};
RelationRules[RelationType.Antonym] = {
  allowedEntities: [
    [EntityClass.Action, EntityClass.Concept],
    [EntityClass.Action, EntityClass.Concept],
  ],
  sameClass: true,
  symmetrical: true,
};
RelationRules[RelationType.Troponym] = {
  allowedEntities: [[EntityClass.Action], [EntityClass.Action]],
  sameClass: true,
  symmetrical: true,
};
RelationRules[RelationType.PropertyReciprocal] = {
  allowedEntities: [[EntityClass.Concept], [EntityClass.Concept]],
  sameClass: true,
  symmetrical: true,
};
RelationRules[RelationType.SubjectActantReciprocal] = {
  allowedEntities: [[EntityClass.Action], [EntityClass.Action]],
  sameClass: true,
  symmetrical: true,
};
RelationRules[RelationType.ActionEventEquivalent] = {
  allowedEntities: [
    [EntityClass.Action, EntityClass.Concept],
    [EntityClass.Action, EntityClass.Concept],
  ],
  sameClass: true,
  symmetrical: true,
};
RelationRules[RelationType.Related] = {
  sameClass: false,
  symmetrical: true,
};
RelationRules[RelationType.Class] = {
  allowedEntities: [
    [
      EntityClass.Person,
      EntityClass.Location,
      EntityClass.Object,
      EntityClass.Group,
      EntityClass.Event,
      EntityClass.Statement,
      EntityClass.Territory,
      EntityClass.Resource,
    ],
    [EntityClass.Concept],
  ],
  sameClass: true,
  symmetrical: true,
};
RelationRules[RelationType.Identity] = {
  allowedEntities: [
    [
      EntityClass.Person,
      EntityClass.Location,
      EntityClass.Object,
      EntityClass.Group,
      EntityClass.Event,
      EntityClass.Statement,
      EntityClass.Territory,
      EntityClass.Resource,
    ],
    [
      [
        EntityClass.Person,
        EntityClass.Location,
        EntityClass.Object,
        EntityClass.Group,
        EntityClass.Event,
        EntityClass.Statement,
        EntityClass.Territory,
        EntityClass.Resource,
      ],
    ],
  ],
  sameClass: true,
  symmetrical: false,
};
