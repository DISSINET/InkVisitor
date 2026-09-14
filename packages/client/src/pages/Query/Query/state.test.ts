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

describe("queryReducer updateEdgeType", () => {
  const switchEdge = (
    rootClasses: EntityEnums.Class[],
    newType: Query.EdgeType,
  ): Query.INodeParams => {
    const state: Query.INode = {
      ...makeNode("root", [
        {
          id: "e1",
          type: Query.EdgeType["EP:T"],
          params: {},
          logic: Query.EdgeLogic.Positive,
          node: makeNode("n1"),
        },
      ]),
      params: { entityClasses: rootClasses },
    };
    const next = queryReducer(state, {
      type: QueryActionType.updateEdgeType,
      payload: { edgeId: "e1", newType },
    });
    return next.edges[0].node.params;
  };

  it("seeds a relation edge's target class from the root: Concept root on I_R:SCL gets Concept", () => {
    expect(switchEdge([EntityEnums.Class.Concept], Query.EdgeType["I_R:SCL"]).entityClasses).toEqual(
      [EntityEnums.Class.Concept],
    );
    expect(switchEdge([EntityEnums.Class.Concept], Query.EdgeType["R:SCL"]).entityClasses).toEqual([
      EntityEnums.Class.Concept,
    ]);
  });

  it("seeds the subordinate side for I_R:SOE: Person root gets Object", () => {
    expect(switchEdge([EntityEnums.Class.Person], Query.EdgeType["I_R:SOE"]).entityClasses).toEqual(
      [EntityEnums.Class.Object],
    );
  });

  it("falls back to the edge's own allowed classes when the root pairs with none", () => {
    // a Person can never be a Superclass, so the picker is disabled anyway
    expect(switchEdge([EntityEnums.Class.Person], Query.EdgeType["R:SCL"]).entityClasses).toEqual([
      EntityEnums.Class.Action,
    ]);
  });
});
