import { EntityEnums, RelationEnums } from "../enums";
import { IRequestSearchRootValidity } from "./request-search";
import { IStatsAggregationParams } from "./stats";

export namespace Query {
  export interface INode {
    id: string;
    type: NodeType;
    params: INodeParams;
    operator: NodeOperator;
    edges: IEdge[];
  }

  export interface IEdge {
    id: string;
    type: EdgeType;
    params: IEdgeParams;
    logic: EdgeLogic;
    node: INode;
  }

  export interface INodeParams {
    entityClasses?: EntityEnums.Class[];
    label?: string;
    entityId?: string;
  }
  export interface IEdgeParams { }

  export enum NodeType {
    E = "Entity",
  }
  export enum EdgeType {
    "HP:V" = "HP:V",
    "I_HP:V" = "I_HP:V",
    "EP:T" = "EP:T",
    "IS:" = "IS:",
    "I_IS:" = "I_IS:",
    "IS:A" = "IS:A",
    "I_IS:A" = "I_IS:A",
    "IS:S" = "IS:S",
    "I_IS:S" = "I_IS:S",
    "IS:A1" = "IS:A1",
    "I_IS:A1" = "I_IS:A1",
    "IS:A2" = "IS:A2",
    "I_IS:A2" = "I_IS:A2",
    "IS:PS" = "IS:PS",
    "I_IS:PS" = "I_IS:PS",
    "SUT:" = "SUT:",
    "I_SUT:" = "I_SUT:",
    "EUT:" = "EUT:",
    "EUT:C" = "EUT:C",
    "SUT:D" = "SUT:D",
    "I_SUT:D" = "I_SUT:D",
    "SUT:C" = "SUT:C",
    "I_SUT:C" = "I_SUT:C",
    "HR:R" = "HR:R",
    "I_HR:R" = "I_HR:R",
    "HR:V" = "HR:V",
    "CT:" = "CT:",
    "I_CT:" = "I_CT:",
    "CT:D" = "CT:D",
    "I_CT:D" = "I_CT:D",
    "CT:G" = "CT:G",
    "I_CT:G" = "I_CT:G",
    "SP:T" = "SP:T",
    "I_SP:T" = "I_SP:T",
    "SP:V" = "SP:V",
    "I_SP:V" = "I_SP:V",
    "SI" = "SI",
    "I_SI" = "I_SI",
    "SC" = "SC",
    "I_SC" = "I_SC",
    "R:" = "R:",
    "R:SCL" = "R:SCL",
    "I_R:SCL" = "I_R:SCL",
    "R:SYN" = "R:SYN",
    "R:ANT" = "R:ANT",
    "I_R:ANT" = "I_R:ANT",
    "R:HOL" = "R:HOL",
    "I_R:HOL" = "I_R:HOL",
    "R:PRR" = "R:PRR",
    "I_R:PRR" = "I_R:PRR",
    "R:SAR" = "R:SAR",
    "I_R:SAR" = "I_R:SAR",
    "R:AEE" = "R:AEE",
    "I_R:AEE" = "I_R:AEE",
    "R:CLA" = "R:CLA",
    "I_R:CLA" = "I_R:CLA",
    "R:IDE" = "R:IDE",
    "I_R:IDE" = "I_R:IDE",
    "R:IMP" = "R:IMP",
    "I_R:IMP" = "I_R:IMP",
    "R:SOE" = "R:SOE",
    "I_R:SOE" = "I_R:SOE",
    "R:SUS" = "R:SUS",
    "I_R:SUS" = "I_R:SUS",
    "R:A1S" = "R:A1S",
    "I_R:A1S" = "I_R:A1S",
    "R:A2S" = "R:A2S",
    "I_R:A2S" = "I_R:A2S",
    "R:REL" = "R:REL",
    "I_R:REL" = "I_R:REL",
  }

