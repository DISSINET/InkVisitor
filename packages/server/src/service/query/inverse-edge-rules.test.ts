import "ts-jest";
import { Query } from "@inkvisitor/shared/types/query";
import { EntityEnums } from "@inkvisitor/shared/enums";

// DB-free: the source/target node-class rules that let the client offer and
// validate the inverse in-statement edges. Their source is the characterised
// entity (any class) and their target is the prop/classification concept.

const node = (
  entityClasses: EntityEnums.Class[],
  type: Query.NodeType = Query.NodeType.E
): Query.INode => ({
  id: "n",
  type,
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

describe("inverse in-statement edge validity rules", () => {
  test("a Person source node can use I_SP:T / I_SP:V / I_SC", () => {
    const valid = Query.findValidEdgeTypesForSourceNode(
      node([EntityEnums.Class.Person])
    );
    expect(valid).toEqual(
      expect.arrayContaining([
        Query.EdgeType["I_SP:T"],
        Query.EdgeType["I_SP:V"],
        Query.EdgeType["I_SC"],
      ])
    );
  });

  test("I_SP:T target must be a Concept", () => {
    const concept = Query.isEdgeValidity(
      node([EntityEnums.Class.Person]),
      edge(Query.EdgeType["I_SP:T"], node([EntityEnums.Class.Concept]))
    );
    expect(concept.valid).toBe(true);

    const wrong = Query.isEdgeValidity(
      node([EntityEnums.Class.Person]),
      edge(Query.EdgeType["I_SP:T"], node([EntityEnums.Class.Person]))
    );
    expect(wrong.valid).toBe(false);
  });

  test("I_SC target must be a Concept and source may be any entity", () => {
    const ok = Query.isEdgeValidity(
      node([EntityEnums.Class.Person]),
      edge(Query.EdgeType["I_SC"], node([EntityEnums.Class.Concept]))
    );
    expect(ok.valid).toBe(true);
  });
});
