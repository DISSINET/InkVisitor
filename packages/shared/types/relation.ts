import { EntityEnums, RelationEnums } from "../enums";

export interface IRelation {
  id: string;
  type: RelationEnums.Type;
  entityIds: string[];
}

export interface IRelationSuperclass extends IRelation {
  type: RelationEnums.Type.Superclass;
  entityIds: [string, string];
}
export interface IRelationSuperordinateLocation extends IRelation {
  type: RelationEnums.Type.SuperordinateLocation;
  entityIds: [string, string];
}
export interface IRelationSynonym extends IRelation {
  type: RelationEnums.Type.Synonym;
  entityIds: string[];
}
export interface IRelationAntonym extends IRelation {
  type: RelationEnums.Type.Antonym;
  entityIds: [string, string];
}
export interface IRelationTroponym extends IRelation {
  type: RelationEnums.Type.Troponym;
  entityIds: string[];
}
export interface IRelationPropertyReciprocal extends IRelation {
  type: RelationEnums.Type.PropertyReciprocal;
  entityIds: [string, string];
}
export interface IRelationSubjectActantReciprocal extends IRelation {
  type: RelationEnums.Type.SubjectActantReciprocal;
  entityIds: [string, string];
}
export interface IRelationActionEventEquivalent extends IRelation {
  type: RelationEnums.Type.ActionEventEquivalent;
  entityIds: [string, string];
}
export interface IRelationRelated extends IRelation {
  type: RelationEnums.Type.Related;
  entityIds: [string, string];
}
export interface IRelationClassification extends IRelation {
  type: RelationEnums.Type.Classification;
  entityIds: [string, string];
}
export interface IRelationIdentification extends IRelation {
  type: RelationEnums.Type.Identification;
  certainty: EntityEnums.Certainty;
  entityIds: [string, string];
}

export interface IRelationHolonymy extends IRelation {
  type: RelationEnums.Type.Holonymy;
  entityIds: [string, string];
}
export interface IRelationImplication extends IRelation {
  type: RelationEnums.Type.Holonymy;
  entityIds: [string, string];
}

/**
 * Relation Rules
 */

type RelationRule = {
  allowedEntitiesPattern: EntityEnums.Class[][];
  allowedSameEntityClassesOnly: boolean;
  asymmetrical: boolean;
  multiple: boolean;
  cloudType: boolean;
  treeType: boolean;
  attributes: any[];
};

const RelationRules: { [key: string]: RelationRule } = {};

RelationRules[RelationEnums.Type.Superclass] = {
  allowedEntitiesPattern: [
    [EntityEnums.Class.Action, EntityEnums.Class.Action],
    [EntityEnums.Class.Concept, EntityEnums.Class.Concept],
  ],
  allowedSameEntityClassesOnly: true,
  asymmetrical: true,
  multiple: true,
  cloudType: false,
  treeType: true,
  attributes: [],
};
RelationRules[RelationEnums.Type.SuperordinateLocation] = {
  allowedEntitiesPattern: [[EntityEnums.Class.Location, EntityEnums.Class.Location]],
  allowedSameEntityClassesOnly: true,
  asymmetrical: true,
  multiple: true,
  cloudType: false,
  treeType: true,
  attributes: [],
};
RelationRules[RelationEnums.Type.Synonym] = {
  allowedEntitiesPattern: [[EntityEnums.Class.Action], [EntityEnums.Class.Concept]],
  allowedSameEntityClassesOnly: false,
  asymmetrical: false,
  multiple: true,
  cloudType: true,
  treeType: false,
  attributes: [],
};
RelationRules[RelationEnums.Type.Antonym] = {
  allowedEntitiesPattern: [
    [EntityEnums.Class.Action, EntityEnums.Class.Action],
    [EntityEnums.Class.Concept, EntityEnums.Class.Concept],
  ],
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: true,
  cloudType: false,
  treeType: false,
  attributes: [],
};
RelationRules[RelationEnums.Type.Troponym] = {
  allowedEntitiesPattern: [[EntityEnums.Class.Action]],
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: true,
  cloudType: true,
  treeType: false,
  attributes: [],
};
RelationRules[RelationEnums.Type.PropertyReciprocal] = {
  allowedEntitiesPattern: [[EntityEnums.Class.Concept, EntityEnums.Class.Concept]],
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: false,
  cloudType: false,
  treeType: false,
  attributes: [],
};
RelationRules[RelationEnums.Type.SubjectActantReciprocal] = {
  allowedEntitiesPattern: [[EntityEnums.Class.Action, EntityEnums.Class.Action]],
  allowedSameEntityClassesOnly: true,
  asymmetrical: false,
  multiple: false,
  cloudType: false,
  treeType: false,
  attributes: [],
};
RelationRules[RelationEnums.Type.ActionEventEquivalent] = {
  allowedEntitiesPattern: [
    [EntityEnums.Class.Action, EntityEnums.Class.Concept],
    [EntityEnums.Class.Concept, EntityEnums.Class.Action],
  ],
  allowedSameEntityClassesOnly: false,
  asymmetrical: false,
  multiple: false,
  cloudType: false,
  treeType: false,
  attributes: [],
};
RelationRules[RelationEnums.Type.Related] = {
  allowedEntitiesPattern: [], // any combination is allowed
  allowedSameEntityClassesOnly: false,
  asymmetrical: false,
  multiple: true,
  cloudType: false,
  treeType: false,
  attributes: [],
};
RelationRules[RelationEnums.Type.Classification] = {
  allowedEntitiesPattern: [
    [EntityEnums.Class.Person, EntityEnums.Class.Concept],
    [EntityEnums.Class.Location, EntityEnums.Class.Concept],
    [EntityEnums.Class.Object, EntityEnums.Class.Concept],
    [EntityEnums.Class.Group, EntityEnums.Class.Concept],
    [EntityEnums.Class.Event, EntityEnums.Class.Concept],
    [EntityEnums.Class.Statement, EntityEnums.Class.Concept],
    [EntityEnums.Class.Territory, EntityEnums.Class.Concept],
    [EntityEnums.Class.Resource, EntityEnums.Class.Concept],
  ],
  allowedSameEntityClassesOnly: false,
  asymmetrical: true,
  multiple: true,
  cloudType: false,
  treeType: true,
  attributes: [],
};

RelationRules[RelationEnums.Type.Identification] = {
  allowedEntitiesPattern: [], // any combination is allowed
  allowedSameEntityClassesOnly: false,
  asymmetrical: false,
  multiple: true,
  cloudType: true,
  treeType: false,
  attributes: [EntityEnums.Certainty],
};

RelationRules[RelationEnums.Type.Holonymy] = {
  allowedEntitiesPattern: [[EntityEnums.Class.Concept, EntityEnums.Class.Concept]],
  allowedSameEntityClassesOnly: true,
  asymmetrical: true,
  multiple: true,
  cloudType: false,
  treeType: true,
  attributes: [],
};

RelationRules[RelationEnums.Type.Implication] = {
  allowedEntitiesPattern: [[EntityEnums.Class.Action, EntityEnums.Class.Action]],
  allowedSameEntityClassesOnly: true,
  asymmetrical: true,
  multiple: true,
  cloudType: false,
  treeType: true,
  attributes: [],
};