  export enum NodeOperator {
    And = "and",
    Or = "or",
  }
  export enum EdgeLogic {
    Positive = "positive",
    Negative = "negative",
  }
  // emtpy entityClass means it could be any class
  export type EdgeRule = {
    nodeType: NodeType;
    params: { entityClass?: EntityEnums.Class[] };
  };

  export const EdgeTypeTargetNodeParams: Record<EdgeType, Record<string, any>> = {
    "HP:V": {
      entityId: { allowedClasses: [] },
    },
    "I_HP:V": {},
    "EP:T": {
      entityId: { allowedClasses: [EntityEnums.Class.Concept] },
    },

    "IS:": {
      entityId: { allowedClasses: [EntityEnums.Class.Statement] },
    },
    "I_IS:": {
      entityId: { allowedClasses: [] },
    },
    "IS:A": {},
    "I_IS:A": {},
    "IS:S": {},
    "I_IS:S": {
      entityClass: { allowedClasses: [] },
      entityId: { allowedClasses: [] },
    },
    "IS:A1": {},
    "I_IS:A1": {
      entityClass: { allowedClasses: [] },
      entityId: { allowedClasses: [] },
    },
    "IS:A2": {},
    "I_IS:A2": {
      entityClass: { allowedClasses: [] },
      entityId: { allowedClasses: [] },
    },
    "IS:PS": {},
    "I_IS:PS": {},
    "SUT:": {
      entityId: { allowedClasses: [EntityEnums.Class.Territory] },
    },
    "I_SUT:": {},
    "EUT:": {
      entityId: { allowedClasses: [EntityEnums.Class.Territory] },
    },
    "EUT:C": {
      entityId: { allowedClasses: [EntityEnums.Class.Territory] },
    },
    "SUT:D": {},
    "I_SUT:D": {},
    "SUT:C": {
      entityId: { allowedClasses: [EntityEnums.Class.Territory] },
    },
    "I_SUT:C": {},
    "HR:R": {
      entityId: { allowedClasses: [EntityEnums.Class.Resource] },
    },
    "I_HR:R": {},
    "HR:V": {
      entityId: { allowedClasses: [EntityEnums.Class.Value] },
    },
    "CT:": {},
    "I_CT:": {},
    "CT:D": {},
    "I_CT:D": {},
    "CT:G": {},
    "I_CT:G": {},
    "SP:T": {
      entityId: { allowedClasses: [EntityEnums.Class.Concept] },
    },
    "I_SP:T": {
      entityId: { allowedClasses: [EntityEnums.Class.Concept] },
    },
    "SP:V": {
      entityId: { allowedClasses: [] },
    },
    "I_SP:V": {
      entityId: { allowedClasses: [] },
    },
    SI: {},
    I_SI: {},
    SC: {},
    I_SC: {
      entityId: { allowedClasses: [EntityEnums.Class.Concept] },
    },
    "R:": {
      entityId: { allowedClasses: [] },
    },
    "R:SCL": {
      // entityClass: with an empty suggester, the category picked there narrows
      // the superclass to entities of that class (server: EdgeCHasSuperclass)
      entityClass: {
        allowedClasses: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
      },
      entityId: {
        allowedClasses: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
      },
    },
    "I_R:SCL": {},
    "R:SYN": {},
    "R:ANT": {},
    "I_R:ANT": {},
    "R:HOL": {},
    "I_R:HOL": {},
    "R:PRR": {},
    "I_R:PRR": {},
    "R:SAR": {},
    "I_R:SAR": {},
    "R:AEE": {},
    "I_R:AEE": {},
    "R:CLA": {
      entityId: { allowedClasses: [EntityEnums.Class.Concept] },
    },
    "I_R:CLA": {},
    "R:IDE": {},
    "I_R:IDE": {},
    "R:IMP": {},
    "I_R:IMP": {},
    "R:SOE": {
      // entityClass: with an empty suggester, the category picked there narrows
      // the superordinate to entities of that class (server: EdgeHasSuperordinate)
      entityClass: {
        allowedClasses: [
          EntityEnums.Class.Location,
          EntityEnums.Class.Object,
          EntityEnums.Class.Event,
          EntityEnums.Class.Group,
          EntityEnums.Class.Statement,
          EntityEnums.Class.Value,
          EntityEnums.Class.Resource,
          EntityEnums.Class.Person,
          EntityEnums.Class.Being,
        ],
      },
      entityId: {
        allowedClasses: [
          EntityEnums.Class.Location,
          EntityEnums.Class.Object,
          EntityEnums.Class.Event,
          EntityEnums.Class.Group,
          EntityEnums.Class.Statement,
          EntityEnums.Class.Value,
          EntityEnums.Class.Resource,
          EntityEnums.Class.Person,
          EntityEnums.Class.Being,
        ],
      },
    },
    "I_R:SOE": {},
    "R:SUS": {},
    "I_R:SUS": {},
    "R:A1S": {},
    "I_R:A1S": {},
    "R:A2S": {},
    "I_R:A2S": {},
    "R:REL": {},
    "I_R:REL": {},
  };

