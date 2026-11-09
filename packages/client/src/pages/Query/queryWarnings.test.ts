import { Query } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import { queryWarnings } from "./types";

const node = (params: Query.INodeParams, edges: Query.IEdge[] = []): Query.INode => ({
  id: "",
  type: Query.NodeType.E,
  params,
  operator: Query.NodeOperator.And,
  edges,
});
const edge = (id: string, type: Query.EdgeType, target: Query.INode): Query.IEdge => ({
  id,
  type,
  params: {},
  logic: Query.EdgeLogic.Positive,
  node: target,
});

/** root -(incoming)-> child with `params` -(nested)-> any node */
const nested = (incoming: Query.EdgeType, params: Query.INodeParams) =>
  node({}, [edge("outer", incoming, node(params, [edge("inner", Query.EdgeType["HP:V"], node({}))]))]);

const warnedEdges = (root: Query.INode) => queryWarnings(root).map((warning) => warning.source);

describe("queryWarnings", () => {
  it("warns on a condition under a pinned node that EQ and SUB leave single", () => {
    expect(warnedEdges(nested(Query.EdgeType["EP:T"], { entityId: "sex" }))).toEqual(["inner"]);
  });

  it("does not warn once EQ or SUB widens the pinned entity, or the node is unpinned", () => {
    expect(warnedEdges(nested(Query.EdgeType["EP:T"], { entityId: "sex", includeEquivalents: true }))).toEqual([]);
    expect(warnedEdges(nested(Query.EdgeType["EP:T"], { entityId: "sex", includeSubordinates: true }))).toEqual([]);
    expect(warnedEdges(nested(Query.EdgeType["EP:T"], {}))).toEqual([]);
  });

  it("still warns on the territory-tree edges, where SUB adds no subordinates", () => {
    expect(warnedEdges(nested(Query.EdgeType["I_CT:"], { entityId: "t", includeSubordinates: true }))).toEqual(["inner"]);
    expect(warnedEdges(nested(Query.EdgeType["CT:"], { entityId: "t", includeSubordinates: true }))).toEqual(["inner"]);
  });

  it("does not warn on the root's own edges", () => {
    const root = node({ entityId: "e" }, [edge("e1", Query.EdgeType["R:"], node({}))]);
    expect(warnedEdges(root)).toEqual([]);
  });
});
