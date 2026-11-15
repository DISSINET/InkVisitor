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

const classNode = (
  id: string,
  classes: EntityEnums.Class[],
  edges: Query.IEdge[] = [],
): Query.INode => ({ ...makeNode(id, edges), params: { entityClasses: classes } });

const makeEdge = (id: string, type: Query.EdgeType, node: Query.INode): Query.IEdge => ({
  id,
  type,
  params: {},
  logic: Query.EdgeLogic.Positive,
  node,
});

describe("queryReducer node filters", () => {
  const withTarget = (params: Query.INodeParams): Query.INode =>
    makeNode("root", [
      {
        id: "e1",
        type: Query.EdgeType["R:SCL"],
        params: {},
        logic: Query.EdgeLogic.Positive,
        node: { ...makeNode("n1"), params },
      },
    ]);

  it("updateNodeFilters sets the given params and removes the emptied ones", () => {
    const next = queryReducer(withTarget({ createdBy: "u-1", editedBy: ["u-2"] }), {
      type: QueryActionType.updateNodeFilters,
      payload: {
        nodeId: "n1",
        changes: { createdAfter: "2024-01-01T00:00:00.000Z", createdBy: "", editedBy: [] },
      },
    });
    expect(next.edges[0].node.params).toEqual({ createdAfter: "2024-01-01T00:00:00.000Z" });
  });

  it("clearNodeFilters and pinning an entity drop every node filter, the classes stay", () => {
    const params: Query.INodeParams = {
      entityClasses: [EntityEnums.Class.Concept],
      label: "star",
      createdBefore: "2024-01-01T00:00:00.000Z",
      updatedBy: "u-1",
      coOccurrence: ["c-1"],
    };
    const cleared = queryReducer(withTarget({ ...params }), {
      type: QueryActionType.clearNodeFilters,
      payload: { nodeId: "n1" },
    });
    expect(cleared.edges[0].node.params).toEqual({ entityClasses: [EntityEnums.Class.Concept] });

    const pinned = queryReducer(withTarget({ ...params }), {
      type: QueryActionType.updateNodeEntityId,
      payload: { nodeId: "n1", newEntityId: "c-2" },
    });
    expect(pinned.edges[0].node.params).toEqual({ entityClasses: [], entityId: "c-2" });
  });
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

  it("seeds R: with a class, so the suggester's class is stored", () => {
    expect(switchEdge([EntityEnums.Class.Concept], Query.EdgeType["R:"]).entityClasses).toHaveLength(1);
  });

  it("falls back to the edge's own allowed classes when the root pairs with none", () => {
    // a Person can never be a Superclass, so the picker is disabled anyway
    expect(switchEdge([EntityEnums.Class.Person], Query.EdgeType["R:SCL"]).entityClasses).toEqual([
      EntityEnums.Class.Action,
    ]);
  });

  it("seeds a nested relation edge's target class from its source node, not the root", () => {
    // a Superclass pairs a Concept with a Concept; a Person root pairs with none
    const state = classNode("root", [EntityEnums.Class.Person], [
      makeEdge(
        "e0",
        Query.EdgeType["R:"],
        classNode("n0", [EntityEnums.Class.Concept], [
          makeEdge("e1", Query.EdgeType["EP:T"], makeNode("n1")),
        ]),
      ),
    ]);
    const next = queryReducer(state, {
      type: QueryActionType.updateEdgeType,
      payload: { edgeId: "e1", newType: Query.EdgeType["R:SCL"] },
    });
    expect(next.edges[0].node.edges[0].node.params.entityClasses).toEqual([
      EntityEnums.Class.Concept,
    ]);
  });

  it("moves the relation targets under the switched edge's target to its new class", () => {
    // n1 becomes a Concept, and a Synonym pairs a Concept with a Concept only
    const state = classNode("root", [EntityEnums.Class.Concept], [
      makeEdge(
        "e1",
        Query.EdgeType["EP:T"],
        classNode("n1", [EntityEnums.Class.Action], [
          makeEdge("e2", Query.EdgeType["R:SYN"], classNode("n2", [EntityEnums.Class.Action])),
        ]),
      ),
    ]);
    const next = queryReducer(state, {
      type: QueryActionType.updateEdgeType,
      payload: { edgeId: "e1", newType: Query.EdgeType["R:SCL"] },
    });
    expect(next.edges[0].node.params.entityClasses).toEqual([EntityEnums.Class.Concept]);
    expect(next.edges[0].node.edges[0].node.params.entityClasses).toEqual([
      EntityEnums.Class.Concept,
    ]);
  });

  const pinned = (id: string, edges: Query.IEdge[] = []): Query.INode => ({
    ...makeNode(id, edges),
    params: { entityId: "picked", entityClasses: [] },
  });
  const switchType = (state: Query.INode, edgeId: string, newType: Query.EdgeType) =>
    queryReducer(state, { type: QueryActionType.updateEdgeType, payload: { edgeId, newType } });

  it("seeds under a picked entity from the classes its own edge lets it hold", () => {
    // the picked entity is a Superclass of a Concept, so it is a Concept itself
    const state = classNode("root", [EntityEnums.Class.Concept], [
      makeEdge(
        "e0",
        Query.EdgeType["R:SCL"],
        pinned("n0", [makeEdge("e1", Query.EdgeType["EP:T"], makeNode("n1"))]),
      ),
    ]);
    const next = switchType(state, "e1", Query.EdgeType["R:SCL"]);
    expect(next.edges[0].node.edges[0].node.params.entityClasses).toEqual([
      EntityEnums.Class.Concept,
    ]);
  });

  it("seeds under a node without classes from the classes its own edge lets it hold", () => {
    // a prop type is always a Concept
    const state = classNode("root", [EntityEnums.Class.Person], [
      makeEdge("e0", Query.EdgeType["EP:T"], {
        ...makeNode("n0", [makeEdge("e1", Query.EdgeType["EP:T"], makeNode("n1"))]),
        params: {},
      }),
    ]);
    const next = switchType(state, "e1", Query.EdgeType["R:SCL"]);
    expect(next.edges[0].node.edges[0].node.params.entityClasses).toEqual([
      EntityEnums.Class.Concept,
    ]);
  });

  it("the class seeded beside a picked entity does not move the targets under it", () => {
    // the switch seeds n1 with the Antonym's first class, Action, yet the picked
    // entity can as well be a Concept, which the Synonym under it still reaches
    const state = classNode("root", [], [
      makeEdge(
        "e1",
        Query.EdgeType["R:SCL"],
        pinned("n1", [
          makeEdge("e2", Query.EdgeType["R:SYN"], classNode("n2", [EntityEnums.Class.Concept])),
        ]),
      ),
    ]);
    const next = switchType(state, "e1", Query.EdgeType["R:ANT"]);
    expect(next.edges[0].node.params.entityId).toBe("picked");
    expect(next.edges[0].node.edges[0].node.params.entityClasses).toEqual([
      EntityEnums.Class.Concept,
    ]);
  });

  it("removing the picked entity moves the targets its seeded class does not reach", () => {
    // the edge control clears the picked entity right after the type switch,
    // which leaves n1 on the class the switch seeded
    const state = classNode("root", [EntityEnums.Class.Concept, EntityEnums.Class.Action], [
      makeEdge(
        "e1",
        Query.EdgeType["R:SCL"],
        pinned("n1", [
          makeEdge("e2", Query.EdgeType["R:SYN"], classNode("n2", [EntityEnums.Class.Concept])),
        ]),
      ),
    ]);
    const switched = switchType(state, "e1", Query.EdgeType["R:ANT"]);
    const next = queryReducer(switched, {
      type: QueryActionType.updateNodeEntityId,
      payload: { nodeId: "n1", newEntityId: undefined },
    });
    expect(next.edges[0].node.params.entityClasses).toEqual([EntityEnums.Class.Action]);
    expect(next.edges[0].node.edges[0].node.params.entityClasses).toEqual([
      EntityEnums.Class.Action,
    ]);
  });

  it("resolves the classes of a picked entity through every node above it", () => {
    // n1 is a Superclass of a Classification target, so a Concept
    const state = classNode("root", [EntityEnums.Class.Person], [
      makeEdge("e0", Query.EdgeType["R:CLA"], {
        ...makeNode("n0", [
          makeEdge(
            "e1",
            Query.EdgeType["R:SCL"],
            pinned("n1", [makeEdge("e2", Query.EdgeType["EP:T"], makeNode("n2"))]),
          ),
        ]),
        params: {},
      }),
    ]);
    const next = switchType(state, "e2", Query.EdgeType["R:SCL"]);
    expect(next.edges[0].node.edges[0].node.edges[0].node.params.entityClasses).toEqual([
      EntityEnums.Class.Concept,
    ]);
  });
});