  export const EdgeTypeNodeRules: Record<EdgeType, [EdgeRule, EdgeRule]> = {
    "HP:V": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      { nodeType: NodeType.E, params: {} },
    ],
    "I_HP:V": [
      { nodeType: NodeType.E, params: {} },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "EP:T": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "IS:": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
    ],
    "I_IS:": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "IS:A": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
    ],
    "I_IS:A": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
    ],
    "IS:S": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
    ],
    "I_IS:S": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "IS:A1": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
    ],
    "I_IS:A1": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "IS:A2": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
    ],
    "I_IS:A2": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "IS:PS": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
    ],
    "I_IS:PS": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "SUT:": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
    ],
    "I_SUT:": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
    ],
    "SUT:D": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
    ],
    "I_SUT:D": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
    ],
    "SUT:C": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
    ],
    "I_SUT:C": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
    ],
    "EUT:": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
    ],
    "EUT:C": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
    ],
    "HR:R": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Resource] },
      },
    ],
    "I_HR:R": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Resource] },
      },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "HR:V": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Value] },
      },
    ],
    "CT:": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
    ],
    "I_CT:": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
    ],
    "CT:D": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
    ],
    "I_CT:D": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
    ],
    "CT:G": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
    ],
    "I_CT:G": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Territory] },
      },
    ],
    "SP:T": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "I_SP:T": [
      // source: the entity characterised by the in-statement prop (any class)
      { nodeType: NodeType.E, params: { entityClass: [] } },
      // target: the prop type concept
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "SP:V": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Statement] },
      },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "I_SP:V": [
      // source: the entity characterised by the in-statement prop (any class)
      { nodeType: NodeType.E, params: { entityClass: [] } },
      // target: the prop value (any class)
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    SI: [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    I_SI: [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    SC: [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    I_SC: [
      // source: the entity characterised by the in-statement classification
      { nodeType: NodeType.E, params: { entityClass: [] } },
      // target: the classification concept
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "R:": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "R:SCL": [
      {
        nodeType: NodeType.E,
        params: {
          entityClass: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
        },
      },
      {
        nodeType: NodeType.E,
        params: {
          entityClass: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
        },
      },
    ],
    "I_R:SCL": [
      {
        nodeType: NodeType.E,
        params: {
          entityClass: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
        },
      },
      {
        nodeType: NodeType.E,
        params: {
          entityClass: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
        },
      },
    ],
    "R:SYN": [
      {
        nodeType: NodeType.E,
        params: {
          entityClass: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
        },
      },
      {
        nodeType: NodeType.E,
        params: {
          entityClass: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
        },
      },
    ],
    "R:ANT": [
      {
        nodeType: NodeType.E,
        params: {
          entityClass: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
        },
      },
      {
        nodeType: NodeType.E,
        params: {
          entityClass: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
        },
      },
    ],
    "I_R:ANT": [
      {
        nodeType: NodeType.E,
        params: {
          entityClass: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
        },
      },
      {
        nodeType: NodeType.E,
        params: {
          entityClass: [EntityEnums.Class.Action, EntityEnums.Class.Concept],
        },
      },
    ],
    "R:HOL": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "I_R:HOL": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "R:PRR": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "I_R:PRR": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "R:SAR": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
    ],
    "I_R:SAR": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
    ],
    "R:AEE": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Event] },
      },
    ],
    "I_R:AEE": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Event] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
    ],
    "R:CLA": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "I_R:CLA": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "R:IDE": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "I_R:IDE": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
    ],
    "R:IMP": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
    ],
    "I_R:IMP": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
    ],
    "R:SOE": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "I_R:SOE": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "R:SUS": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "I_R:SUS": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
    ],
    "R:A1S": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "I_R:A1S": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
    ],
    "R:A2S": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "I_R:A2S": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Action] },
      },
    ],
    "R:REL": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "I_R:REL": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
  };
  export const EdgeTypeLabels: Record<EdgeType, string> = {
    "HP:V": "has property: value",
    "I_HP:V": "property origin",
    "EP:T": "has property: type",
    "IS:": "is in S: any position",
    "I_IS:": "S has: in any position",
    "IS:A": "is in S: as action",
    "I_IS:A": "S has: actant",
    "IS:S": "is in S: as subject",
    "I_IS:S": "S has: subject",
    "IS:A1": "is in S: as actant1",
    "I_IS:A1": "S has: actant1",
    "IS:A2": "is in S: as actant2",
    "I_IS:A2": "S has: actant2",
    "IS:PS": "is in S: as pseudoactant",
    "I_IS:PS": "S has: pseudoactant",
    "SUT:": "S under T: any",
    "I_SUT:": "T has S: any",
    "EUT:": "used in statements under T",
    "EUT:C": "used in statements under T: children",
    "SUT:D": "S under T: direct",
    "I_SUT:D": "T has S: direct",
    "SUT:C": "S under T: children",
    "I_SUT:C": "T has S: children",
    "HR:R": "has reference: resource",
    "I_HR:R": "R references",
    "HR:V": "has reference: value",
    "CT:": "T has child T: any",
    "I_CT:": "T has parent T: any",
    "CT:D": "T has child T: direct child",
    "I_CT:D": "T has parent T: direct parent",
    "CT:G": "T has child T: any",
    "I_CT:G": "T has parent T: any",
    "SP:T": "has S prop: type",
    "I_SP:T": "is S prop: type",
    "SP:V": "has S prop: value",
    "I_SP:V": "is S prop:value",
    SI: "has S identification",
    I_SI: "is S identification",
    SC: "has S classification",
    I_SC: "is S clasification",
    "R:": "has relation: any",
    "R:SCL": "has relation: Superclass",
    "I_R:SCL": "is related to: as Superclass",
    "R:SYN": "has relation: Synonym",
    "R:ANT": "has relation: Antonym",
    "I_R:ANT": "is related to: as Antonym",
    "R:HOL": "has relation: Holonym",
    "I_R:HOL": "is related to: as Holonym",
    "R:PRR": "has relation: PropertyReciprocal",
    "I_R:PRR": "is related to: as PropertyReciprocal",
    "R:SAR": "has relation: SubjectActant1Reciprocal",
    "I_R:SAR": "is related to: as SubjectActant1Reciprocal",
    "R:AEE": "has relation: ActionEventEquivalent",
    "I_R:AEE": "is related to: as ActionEventEquivalent",
    "R:CLA": "has relation: Classification",
    "I_R:CLA": "is related to: as Classification",
    "R:IDE": "has relation: Identification",
    "I_R:IDE": "is related to: as Identification",
    "R:IMP": "has relation: Implication",
    "I_R:IMP": "is related to: as Implication",
    "R:SOE": "has relation: SuperordinateEntity",
    "I_R:SOE": "is related to: as SuperordinateEntity",
    "R:SUS": "has relation: SubjectSemantics",
    "I_R:SUS": "is related to: as SubjectSemantics",
    "R:A1S": "has relation: Actant1Semantics",
    "I_R:A1S": "is related to: as Actant1Semantics",
    "R:A2S": "has relation: Actant2Semantics",
    "I_R:A2S": "is related to: as Actant2Semantics",
    "R:REL": "has relation: Related",
    "I_R:REL": "is related to: as Related",
  };

  export enum EdgeProblemSource {
    Source = "source",
    Target = "target",
  }

  export type EdgeValidity = {
    valid: boolean;
    problems: EdgeProblemSource[];
  };
}

