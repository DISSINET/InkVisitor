import { Query } from "@inkvisitor/shared/types/query";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { describe, expect, it } from "vitest";
import { edgeTypesImplemented } from "./types";

const sourceNode = (entityClasses: EntityEnums.Class[]): Query.INode => ({
  id: "root",
  type: Query.NodeType.E,
  operator: Query.NodeOperator.And,
  params: { entityClasses },
  edges: [],
});

// mirrors QueryGridEdge's dropdown: an option is selectable (not disabled) when
// it is valid for the source node AND present in edgeTypesImplemented
const selectableEdgeTypes = (node: Query.INode): Query.EdgeType[] =>
  Query.findValidEdgeTypesForSourceNode(node).filter((t) =>
    edgeTypesImplemented.includes(t)
  );

describe("query builder offers the inverse in-statement edges", () => {
  it("a Person source node can select I_SP:V / I_SP:T / I_SC", () => {
    const selectable = selectableEdgeTypes(
      sourceNode([EntityEnums.Class.Person])
    );
    expect(selectable).toEqual(
      expect.arrayContaining([
        Query.EdgeType["I_SP:V"],
        Query.EdgeType["I_SP:T"],
        Query.EdgeType["I_SC"],
      ])
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

describe("query builder offers the superordinate (R:SOE) edge", () => {
  it("a Location source node can select R:SOE", () => {
    const selectable = selectableEdgeTypes(
      sourceNode([EntityEnums.Class.Location])
    );
    expect(selectable).toContain(Query.EdgeType["R:SOE"]);
  });

  it("R:SOE exposes a target entity param so 'Lombardy' can be picked by entity", () => {
    expect(Query.EdgeTypeTargetNodeParams[Query.EdgeType["R:SOE"]].entityId).toBeTruthy();
  });
});
