import { EntityEnums, RelationEnums } from "../enums";

export namespace Relation {
  export interface IRelation {
    id: string;
    type: RelationEnums.Type;
    entityIds: string[];
    order?: number;
  }

  export interface ISuperclass extends IRelation {
    type: RelationEnums.Type.Superclass;
    entityIds: [string, string];
    order: number;
  }
  export interface ISuperordinateLocation extends IRelation {
    type: RelationEnums.Type.SuperordinateLocation;
    entityIds: [string, string];
    order: number;
  }
  export interface ISynonym extends IRelation {
    type: RelationEnums.Type.Synonym;
    entityIds: string[];
  }
  export interface IAntonym extends IRelation {
    type: RelationEnums.Type.Antonym;
    entityIds: [string, string];
    order: number;
  }
  export interface IPropertyReciprocal extends IRelation {
    type: RelationEnums.Type.PropertyReciprocal;
    entityIds: [string, string];
  }
  export interface ISubjectActant1Reciprocal extends IRelation {
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
    order: number;
  }
  export interface IClassification extends IRelation {
    type: RelationEnums.Type.Classification;
    entityIds: [string, string];
    order: number;
  }
  export interface IIdentification extends IRelation {
    type: RelationEnums.Type.Identification;
    certainty: EntityEnums.Certainty;
    entityIds: [string, string];
  }
  export interface IHolonym extends IRelation {
    type: RelationEnums.Type.Holonym;
    entityIds: [string, string];
    order: number;
  }
  export interface IImplication extends IRelation {
    type: RelationEnums.Type.Implication;
    entityIds: [string, string];
    order: number;
  }
  export interface ISubjectSemantics extends IRelation {
    type: RelationEnums.Type.SubjectSemantics;
    entityIds: [string, string];
    order: number;
  }
  export interface IActant1Semantics extends IRelation {
    type: RelationEnums.Type.Actant1Semantics;
    entityIds: [string, string];
    order: number;
  }
  export interface IActant2Semantics extends IRelation {
    type: RelationEnums.Type.Actant2Semantics;
    entityIds: [string, string];
    order: number;
  }

  export interface IDetailType<T extends IRelation, T2 extends IRelation = T> {
    connections: IConnection<T, T2>[];
    iConnections?: T[];
  }

  export type IConnection<T extends IRelation, T2 extends IRelation = T> = T & {
    subtrees?: IConnection<T2, T2>[];
  };

  export interface IUsedRelations {
    [RelationEnums.Type.Superclass]?: IDetailType<ISuperclass>;
    [RelationEnums.Type
      .SuperordinateLocation]?: IDetailType<ISuperordinateLocation>;
    [RelationEnums.Type.Synonym]?: IDetailType<ISynonym>;
    [RelationEnums.Type.Antonym]?: IDetailType<IAntonym>;
    [RelationEnums.Type.Holonym]?: IDetailType<IHolonym>;
    [RelationEnums.Type.PropertyReciprocal]?: IDetailType<IPropertyReciprocal>;
    [RelationEnums.Type
      .SubjectActant1Reciprocal]?: IDetailType<ISubjectActant1Reciprocal>;
    [RelationEnums.Type.ActionEventEquivalent]?: IDetailType<
      IActionEventEquivalent,
      ISuperclass
    >;
    [RelationEnums.Type.Classification]?: IDetailType<
      IClassification,
      ISuperclass
    >;
    [RelationEnums.Type.Identification]?: IDetailType<IIdentification>;
    [RelationEnums.Type.Implication]?: IDetailType<IImplication>;
    [RelationEnums.Type.SubjectSemantics]?: IDetailType<ISubjectSemantics>;
    [RelationEnums.Type.Actant1Semantics]?: IDetailType<IActant1Semantics>;
    [RelationEnums.Type.Actant2Semantics]?: IDetailType<IActant2Semantics>;
    [RelationEnums.Type.Related]?: IDetailType<IRelated>;
  }

  /**
   * Relation Rules
   */

  export type RelationRule = {
    label: string;
    inverseLabel: false | string;
    allowedEntitiesPattern: EntityEnums.Class[][];
    allowedSameEntityClassesOnly: boolean;
    asymmetrical: boolean;
    multiple: boolean;
    cloudType: boolean;
    treeType: boolean;
    attributes: any[];
    order: boolean;
  };

  export const RelationRules: { [key in RelationEnums.Type]?: RelationRule } =
    {};