export namespace Explore {
  export interface IExplore {
    view: IView; // presentation form + its mode-specific config (columns / stats)
    filters: IExploreSearchFilter[];
    sort: IExploreColumnSort | undefined;
    limit: number;
    offset: number;
  }

  // IView is a discriminated union on `mode`: each presentation mode carries its
  // own config (Table -> columns, Stats -> stats params). Add new modes (e.g.
  // Graph) as further arms.
  export type IView = IExploreTableView | IExploreStatsView;

  export interface IExploreTableView {
    mode: EViewMode.Table;
    columns: IExploreColumn[];
  }

  export interface IExploreStatsView {
    mode: EViewMode.Stats;
    stats: IExploreStatsParams;
  }

  /**
   * Stats config for the Explorer stats view. Reuses the shared aggregation
   * params (so timeUnit / eventType / aggregateBy stay in sync with the global
   * stats request, IRequestStats), but the audit subset is already determined by
   * the query + filters, so the IRequestStats `filter` block is intentionally
   * not part of this. The date window is also dropped here: the explorer has no
   * time filter, and omitting fromDate/toDate lets the server skip the audit
   * `between` scan entirely.
   */
  export type IExploreStatsParams = Omit<
    IStatsAggregationParams,
    "fromDate" | "toDate"
  > & {
    fromDate?: number;
    toDate?: number;
  };

