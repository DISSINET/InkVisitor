import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import { QueryActionType, queryReducer } from "./state";

const makeNode = (id: string, edges: Query.IEdge[] = []): Query.INode => ({
  id,
  type: Query.NodeType.E,
  params: { entityClasses: [EntityEnums.Class.Being] },
  operator: Query.NodeOperator.And,
  edges,
});

describe("queryReducer setQueryState", () => {
  it("replaces the whole tree with the payload state", () => {
    const oldState = makeNode("root");
    const loaded = makeNode("root", [
      {
        id: "e1",
        type: Query.EdgeType["EP:T"],
        params: {},
        logic: Query.EdgeLogic.Positive,
        node: makeNode("n1"),
      },
    ]);

    const next = queryReducer(oldState, {
      type: QueryActionType.setQueryState,
      payload: { newState: loaded },
    });

    expect(next.edges).toHaveLength(1);
    expect(next.edges[0].node.id).toEqual("n1");
  });

  it("clones the payload so later mutations of the source don't leak in", () => {
    const loaded = makeNode("root", [
      {
        id: "e1",
        type: Query.EdgeType["EP:T"],
        params: {},
        logic: Query.EdgeLogic.Positive,
        node: makeNode("n1"),
      },
    ]);

    const next = queryReducer(makeNode("root"), {
      type: QueryActionType.setQueryState,
      payload: { newState: loaded },
    });

    loaded.edges[0].node.params.label = "mutated";
    expect(next.edges[0].node.params.label).not.toEqual("mutated");
  });
});