  // Order of objects equals order of relations in detail
  RelationRules[RelationEnums.Type.Superclass] = {
    label: "Superclass",
    inverseLabel: "Subclasses",
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
    order: true,
  };
  RelationRules[RelationEnums.Type.SuperordinateLocation] = {
    label: "Superordinate Location",
    inverseLabel: "Subordinate Locations",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Location, EntityEnums.Class.Location],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: true,
    attributes: [],
    order: true,
  };
  RelationRules[RelationEnums.Type.Synonym] = {
    label: "Synonym",
    inverseLabel: false,
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
    order: false,
  };
  RelationRules[RelationEnums.Type.Antonym] = {
    label: "Antonym",
    inverseLabel: false,
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
    order: true,
  };
  RelationRules[RelationEnums.Type.Holonym] = {
    label: "Holonym",
    inverseLabel: "Meronyms",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Concept, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: true,
    attributes: [],
    order: true,
  };
  RelationRules[RelationEnums.Type.PropertyReciprocal] = {
    label: "Property Reciprocal",
    inverseLabel: false,
    allowedEntitiesPattern: [
      [EntityEnums.Class.Concept, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: false,
    multiple: false,
    cloudType: false,
    treeType: false,
    attributes: [],
    order: false,
  };
  RelationRules[RelationEnums.Type.SubjectActant1Reciprocal] = {
    label: "Subject/Actant1 Reciprocal",
    inverseLabel: false,
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Action],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: false,
    multiple: false,
    cloudType: false,
    treeType: false,
    attributes: [],
    order: false,
  };
  RelationRules[RelationEnums.Type.ActionEventEquivalent] = {
    label: "Action/Event Equivalent",
    inverseLabel: false,
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: false,
    asymmetrical: false,
    multiple: false,
    cloudType: false,
    treeType: true,
    attributes: [],
    order: false,
  };
  RelationRules[RelationEnums.Type.Classification] = {
    label: "Classification",
    inverseLabel: "Instances",
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
    order: true,
  };
  RelationRules[RelationEnums.Type.Identification] = {
    label: "Identification",
    inverseLabel: false,
    allowedEntitiesPattern: [
      [EntityEnums.Class.Person, EntityEnums.Class.Person],
      [EntityEnums.Class.Location, EntityEnums.Class.Location],
      [EntityEnums.Class.Object, EntityEnums.Class.Object],
      [EntityEnums.Class.Group, EntityEnums.Class.Group],
      [EntityEnums.Class.Event, EntityEnums.Class.Event],
      [EntityEnums.Class.Statement, EntityEnums.Class.Statement],
      [EntityEnums.Class.Territory, EntityEnums.Class.Territory],
      [EntityEnums.Class.Resource, EntityEnums.Class.Resource],
      [EntityEnums.Class.Being, EntityEnums.Class.Being],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: false,
    multiple: true,
    cloudType: false,
    treeType: false,
    attributes: [EntityEnums.Certainty],
    order: false,
  };
  RelationRules[RelationEnums.Type.Implication] = {
    label: "Implication",
    inverseLabel: "Used as Implication",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Action],
    ],
    allowedSameEntityClassesOnly: true,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: true,
    attributes: [],
    order: true,
  };
  RelationRules[RelationEnums.Type.SubjectSemantics] = {
    label: "Subject Semantics",
    inverseLabel: "Used as Subject semantics",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: false,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: false,
    attributes: [],
    order: true,
  };
  RelationRules[RelationEnums.Type.Actant1Semantics] = {
    label: "Actant1 Semantics",
    inverseLabel: "Used as Actant1 semantics",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: false,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: false,
    attributes: [],
    order: true,
  };
  RelationRules[RelationEnums.Type.Actant2Semantics] = {
    label: "Actant2 Semantics",
    inverseLabel: "Used as Actant2 semantics",
    allowedEntitiesPattern: [
      [EntityEnums.Class.Action, EntityEnums.Class.Concept],
    ],
    allowedSameEntityClassesOnly: false,
    asymmetrical: true,
    multiple: true,
    cloudType: false,
    treeType: false,
    attributes: [],
    order: true,
  };
  RelationRules[RelationEnums.Type.Related] = {
    label: "Related",
    inverseLabel: false,
    allowedEntitiesPattern: [], // any combination is allowed
    allowedSameEntityClassesOnly: false,
    asymmetrical: false,
    multiple: true,
    cloudType: false,
    treeType: false,
    attributes: [],
    order: true,
  };
}