  export enum EViewMode {
    Table = "table",
    Stats = "stats",
  }

  export enum SearchOption {
    Label = "label",
    UUIDs = "uuids",
    Status = "status",
    Language = "language",
    CreatedAt = "created at",
    UpdatedAt = "updated at",
    CreatedBy = "created by",
    UpdatedBy = "updated by",
    EditedBy = "edited by",
    RootValidity = "root validity",
  }

  export type IExploreSearchFilter =
    | IExploreLabelFilter
    | IExploreUuidsFilter
    | IExploreStatusFilter
    | IExploreLanguageFilter
    | IExploreCreatedAtFilter
    | IExploreUpdatedAtFilter
    | IExploreCreatedByFilter
    | IExploreUpdatedByFilter
    | IExploreEditedByFilter
    | IExploreRootValidityFilter;

  export interface IExploreLabelFilter {
    type: SearchOption.Label;
    label: string;
    useRegex?: boolean;
  }

  export interface IExploreUuidsFilter {
    type: SearchOption.UUIDs;
    ids: string[];
  }
  interface IExploreStatusFilter {
    type: SearchOption.Status;
    status: EntityEnums.Status;
  }
  interface IExploreLanguageFilter {
    type: SearchOption.Language;
    language: EntityEnums.Language;
  }
  interface IExploreCreatedAtFilter {
    type: SearchOption.CreatedAt;
    createdAfter?: string;
    createdBefore?: string;
  }
  interface IExploreUpdatedAtFilter {
    type: SearchOption.UpdatedAt;
    updatedAfter?: string;
    updatedBefore?: string;
  }
  interface IExploreCreatedByFilter {
    type: SearchOption.CreatedBy;
    createdBy: string;
  }
  interface IExploreUpdatedByFilter {
    type: SearchOption.UpdatedBy;
    updatedBy: string;
  }
  interface IExploreEditedByFilter {
    type: SearchOption.EditedBy;
    // OR semantics - matches entities edited by any of the listed users
    editedBy: string[];
  }
  interface IExploreRootValidityFilter {
    type: SearchOption.RootValidity;
    rootValidity: IRequestSearchRootValidity;
  }

