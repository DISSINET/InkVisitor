import { Query } from "@inkvisitor/shared/types/query";
import { describe, expect, it } from "vitest";
import { QueryActionType, queryReducer } from "./state";

const buildState = (logic = Query.EdgeLogic.Positive): Query.INode => ({
  type: Query.NodeType.E,
  id: "root",
  params: { entityClasses: [] },
  operator: Query.NodeOperator.And,
  edges: [
    {
      type: Query.EdgeType["EP:T"],
      id: "edge-1",
      params: {},
      logic,
      node: {
        type: Query.NodeType.E,
        id: "node-1",
        params: { entityId: "target-entity", entityClasses: [] },
        operator: Query.NodeOperator.And,
        edges: [],
      },
    },
  ],
});

describe("queryReducer - updateEdgeLogic", () => {
  it("sets an edge logic to negative", () => {
    const next = queryReducer(buildState(), {
      type: QueryActionType.updateEdgeLogic,
      payload: { edgeId: "edge-1", newLogic: Query.EdgeLogic.Negative },
    });

    expect(next.edges[0].logic).toBe(Query.EdgeLogic.Negative);
  });

  it("sets an edge logic back to positive", () => {
    const next = queryReducer(buildState(Query.EdgeLogic.Negative), {
      type: QueryActionType.updateEdgeLogic,
      payload: { edgeId: "edge-1", newLogic: Query.EdgeLogic.Positive },
    });

    expect(next.edges[0].logic).toBe(Query.EdgeLogic.Positive);
  });

  it("ignores unknown edge ids", () => {
    const next = queryReducer(buildState(), {
      type: QueryActionType.updateEdgeLogic,
      payload: { edgeId: "missing", newLogic: Query.EdgeLogic.Negative },
    });

    expect(next.edges[0].logic).toBe(Query.EdgeLogic.Positive);
  });
});

describe("queryReducer - negation is independent of the target entity", () => {
  it("keeps the edge logic when the target entity is cleared", () => {
    const next = queryReducer(buildState(Query.EdgeLogic.Negative), {
      type: QueryActionType.updateNodeEntityId,
      payload: { nodeId: "node-1", newEntityId: undefined },
    });

    expect(next.edges[0].node.params.entityId).toBeUndefined();
    expect(next.edges[0].logic).toBe(Query.EdgeLogic.Negative);
  });

  it("keeps the edge logic when the target entity is set", () => {
    const next = queryReducer(buildState(Query.EdgeLogic.Negative), {
      type: QueryActionType.updateNodeEntityId,
      payload: { nodeId: "node-1", newEntityId: "new-target" },
    });

    expect(next.edges[0].node.params.entityId).toBe("new-target");
    expect(next.edges[0].logic).toBe(Query.EdgeLogic.Negative);
  });
});
