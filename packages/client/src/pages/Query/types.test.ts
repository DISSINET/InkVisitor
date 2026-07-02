import { Query } from "@inkvisitor/shared/types/query";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { describe, expect, it } from "vitest";
import { edgeTypesImplemented } from "./types";
import {
  findValidEdgeTypesForSourceNode,
  isEdgeValid,
  getSuperordinateEntityAllowedClasses,
} from "./utils";

const sourceNode = (entityClasses: EntityEnums.Class[]): Query.INode => ({
  id: "root",
  type: Query.NodeType.E,
  operator: Query.NodeOperator.And,
  params: { entityClasses },
  edges: [],
});

const edge = (type: Query.EdgeType, target: Query.INode): Query.IEdge => ({
  id: "e",
  type,
  params: {},
  logic: Query.EdgeLogic.Positive,
  node: target,
});

// mirrors QueryGridEdge's dropdown: an option is selectable (not disabled) when
// it is valid for the source node AND present in edgeTypesImplemented
const selectableEdgeTypes = (node: Query.INode): Query.EdgeType[] =>
  findValidEdgeTypesForSourceNode(node).filter((t) => edgeTypesImplemented.includes(t));

describe("query builder offers the inverse in-statement edges", () => {
  it("a Person source node can select I_SP:V / I_SP:T / I_SC", () => {
    const selectable = selectableEdgeTypes(sourceNode([EntityEnums.Class.Person]));
    expect(selectable).toEqual(
      expect.arrayContaining([
        Query.EdgeType["I_SP:V"],
        Query.EdgeType["I_SP:T"],
        Query.EdgeType["I_SC"],
      ]),
    );
  });

  it("each inverse edge exposes a target entity param so a concept can be picked", () => {
    for (const type of [
      Query.EdgeType["I_SP:V"],
      Query.EdgeType["I_SP:T"],
      Query.EdgeType["I_SC"],
    ]) {
      expect(Query.EdgeTypeTargetNodeParams[type].entityId).toBeTruthy();
    }
  });
});

describe("query builder offers the in-statement actant-role edges (statement chains)", () => {
  it("a Statement source node can select I_IS:S / I_IS:A1 / I_IS:A2", () => {
    const selectable = selectableEdgeTypes(
      sourceNode([EntityEnums.Class.Statement])
    );
    expect(selectable).toEqual(
      expect.arrayContaining([
        Query.EdgeType["I_IS:S"],
        Query.EdgeType["I_IS:A1"],
        Query.EdgeType["I_IS:A2"],
      ])
    );
  });

  it("each role edge exposes target class + entity params (so the actant can be constrained to Statement)", () => {
    for (const type of [
      Query.EdgeType["I_IS:S"],
      Query.EdgeType["I_IS:A1"],
      Query.EdgeType["I_IS:A2"],
    ]) {
      expect(Query.EdgeTypeTargetNodeParams[type].entityClass).toBeTruthy();
      expect(Query.EdgeTypeTargetNodeParams[type].entityId).toBeTruthy();
    }
  });

  it("source must be a Statement; a Statement target is valid", () => {
    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Statement]),
        edge(Query.EdgeType["I_IS:S"], sourceNode([EntityEnums.Class.Statement]))
      ).valid
    ).toBe(true);

    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Person]),
        edge(Query.EdgeType["I_IS:S"], sourceNode([EntityEnums.Class.Statement]))
      ).valid
    ).toBe(false);
  });
});

describe("query builder offers the any-position in-statement edge (I_IS:) for co-occurrence", () => {
  it("a Statement source node can select I_IS:", () => {
    expect(
      selectableEdgeTypes(sourceNode([EntityEnums.Class.Statement]))
    ).toContain(Query.EdgeType["I_IS:"]);
  });

  it("I_IS: exposes an entity target param (any class) so the co-occurring entity can be picked", () => {
    const params = Query.EdgeTypeTargetNodeParams[Query.EdgeType["I_IS:"]];
    expect(params.entityId).toBeTruthy();
    expect(params.entityId.allowedClasses).toEqual([]);
    // index-keyed by entity id, not class: no class picker is offered
    expect(params.entityClass).toBeFalsy();
  });

  it("source must be a Statement; any target entity is valid", () => {
    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Statement]),
        edge(Query.EdgeType["I_IS:"], sourceNode([EntityEnums.Class.Person]))
      ).valid
    ).toBe(true);

    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Person]),
        edge(Query.EdgeType["I_IS:"], sourceNode([EntityEnums.Class.Person]))
      ).valid
    ).toBe(false);
  });

  it("stays valid once an actual entity is picked (entityClasses cleared)", () => {
    const pickedEntity: Query.INode = {
      id: "target",
      type: Query.NodeType.E,
      operator: Query.NodeOperator.And,
      params: { entityClasses: [], entityId: "some-entity-id" },
      edges: [],
    };
    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Statement]),
        edge(Query.EdgeType["I_IS:"], pickedEntity)
      ).valid
    ).toBe(true);
  });
});