  export type IExploreColumnSort = {
    columnId: string;
    direction: IExploreColumnSortDirection;
  };
  export type IExploreColumnSortDirection = "asc" | "desc";

  export interface IExploreColumn {
    id: string;
    name: string;
    type: EExploreColumnType;
    editable: boolean;
    params: IExploreColumnParams<EExploreColumnType>;
  }

  export enum EExploreColumnType {
    ER = "ER", // Entity Relations
    EPV = "EPV", // Entity Property value
    EPT = "EPT", // Entity Property types
    ERR = "ERR", // Entity Reference Resources
    ERV = "ERV", // Entity Reference Values
    ES = "ES", // Entity Statements
    CPV = "CPV", // Property values
    CPO = "CPO", // Property type origins
    EUC = "EUC", // Created by
    EUE = "EUE", // Edited by
    EUEN = "EUEN", // Number of edits
    EDC = "EDC", // Creation date
    ELI = "ELI", // Entity Legacy ID
    EST = "EST", // Entity Status
    ELA = "ELA", // Entity Label Language
    EAL = "EAL", // Entity Alt Labels
    EPOS = "EPOS", // Entity Part of Speech
    EDET = "EDET", // Entity Detail
  }

  /** Param value types - determines which form control to render */
  export type ExploreColumnParamValueType = "entity" | "relationType";

  export interface IExploreColumnParamDef {
    id: string;
    type: ExploreColumnParamValueType;
    label: string;
    isRequired: boolean;
    /** For "entity" params: restrict the suggester to these classes. Defaults to Concept. */
    entityClasses?: EntityEnums.Class[];
  }

  /** Params for column types that require configuration */
  export interface IExploreColumnParamsER {
    relationType: RelationEnums.Type;
  }
  export interface IExploreColumnParamsEPV {
    propertyType: string;
  }
  export interface IExploreColumnParamsERV {
    resource: string;
  }
  /** Empty params for column types with no configuration */
  export type IExploreColumnParamsEmpty = Record<string, never>;

  export interface IEExploreColumnTypeConfigEntry<P = IExploreColumnParamsEmpty> {
    label: string;
    description: string;
    isDisabled: boolean;
    params: P;
    paramsDef?: IExploreColumnParamDef[];
  }

