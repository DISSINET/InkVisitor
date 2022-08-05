import {
  Certainty,
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
  entities: [];
}

export interface IRelationSuperClassification extends IRelation {
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
export interface IRelationClassification extends IRelation {
  type: RelationType.Classification;
}
export interface IRelationIdentityfication extends IRelation {
  type: RelationType.Identityfication;
  logic: Logic;
  certainty: Certainty;
}

/**
 * Relation Rules
 */

type RelationRule = {
  allowedEntitiesPattern: EntityClass[][];
  allowedSameEntityClassesOnly: boolean;
  asymmetrical: boolean;
  multiple: boolean;
  cloudType: boolean;
  treeType: boolean;
  attributes: any[];
};

const RelationRules: { [key: string]: RelationRule } = {};

RelationRules[RelationType.Superclass] = {
  allowedEntitiesPattern: [
    [EntityClass.Action, EntityClass.Action],
    [EntityClass.Concept, EntityClass.Concept],
  ],
  allowedSameEntityClassesOnly: true,
  asymmetrical: true,
  multiple: true,
  cloudType: false,
  treeType: true,
  attributes: [],
};
RelationRules[RelationType.SuperordinateLocation] = {
  allowedEntitiesPattern: [[EntityClass.Location, EntityClass.Location]],
  allowedSameEntityClassesOnly: true,
  asymmetrical: true,
  multiple: true,
  cloudType: false,
  treeType: true,
  attributes: [],
};
RelationRules[RelationType.Synonym] = {
  allowedEntitiesPattern: [[EntityClass.Action], [EntityClass.Concept]],
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: true,
  cloudType: true,
  treeType: false,
  attributes: [],
};
RelationRules[RelationType.Antonym] = {
  allowedEntitiesPattern: [
    [EntityClass.Action, EntityClass.Action],
    [EntityClass.Concept, EntityClass.Concept],
  ],
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: true,
  cloudType: false,
  treeType: false,
  attributes: [],
};
RelationRules[RelationType.Troponym] = {
  allowedEntitiesPattern: [[EntityClass.Action]],
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: true,
  cloudType: true,
  treeType: false,
  attributes: [],
};
RelationRules[RelationType.PropertyReciprocal] = {
  allowedEntitiesPattern: [[EntityClass.Concept, EntityClass.Concept]],
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: false,
  cloudType: false,
  treeType: false,
  attributes: [],
};
RelationRules[RelationType.SubjectActantReciprocal] = {
  allowedEntitiesPattern: [[EntityClass.Action, EntityClass.Action]],
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: false,
  cloudType: false,
  treeType: false,
  attributes: [],
};
RelationRules[RelationType.ActionEventEquivalent] = {
  allowedEntitiesPattern: [
    [EntityClass.Action, EntityClass.Concept],
    [EntityClass.Concept, EntityClass.Action],
  ],
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: false,
  cloudType: false,
  treeType: false,
  attributes: [],
};
RelationRules[RelationType.Related] = {
  allowedEntitiesPattern: [], // any combination is allowed
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: true,
  cloudType: false,
  treeType: false,
  attributes: [],
};
RelationRules[RelationType.Classification] = {
  allowedEntitiesPattern: [
    [EntityClass.Person, EntityClass.Concept],
    [EntityClass.Location, EntityClass.Concept],
    [EntityClass.Object, EntityClass.Concept],
    [EntityClass.Group, EntityClass.Concept],
    [EntityClass.Event, EntityClass.Concept],
    [EntityClass.Statement, EntityClass.Concept],
    [EntityClass.Territory, EntityClass.Concept],
    [EntityClass.Resource, EntityClass.Concept],
  ],
  allowedSameEntityClassesOnly: true,
  asymmetrical: true,
  multiple: true,
  cloudType: false,
  treeType: true,
  attributes: [],
};

RelationRules[RelationType.Identityfication] = {
  allowedEntitiesPattern: [], // any combination is allowed
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: true,
  cloudType: true,
  treeType: false,
  attributes: [Logic, Certainty],
};
