import { EntityEnums, RelationEnums } from "../enums";

export namespace Relation {
  export interface IRelation {
    id: string;
    type: RelationEnums.Type;
    entityIds: string[];
  }

  export interface ISuperclass extends IRelation {
    type: RelationEnums.Type.Superclass;
    entityIds: [string, string];
  }
  export interface ISuperordinateLocation extends IRelation {
    type: RelationEnums.Type.SuperordinateLocation;
    entityIds: [string, string];
  }
  export interface ISynonym extends IRelation {
    type: RelationEnums.Type.Synonym;
    entityIds: string[];
  }
  export interface IAntonym extends IRelation {
    type: RelationEnums.Type.Antonym;
    entityIds: [string, string];
  }
  export interface IPropertyReciprocal extends IRelation {
    type: RelationEnums.Type.PropertyReciprocal;
    entityIds: [string, string];
  }
  export interface ISubjectActantReciprocal extends IRelation {
    type: RelationEnums.Type.SubjectActant1Reciprocal;
    entityIds: [string, string];
  }
  export interface IActionEventEquivalent extends IRelation {
    type: RelationEnums.Type.ActionEventEquivalent;
    entityIds: [string, string];
  }
  export interface IRelated extends IRelation {
    type: RelationEnums.Type.Related;
    entityIds: [string, string];
  }
  export interface IClassification extends IRelation {
    type: RelationEnums.Type.Classification;
    entityIds: [string, string];
  }
  export interface IIdentification extends IRelation {
    type: RelationEnums.Type.Identification;
    certainty: EntityEnums.Certainty;
    entityIds: [string, string];
  }

  export interface IHolonym extends IRelation {
    type: RelationEnums.Type.Holonym;
    entityIds: [string, string];
  }
  export interface IImplication extends IRelation {
    type: RelationEnums.Type.Holonym;
    entityIds: [string, string];
  }
  export interface ISubjectSemantics extends IRelation {
    type: RelationEnums.Type.SubjectSemantics;
    entityIds: [string, string];
  }
  export interface IActant1Semantics extends IRelation {
    type: RelationEnums.Type.Actant1Semantics;
    entityIds: [string, string];
  }
  export interface IActant2Semantics extends IRelation {
    type: RelationEnums.Type.Actant2Semantics;
    entityIds: [string, string];
  }

  /**
   * Relation Rules
   */

  type RelationRule = {
    label: string;
    allowedEntitiesPattern: EntityEnums.Class[][];
    allowedSameEntityClassesOnly: boolean;
    asymmetrical: boolean;
    multiple: boolean;
    cloudType: boolean;
    treeType: boolean;
    attributes: any[];
  };

  export const RelationRules: { [key: string]: RelationRule } = {};

  RelationRules[RelationEnums.Type.Superclass] = {
    label: "Superclass",
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
    label: "Superordinate Location",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Location, EntityEnums.Class.Location],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: true,
    attributes: [],
  };
  RelationRules[RelationEnums.Type.Synonym] = {
    label: "Synonym",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action],
      [EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: false,
    multiple: false,
    cloudType: true,
    treeType: false,
    attributes: [],
  };
  RelationRules[RelationEnums.Type.Antonym] = {
    label: "Antonym",
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
  RelationRules[RelationEnums.Type.Holonym] = {
    label: "Holonym",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Concept, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: true,
    attributes: [],
  };
  RelationRules[RelationEnums.Type.PropertyReciprocal] = {
    label: "Property Reciprocal",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Concept, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: false,
    multiple: false,
    cloudType: false,
    treeType: false,
    attributes: [],
  };
  RelationRules[RelationEnums.Type.SubjectActant1Reciprocal] = {
    label: "Subject/Actant1 Reciprocal",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Action],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: false,
    multiple: false,
    cloudType: false,
    treeType: false,
    attributes: [],
  };
  RelationRules[RelationEnums.Type.ActionEventEquivalent] = {
    label: "Action/Event Equivalent",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: false,
    asymmetrical: false,
    multiple: false,
    cloudType: false,
    treeType: false,
    attributes: [],
  };
  RelationRules[RelationEnums.Type.Classification] = {
    label: "Classification",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Person, EntityEnums.Class.Concept],
      [EntityEnums.Class.Being, EntityEnums.Class.Concept],
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
    label: "Identification",
    allowedEntitiesPattern: [], // any combination is allowed
    allowedSameEntityClassesOnly: false,
    asymmetrical: false,
    multiple: true,
    cloudType: false,
    treeType: false,
    attributes: [EntityEnums.Certainty],
  };
  RelationRules[RelationEnums.Type.Implication] = {
    label: "Implication",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Action],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: true,
    attributes: [],
  };
  RelationRules[RelationEnums.Type.SubjectSemantics] = {
    label: "Subject Semantics",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: false,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: false,
    attributes: [],
  };
  RelationRules[RelationEnums.Type.Actant1Semantics] = {
    label: "Actant1 Semantics",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: false,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: false,
    attributes: [],
  };
  RelationRules[RelationEnums.Type.Actant2Semantics] = {
    label: "Actant2 Semantics",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: false,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: false,
    attributes: [],
  };
  RelationRules[RelationEnums.Type.Related] = {
    label: "Related",
    allowedEntitiesPattern: [], // any combination is allowed
    allowedSameEntityClassesOnly: false,
    asymmetrical: false,
    multiple: true,
    cloudType: false,
    treeType: false,
    attributes: [],
  };
}