  export interface IEExploreColumnTypeConfig {
    [EExploreColumnType.ER]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsER>;
    [EExploreColumnType.EPV]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEPV>;
    [EExploreColumnType.EPT]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.ERR]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.ERV]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsERV>;
    [EExploreColumnType.ES]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.CPV]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.CPO]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.EUC]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.EUE]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.EUEN]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.EDC]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.ELI]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.EST]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.ELA]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.EAL]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.EPOS]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
    [EExploreColumnType.EDET]: IEExploreColumnTypeConfigEntry<IExploreColumnParamsEmpty>;
  }

  export const EExploreColumnTypeConfig: IEExploreColumnTypeConfig = {
    [EExploreColumnType.ER]: {
      label: "Entity Relations",
      description:
        "Shows entities related to this row via the specified relation type (e.g. superclass, synonym).",
      isDisabled: false,
      params: { relationType: RelationEnums.Type.Superclass },
      paramsDef: [
        {
          id: "relationType",
          type: "relationType",
          label: "Relation type",
          isRequired: true,
        },
      ],
    },
    [EExploreColumnType.EPV]: {
      label: "Entity Property value",
      description:
        "Shows the value of a metaproperty of a specific type. The property type is a Concept entity that defines which metaproperty is displayed.",
      isDisabled: false,
      params: { propertyType: "" },
      paramsDef: [
        {
          id: "propertyType",
          type: "entity",
          label: "Property type",
          isRequired: true,
        },
      ],
    },
    [EExploreColumnType.EPT]: {
      label: "Entity Property types",
      description:
        "Shows the types (Concepts) of metaproperties attached to the entity. Editable: you can add or remove property types.",
      isDisabled: false,
      params: {},
    },
    [EExploreColumnType.ERR]: {
      label: "Entity Reference Resources",
      description:
        "Shows the resource side of entity references (e.g. bibliographic sources). Editable: you can add or remove references.",
      isDisabled: false,
      params: {},
    },
    [EExploreColumnType.ERV]: {
      label: "Entity Reference Values",
      description:
        "Shows the value side of entity references for a specific resource. The resource is a Resource entity that defines which reference values are displayed.",
      isDisabled: false,
      params: { resource: "" },
      paramsDef: [
        {
          id: "resource",
          type: "entity",
          label: "Reference resource",
          isRequired: true,
          entityClasses: [EntityEnums.Class.Resource],
        },
      ],
    },
    [EExploreColumnType.ES]: {
      label: "Entity Statements",
      description: "Shows statements that contain this entity.",
      isDisabled: true,
      params: {},
    },
    [EExploreColumnType.CPV]: {
      label: "Property values",
      description: "Shows property values within statements.",
      isDisabled: true,
      params: {},
    },
    [EExploreColumnType.CPO]: {
      label: "Property type origins",
      description: "Shows property type origins within statements.",
      isDisabled: true,
      params: {},
    },
    [EExploreColumnType.EUC]: {
      label: "Created by",
      description: "Shows the user who created this entity.",
      isDisabled: false,
      params: {},
    },
    [EExploreColumnType.EUE]: {
      label: "Edited by",
      description: "Shows the user who last edited this entity.",
      isDisabled: true,
      params: {},
    },
    [EExploreColumnType.EUEN]: {
      label: "Number of edits",
      description: "Shows the number of edits made to this entity.",
      isDisabled: true,
      params: {},
    },
    [EExploreColumnType.EDC]: {
      label: "Creation date",
      description: "Shows when this entity was created.",
      isDisabled: true,
      params: {},
    },
    [EExploreColumnType.ELI]: {
      label: "Legacy ID",
      description: "Shows the legacy identifier of this entity, if available.",
      isDisabled: false,
      params: {},
    },
    [EExploreColumnType.EST]: {
      label: "Status",
      description: "Shows the approval status of this entity (e.g. pending, approved).",
      isDisabled: false,
      params: {},
    },
    [EExploreColumnType.ELA]: {
      label: "Label language",
      description: "Shows the language assigned to this entity's label.",
      isDisabled: false,
      params: {},
    },
    [EExploreColumnType.EAL]: {
      label: "Alt labels",
      description: "Shows alternative labels of this entity (all labels beyond the first).",
      isDisabled: false,
      params: {},
    },
    [EExploreColumnType.EPOS]: {
      label: "Part of speech",
      description: "Shows the part of speech for Concept and Action entities.",
      isDisabled: false,
      params: {},
    },
    [EExploreColumnType.EDET]: {
      label: "Detail",
      description: "Shows the detail/description field of this entity.",
      isDisabled: false,
      params: {},
    },
  };

  export type ExploreColumnParamsMap = {
    [K in EExploreColumnType]: IEExploreColumnTypeConfig[K]["params"];
  };

  export type IExploreColumnParams<T extends EExploreColumnType = EExploreColumnType> =
    ExploreColumnParamsMap[T];
}