describe("query builder offers the 'used in statements under T' edge (EUT:)", () => {
  it("any source node (e.g. Person, Object) can select EUT:", () => {
    for (const cls of [
      EntityEnums.Class.Person,
      EntityEnums.Class.Object,
      EntityEnums.Class.Concept,
    ]) {
      expect(selectableEdgeTypes(sourceNode([cls]))).toContain(
        Query.EdgeType["EUT:"]
      );
    }
  });

  it("I_SUT: exposes a Territory entity target param so the territory can be picked", () => {
    const params = Query.EdgeTypeTargetNodeParams[Query.EdgeType["EUT:"]];
    expect(params.entityId).toBeTruthy();
    expect(params.entityId.allowedClasses).toEqual([
      EntityEnums.Class.Territory,
    ]);
  });

  it("source may be any entity; the target must be a Territory", () => {
    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Person]),
        edge(Query.EdgeType["EUT:"], sourceNode([EntityEnums.Class.Territory]))
      ).valid
    ).toBe(true);

    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Person]),
        edge(Query.EdgeType["EUT:"], sourceNode([EntityEnums.Class.Person]))
      ).valid
    ).toBe(false);
  });

  it("stays valid once an actual Territory entity is picked (entityClasses cleared)", () => {
    // the runtime state after picking a target entity: entityId set,
    // entityClasses reset to [] (updateNodeEntityId). The query must remain
    // executable rather than being gated invalid.
    const pickedTerritory: Query.INode = {
      id: "target",
      type: Query.NodeType.E,
      operator: Query.NodeOperator.And,
      params: { entityClasses: [], entityId: "some-territory-id" },
      edges: [],
    };
    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Person]),
        edge(Query.EdgeType["EUT:"], pickedTerritory)
      ).valid
    ).toBe(true);
  });
});

describe("query builder offers the 'S under T: children' edge (SUT:C)", () => {
  it("a Statement source node can select SUT:C", () => {
    expect(
      selectableEdgeTypes(sourceNode([EntityEnums.Class.Statement]))
    ).toContain(Query.EdgeType["SUT:C"]);
  });

  it("SUT:C exposes a Territory entity target param so the territory can be picked", () => {
    const params = Query.EdgeTypeTargetNodeParams[Query.EdgeType["SUT:C"]];
    expect(params.entityId).toBeTruthy();
    expect(params.entityId.allowedClasses).toEqual([
      EntityEnums.Class.Territory,
    ]);
  });

  it("source must be a Statement; the target must be a Territory", () => {
    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Statement]),
        edge(Query.EdgeType["SUT:C"], sourceNode([EntityEnums.Class.Territory]))
      ).valid
    ).toBe(true);

    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Person]),
        edge(Query.EdgeType["SUT:C"], sourceNode([EntityEnums.Class.Territory]))
      ).valid
    ).toBe(false);
  });
});

describe("query builder offers the superordinate (R:SOE) edge", () => {
  it("a Location source node can select R:SOE", () => {
    const selectable = selectableEdgeTypes(sourceNode([EntityEnums.Class.Location]));
    expect(selectable).toContain(Query.EdgeType["R:SOE"]);
  });

  it("R:SOE exposes a target entity param so 'Lombardy' can be picked by entity", () => {
    expect(Query.EdgeTypeTargetNodeParams[Query.EdgeType["R:SOE"]].entityId).toBeTruthy();
  });
});

describe("superordinate entity target class filtering", () => {
  it("Location root offers Location as target class", () => {
    expect(getSuperordinateEntityAllowedClasses([EntityEnums.Class.Location])).toEqual([
      EntityEnums.Class.Location,
    ]);
  });

  it("Statement root offers Statement and Event as target classes", () => {
    expect(getSuperordinateEntityAllowedClasses([EntityEnums.Class.Statement])).toEqual(
      expect.arrayContaining([EntityEnums.Class.Statement, EntityEnums.Class.Event]),
    );
  });

  it("Object root offers Object, Person, and Being as target classes", () => {
    expect(getSuperordinateEntityAllowedClasses([EntityEnums.Class.Object])).toEqual(
      expect.arrayContaining([
        EntityEnums.Class.Object,
        EntityEnums.Class.Person,
        EntityEnums.Class.Being,
      ]),
    );
  });

  it("Person-only root offers no target classes", () => {
    expect(getSuperordinateEntityAllowedClasses([EntityEnums.Class.Person])).toEqual([]);
  });
});

// folded in from the (deleted) server inverse-edge-rules.test.ts: edge validity
// is now a client concern (isEdgeValid / findValidEdgeTypesForSourceNode live in
// ./utils), so these rules are exercised here.
describe("inverse in-statement edge validity rules", () => {
  it("a Person source node is valid for I_SP:T / I_SP:V / I_SC", () => {
    const valid = findValidEdgeTypesForSourceNode(sourceNode([EntityEnums.Class.Person]));
    expect(valid).toEqual(
      expect.arrayContaining([
        Query.EdgeType["I_SP:T"],
        Query.EdgeType["I_SP:V"],
        Query.EdgeType["I_SC"],
      ]),
    );
  });

  it("I_SP:T target must be a Concept", () => {
    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Person]),
        edge(Query.EdgeType["I_SP:T"], sourceNode([EntityEnums.Class.Concept])),
      ).valid,
    ).toBe(true);

    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Person]),
        edge(Query.EdgeType["I_SP:T"], sourceNode([EntityEnums.Class.Person])),
      ).valid,
    ).toBe(false);
  });

  it("I_SC target must be a Concept and source may be any entity", () => {
    expect(
      isEdgeValid(
        sourceNode([EntityEnums.Class.Person]),
        edge(Query.EdgeType["I_SC"], sourceNode([EntityEnums.Class.Concept])),
      ).valid,
    ).toBe(true);
  });
});
