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

  it("seeds I_R:CLA with the first instance class, so the suggester's class is stored", () => {
    expect(switchEdge([EntityEnums.Class.Concept], Query.EdgeType["I_R:CLA"]).entityClasses).toEqual(
      [EntityEnums.Class.Person],
    );
  });

  it("falls back to the edge's own allowed classes when the root pairs with none", () => {
    // a Person can never be a Superclass, so the picker is disabled anyway
    expect(switchEdge([EntityEnums.Class.Person], Query.EdgeType["R:SCL"]).entityClasses).toEqual([
      EntityEnums.Class.Action,
    ]);
  });
});

describe("queryReducer updateNodeClass", () => {
  const rootWithEdge = (
    rootClasses: EntityEnums.Class[],
    type: Query.EdgeType,
    targetParams: Query.INodeParams,
  ): Query.INode => ({
    ...makeNode("root", [
      {
        id: "e1",
        type,
        params: {},
        logic: Query.EdgeLogic.Positive,
        node: { ...makeNode("n1"), params: targetParams },
      },
    ]),
    params: { entityClasses: rootClasses },
  });

  const changeClass = (state: Query.INode, nodeId: string, classes: EntityEnums.Class[]) =>
    queryReducer(state, {
      type: QueryActionType.updateNodeClass,
      payload: { nodeId, newEntityClasses: classes },
    });

  it("moves an empty relation target to the first class the new root allows", () => {
    const state = rootWithEdge([EntityEnums.Class.Concept], Query.EdgeType["R:SYN"], {
      entityClasses: [EntityEnums.Class.Concept],
    });
    const next = changeClass(state, "root", [EntityEnums.Class.Action]);
    expect(next.edges[0].node.params.entityClasses).toEqual([EntityEnums.Class.Action]);
  });

  it("keeps a target class the new root still allows", () => {
    // Superordinate Entity from a Person or a Group can both reach a Group
    const state = rootWithEdge([EntityEnums.Class.Person], Query.EdgeType["R:SOE"], {
      entityClasses: [EntityEnums.Class.Group],
    });
    const next = changeClass(state, "root", [EntityEnums.Class.Group]);
    expect(next.edges[0].node.params.entityClasses).toEqual([EntityEnums.Class.Group]);
  });

  it("leaves a target with a picked entity untouched", () => {
    const state = rootWithEdge([EntityEnums.Class.Concept], Query.EdgeType["R:SYN"], {
      entityClasses: [EntityEnums.Class.Concept],
      entityId: "picked",
    });
    const next = changeClass(state, "root", [EntityEnums.Class.Action]);
    expect(next.edges[0].node.params.entityClasses).toEqual([EntityEnums.Class.Concept]);
  });

  it("leaves non-relation edge targets alone", () => {
    const state = rootWithEdge([EntityEnums.Class.Concept], Query.EdgeType["EP:T"], {
      entityClasses: [EntityEnums.Class.Concept],
    });
    const next = changeClass(state, "root", [EntityEnums.Class.Action]);
    expect(next.edges[0].node.params.entityClasses).toEqual([EntityEnums.Class.Concept]);
  });

  it("does not touch relation targets when a non-root node changes class", () => {
    const state = rootWithEdge([EntityEnums.Class.Action], Query.EdgeType["R:SYN"], {
      entityClasses: [EntityEnums.Class.Concept],
    });
    state.edges.push({
      id: "e2",
      type: Query.EdgeType["EP:T"],
      params: {},
      logic: Query.EdgeLogic.Positive,
      node: makeNode("n2"),
    });
    const next = changeClass(state, "n2", [EntityEnums.Class.Concept]);
    expect(next.edges[0].node.params.entityClasses).toEqual([EntityEnums.Class.Concept]);
  });
});
