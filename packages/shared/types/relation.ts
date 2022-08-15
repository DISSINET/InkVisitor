import { Certainty, EntityClass, Logic, RelationType } from "../enums";

export interface IRelation {
  id: string;
  type: RelationType;
  entityIds: string[];
}

export interface IRelationSuperClass extends IRelation {
  type: RelationType.Superclass;
  entityIds: [string, string];
}
export interface IRelationSuperordinateLocation extends IRelation {
  type: RelationType.SuperordinateLocation;
  entityIds: [string, string];
}
export interface IRelationSynonym extends IRelation {
  type: RelationType.Synonym;
  entityIds: string[];
}
export interface IRelationAntonym extends IRelation {
  type: RelationType.Antonym;
  entityIds: [string, string];
}
export interface IRelationTroponym extends IRelation {
  type: RelationType.Troponym;
  entityIds: string[];
}
export interface IRelationPropertyReciprocal extends IRelation {
  type: RelationType.PropertyReciprocal;
  entityIds: [string, string];
}
export interface IRelationSubjectActantReciprocal extends IRelation {
  type: RelationType.SubjectActantReciprocal;
  entityIds: [string, string];
}
export interface IRelationActionEventEquivalent extends IRelation {
  type: RelationType.ActionEventEquivalent;
  entityIds: [string, string];
}
export interface IRelationRelated extends IRelation {
  type: RelationType.Related;
  entityIds: [string, string];
}
export interface IRelationClassification extends IRelation {
  type: RelationType.Classification;
  entityIds: [string, string];
}
export interface IRelationIdentification extends IRelation {
  type: RelationType.Identification;
  logic: Logic;
  certainty: Certainty;
  entityIds: [string, string];
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
  allowedSameEntityClassesOnly: false,
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
  allowedSameEntityClassesOnly: false,
  asymmetrical: false,
  multiple: false,
  cloudType: false,
  treeType: false,
  attributes: [],
};
RelationRules[RelationType.Related] = {
  allowedEntitiesPattern: [], // any combination is allowed
  allowedSameEntityClassesOnly: false,
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
  allowedSameEntityClassesOnly: false,
  asymmetrical: true,
  multiple: true,
  cloudType: false,
  treeType: true,
  attributes: [],
};

RelationRules[RelationType.Identification] = {
  allowedEntitiesPattern: [], // any combination is allowed
  allowedSameEntityClassesOnly: false,
  asymmetrical: false,
  multiple: true,
  cloudType: true,
  treeType: false,
  attributes: [Logic, Certainty],
};
