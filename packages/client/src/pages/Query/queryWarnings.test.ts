import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import { exploreStateInitial } from "./Explorer/state";
import {
  PINNED_CONDITION_WARNING,
  PINNED_START_NODE_CONDITION_WARNING,
  queryWarnings,
  START_NODE_WARNING,
} from "./types";
import { isQueryRequestEmpty } from "./Query/utils";

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

  it("says a pinned start node, not the query, finds nothing", () => {
    const texts = (incoming: Query.EdgeType) =>
      queryWarnings(nested(incoming, { entityId: "sex" })).map((warning) => warning.text);
    expect(texts(Query.EdgeType.SE)).toEqual([PINNED_START_NODE_CONDITION_WARNING]);
    expect(texts(Query.EdgeType["EP:T"])).toEqual([PINNED_CONDITION_WARNING]);
  });
});

describe("queryWarnings on start nodes", () => {
  const startNodes = (...edges: Query.IEdge[]): Query.INode => ({
    ...node({}, edges),
    operator: Query.NodeOperator.Or,
  });
  const narrowed = edge("narrowed", Query.EdgeType.SE, node({ entityClasses: [EntityEnums.Class.Person] }));
  const open = edge("open", Query.EdgeType.SE, node({}));
  const openWithEdge = edge(
    "open-with-se",
    Query.EdgeType.SE,
    node({}, [edge("inner", Query.EdgeType["HP:V"], node({}))]),
  );
  const notOpen = { ...edge("not-open", Query.EdgeType.SE, node({})), logic: Query.EdgeLogic.Negative };

  it("warns on each start node nothing narrows while the request is skipped", () => {
    const warnings = queryWarnings(startNodes(narrowed, open, openWithEdge, notOpen), true);
    expect(warnings).toEqual([{ source: "open", text: START_NODE_WARNING, warning: true }]);
  });

  it("does not warn while the request runs", () => {
    expect(queryWarnings(startNodes(narrowed, open), false)).toEqual([]);
    expect(queryWarnings(startNodes(narrowed, open))).toEqual([]);
  });

  it("does not take an edge of another type beside the start nodes for one", () => {
    const plain = edge("plain", Query.EdgeType["HP:V"], node({}));
    expect(queryWarnings(startNodes(open, plain), true).map((warning) => warning.source)).toEqual([
      "open",
    ]);
  });

  it("warns as the request the explorer reads off the query is skipped", () => {
    const warned = (root: Query.INode) =>
      queryWarnings(root, isQueryRequestEmpty(root, exploreStateInitial)).map(
        (warning) => warning.source,
      );
    expect(warned(startNodes(narrowed, open))).toEqual(["open"]);
    expect(warned(startNodes(narrowed, openWithEdge))).toEqual([]);
  });
});
