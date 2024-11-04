import { EntityEnums, RelationEnums } from "../enums";

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
    classes?: EntityEnums.Class[];
    label?: string;
    id?: string;
  }
  export interface IEdgeParams {}

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

  export const EdgeTypeNodeRules: Record<EdgeType, [EdgeRule, EdgeRule]> = {
    "HP:V": [
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
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
      { nodeType: NodeType.E, params: { entityClass: [] } },
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
    ],
    "I_SP:T": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "SP:V": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
      { nodeType: NodeType.E, params: { entityClass: [] } },
    ],
    "I_SP:V": [
      { nodeType: NodeType.E, params: { entityClass: [] } },
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
      {
        nodeType: NodeType.E,
        params: { entityClass: [EntityEnums.Class.Concept] },
      },
      { nodeType: NodeType.E, params: { entityClass: [] } },
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
    "SUT:D": "S under T: direct",
    "I_SUT:D": "T has S: direct",
    "SUT:C": "S under T: children",
    "I_SUT:C": "T has S: children",
    "HR:R": "has reference: resource",
    "I_HR:R": "R references",
    "HR:V": "Has reference: value",
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

  export const findValidEdgeTypesForSourceNode = (node: INode): EdgeType[] => {
    const validEdges = Object.entries(EdgeTypeNodeRules)
      .filter(([, [ruleFrom, ruleTo]]) => {
        // TODO
        return node.type === ruleFrom.nodeType;
      })
      .map(([type]) => type as EdgeType);
    return validEdges;
  };

  export const findValidEdgeTypesForTargetNode = (node: INode): EdgeType[] => {
    const validEdges = Object.entries(EdgeTypeNodeRules)
      .filter(([, [from, to]]) => {
        // TODO
        return (
          node.type === to.nodeType &&
          to.params.entityClass?.includes(node.params.classes![0])
        );
      })
      .map(([type]) => type as EdgeType);
    return validEdges;
  };

  export enum EdgeProblemSource {
    Source = "source",
    Target = "target",
  }

  export type EdgeValidity = {
    valid: boolean;
    problems: EdgeProblemSource[];
  };

  export const isEdgeValidity = (
    sourceNode: INode,
    edge: IEdge
  ): EdgeValidity => {
    const targetNode = edge.node;
    const edgeRule = EdgeTypeNodeRules[edge.type];
    const [ruleFrom, ruleTo] = edgeRule;

    const sourceValid = isNodeValid(sourceNode, ruleFrom);
    const targetValid = isNodeValid(targetNode, ruleTo);
    const edgeValid = sourceValid && targetValid;

    const problems: EdgeProblemSource[] = [];
    if (!sourceValid) {
      problems.push(EdgeProblemSource.Source);
    }
    if (!targetValid) {
      problems.push(EdgeProblemSource.Target);
    }

    return {
      valid: edgeValid,
      problems,
    };
  };

  export const isNodeValid = (node: INode, rule: EdgeRule): boolean => {
    if (node.type !== rule.nodeType) {
      return false;
    }
    if (
      rule.params.entityClass === undefined ||
      rule.params.entityClass.length === 0
    ) {
      return true;
    }
    if (node.params.classes === undefined || node.params.classes.length === 0) {
      return false;
    }

    return node.params.classes.every((nodeClass) => {
      return rule.params.entityClass?.includes(nodeClass) || false;
    });
  };
}

export namespace Explore {
  export interface IExplore {
    view: IView; // information about the presentation form
    columns: IExploreColumn[];
    filters: IExploreColumnFilter[];
    sort: IExploreColumnSort | undefined;
    limit: number;
    offset: number;
  }

  export enum EViewMode {
    Table = "table",
  }

  export interface IView {
    mode: EViewMode;
  }

  export interface IExploreColumnFilter {}

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
  }

  export const EExploreColumnTypeLabels: Record<EExploreColumnType, string> = {
    [EExploreColumnType.ER]: "Entity Relations",
    [EExploreColumnType.EPV]: "Entity Property value",
    [EExploreColumnType.EPT]: "Entity Property types",
    [EExploreColumnType.ERR]: "Entity Reference Resources",
    [EExploreColumnType.ERV]: "Entity Reference Values",
    [EExploreColumnType.ES]: "Entity Statements",
    [EExploreColumnType.CPV]: "Property values",
    [EExploreColumnType.CPO]: "Property type origins",
    [EExploreColumnType.EUC]: "Created by",
    [EExploreColumnType.EUE]: "Edited by",
    [EExploreColumnType.EUEN]: "Number of edits",
    [EExploreColumnType.EDC]: "Creation date",
  };

  export const EExploreColumnTypeDisabled: Record<
    EExploreColumnType,
    { disabled: boolean }
  > = {
    [EExploreColumnType.ER]: { disabled: false },
    [EExploreColumnType.EPV]: { disabled: false },
    [EExploreColumnType.EPT]: { disabled: false },
    [EExploreColumnType.ERR]: { disabled: true },
    [EExploreColumnType.ERV]: { disabled: true },
    [EExploreColumnType.ES]: { disabled: true },
    [EExploreColumnType.CPV]: { disabled: true },
    [EExploreColumnType.CPO]: { disabled: true },
    [EExploreColumnType.EUC]: { disabled: false },
    [EExploreColumnType.EUE]: { disabled: true },
    [EExploreColumnType.EUEN]: { disabled: true },
    [EExploreColumnType.EDC]: { disabled: true },
  };

  export type ExploreColumnParamsMap = {
    [EExploreColumnType.ER]: { relationType: RelationEnums.Type };
    [EExploreColumnType.EPV]: { propertyType: string };
    [EExploreColumnType.EPT]: {};
    [EExploreColumnType.ERR]: {};
    [EExploreColumnType.ERV]: {};
    [EExploreColumnType.ES]: {};
    [EExploreColumnType.CPV]: {};
    [EExploreColumnType.CPO]: {};
    [EExploreColumnType.EUC]: {};
    [EExploreColumnType.EUE]: {};
    [EExploreColumnType.EUEN]: {};
    [EExploreColumnType.EDC]: {};
  };

  export type IExploreColumnParams<
    T extends EExploreColumnType = EExploreColumnType
  > = ExploreColumnParamsMap[T];
}