describe("queryReducer updateNodeExpansionToggles", () => {
  it("turning EQ off moves a target only the equivalents reached", () => {
    // with EQ the prop type stands for its equivalents of any class; alone it
    // is a Concept, which a Synonym pairs with a Concept
    const state = classNode("root", [], [
      makeEdge("e0", Query.EdgeType["EP:T"], {
        ...makeNode("n0", [
          makeEdge("e1", Query.EdgeType["R:SYN"], classNode("n1", [EntityEnums.Class.Action])),
        ]),
        params: { entityId: "picked", entityClasses: [], includeEquivalents: true },
      }),
    ]);
    const next = queryReducer(state, {
      type: QueryActionType.updateNodeExpansionToggles,
      payload: { nodeId: "n0", field: "includeEquivalents", value: undefined },
    });
    expect(next.edges[0].node.edges[0].node.params.entityClasses).toEqual([
      EntityEnums.Class.Concept,
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

  it("leaves the relation targets of other nodes alone", () => {
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

  // root -e0-> n0 -R:SYN-> n1, a Synonym pairing each class with itself only
  const nested = (
    rootClasses: EntityEnums.Class[],
    rootEdgeType: Query.EdgeType,
  ): Query.INode =>
    classNode("root", rootClasses, [
      makeEdge(
        "e0",
        rootEdgeType,
        classNode("n0", [EntityEnums.Class.Concept], [
          makeEdge("e1", Query.EdgeType["R:SYN"], classNode("n1", [EntityEnums.Class.Concept])),
        ]),
      ),
    ]);
  const n0Classes = (state: Query.INode) => state.edges[0].node.params.entityClasses;
  const n1Classes = (state: Query.INode) => state.edges[0].node.edges[0].node.params.entityClasses;

  it("moves a nested relation target to the first class its source node allows", () => {
    const state = nested([EntityEnums.Class.Person], Query.EdgeType["R:"]);
    const next = changeClass(state, "n0", [EntityEnums.Class.Action]);
    expect(n1Classes(next)).toEqual([EntityEnums.Class.Action]);
  });

  it("keeps a nested relation target its source node still allows when the root changes", () => {
    const state = nested([EntityEnums.Class.Concept], Query.EdgeType["R:"]);
    const next = changeClass(state, "root", [EntityEnums.Class.Action]);
    expect(n0Classes(next)).toEqual([EntityEnums.Class.Concept]);
    expect(n1Classes(next)).toEqual([EntityEnums.Class.Concept]);
  });

  it("moves the relation targets under a moved target as well", () => {
    const state = nested([EntityEnums.Class.Concept], Query.EdgeType["R:SYN"]);
    const next = changeClass(state, "root", [EntityEnums.Class.Action]);
    expect(n0Classes(next)).toEqual([EntityEnums.Class.Action]);
    expect(n1Classes(next)).toEqual([EntityEnums.Class.Action]);
  });

  it("leaves a target out of reach alone while its own source keeps its classes", () => {
    // n1 holds a class its source never reached; its picker is re-seeded only
    // when the source's classes change, so the stored class stays as well
    const state = nested([EntityEnums.Class.Action], Query.EdgeType["R:"]);
    state.edges[0].node.edges[0].node.params.entityClasses = [EntityEnums.Class.Action];
    const next = changeClass(state, "root", [EntityEnums.Class.Action, EntityEnums.Class.Person]);
    expect(n0Classes(next)).toEqual([EntityEnums.Class.Concept]);
    expect(n1Classes(next)).toEqual([EntityEnums.Class.Action]);
  });

  it("moves a relation target under an any-class target the new class reaches through", () => {
    const state = nested([EntityEnums.Class.Concept], Query.EdgeType["R:SYN"]);
    state.edges[0].node.params.entityClasses = [];
    const next = changeClass(state, "root", [EntityEnums.Class.Action]);
    expect(n0Classes(next)).toEqual([]);
    expect(n1Classes(next)).toEqual([EntityEnums.Class.Action]);
  });
});

describe("queryReducer removeEdge", () => {
  it("removes a nested edge from its own source node", () => {
    const state = makeNode("root", [
      makeEdge("e0", Query.EdgeType["EP:T"], makeNode("n0", [
        makeEdge("e1", Query.EdgeType["EP:T"], makeNode("n1")),
      ])),
    ]);
    const next = queryReducer(state, {
      type: QueryActionType.removeEdge,
      payload: { edgeId: "e1" },
    });
    expect(next.edges.map((edge) => edge.id)).toEqual(["e0"]);
    expect(next.edges[0].node.edges).toEqual([]);
  });

  const edge = (id: string, node: Query.INode): Query.IEdge => ({
    id,
    type: Query.EdgeType["EP:T"],
    params: {},
    logic: Query.EdgeLogic.Positive,
    node,
  });

  it("removes a node together with the nodes nested under it", () => {
    const state = makeNode("root", [
      edge("e1", makeNode("n1", [edge("e2", makeNode("n2"))])),
      edge("e3", makeNode("n3")),
    ]);
    const next = queryReducer(state, { type: QueryActionType.removeEdge, payload: { edgeId: "e1" } });
    expect(next.edges.map((e) => e.id)).toEqual(["e3"]);
  });
});
