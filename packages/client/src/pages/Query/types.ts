import { Query } from "@inkvisitor/shared/types";

export type INodeItem = Query.INode & {
  gridX: number;
  gridY: number;
};

export type QueryValidity = {
  isValid: boolean;
  problems: QueryValidityProblem[];
};
export type QueryValidityProblem = {
  source: string;
  text: string;
};

export const edgeTypesImplemented: Query.EdgeType[] = [
  Query.EdgeType["EP:T"],
  Query.EdgeType["HP:V"],
  Query.EdgeType["SP:T"],
  Query.EdgeType["SP:V"],
  // inverse in-statement edges: match the entity characterised by an
  // in-statement prop/classification (server: getEdgeInstance in edge.ts)
  Query.EdgeType["I_SP:T"],
  Query.EdgeType["I_SP:V"],
  Query.EdgeType["I_SC"],
  // I_IS: match statements that reference a given entity in ANY position
  // (action, actant, tag, direct territory, in-statement prop type/value).
  // AND-combine one per entity for statement co-occurrence (server: edge.ts)
  Query.EdgeType["I_IS:"],
  // inverse in-statement actant-role edges: match statements that have a given
  // entity (or any entity of the target class, e.g. Statement -> substatement
  // chains) as subject / actant1 / actant2 / pseudoactant (server:
  // getEdgeInstance in edge.ts)
  Query.EdgeType["I_IS:S"],
  Query.EdgeType["I_IS:A1"],
  Query.EdgeType["I_IS:A2"],
  Query.EdgeType["I_IS:PS"],
  // I_IS:A: match statements that have the given entity as one of their
  // actions - data.actions[].actionId, which has no position (server:
  // EdgeStatementHasAction in edge.ts)
  Query.EdgeType["I_IS:A"],
  Query.EdgeType["HR:R"],
  Query.EdgeType["HR:V"],
  Query.EdgeType["R:"],
  Query.EdgeType["R:CLA"],
  Query.EdgeType["R:SCL"],
  Query.EdgeType["R:SOE"],
  // ordered relation edges: the entity sits at entityIds[0] and the target at
  // entityIds[1] (server: EdgeHasOrderedRelation in edge.ts)
  Query.EdgeType["R:HOL"],
  Query.EdgeType["R:AEE"],
  Query.EdgeType["R:IMP"],
  Query.EdgeType["R:SUS"],
  Query.EdgeType["R:A1S"],
  Query.EdgeType["R:A2S"],
  // unordered relation edges: symmetric pairs and the Synonym cloud, where the
  // entity can sit at any index (server: EdgeHasUnorderedRelation in edge.ts)
  Query.EdgeType["R:SYN"],
  Query.EdgeType["R:ANT"],
  Query.EdgeType["R:PRR"],
  Query.EdgeType["R:SAR"],
  Query.EdgeType["R:IDE"],
  Query.EdgeType["R:REL"],
  // inverse relation edges: match the entity on the target side of the relation
  // (instances / subclasses / subordinates / meronyms of the target node)
  Query.EdgeType["I_R:CLA"],
  Query.EdgeType["I_R:SCL"],
  Query.EdgeType["I_R:SOE"],
  Query.EdgeType["I_R:HOL"],
  // inverse ordered relation edge: walks entityIds[1] -> entityIds[0]
  // (server: EdgeHasInverseOrderedRelation in edge.ts)
  Query.EdgeType["I_R:AEE"],
  // SUT: match Statements under the target Territory. The target node's SUB
  // toggle widens it to the whole subtree - "include subordinates" of a Territory
  // is its child territories, all levels (server: getSubordinateEntityIds).
  Query.EdgeType["SUT:"],
  // EUT: match any entity USED in statements directly under the target
  // Territory (server: EdgeUsedUnderTerritory in edge.ts)
  Query.EdgeType["EUT:"],
  // IS: (XIsInS) match any entity USED in the target Statement in ANY position
  // - action, actant, reference, prop type/value, classification, identification,
  // tag (server: EdgeIsInStatement in edge.ts)
  Query.EdgeType["IS:"],
  // position-restricted "is in S" edges: match the entity occupying a given
  // position (subject / actant1 / actant2 / pseudoactant) in the target
  // Statement (server: runIsInStatementActantEdge in edge.ts)
  Query.EdgeType["IS:S"],
  Query.EdgeType["IS:A1"],
  Query.EdgeType["IS:A2"],
  Query.EdgeType["IS:PS"],
  // IS:A: match the ACTION entity of the target Statement - data.actions[].actionId
  // (server: EdgeIsInStatementAsAction in edge.ts)
  Query.EdgeType["IS:A"],
];

/**
 * Edge types left out of the edge type dropdown entirely, not even listed as
 * disabled. The "used as" inverses of the semantics/implication relations have
 * no readable "has: X" phrasing. "CT:G" / "I_CT:G" share their label and node
 * rules with "CT:" / "I_CT:" and have no server implementation.
 */
export const edgeTypesHidden: Query.EdgeType[] = [
  Query.EdgeType["CT:G"],
  Query.EdgeType["I_CT:G"],
  Query.EdgeType["I_R:IMP"],
  Query.EdgeType["I_R:SUS"],
  Query.EdgeType["I_R:A1S"],
  Query.EdgeType["I_R:A2S"],
];
