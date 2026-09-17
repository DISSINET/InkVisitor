import "ts-jest";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// DB-free: every `has relation:` edge offered by the query builder must be wired
// into the runtime dispatch. Before they were implemented, getEdgeInstance threw
// "unknown edge type: <type>" for these.
const RELATION_EDGE_TYPES: Query.EdgeType[] = [
  Query.EdgeType["R:HOL"],
  Query.EdgeType["R:AEE"],
  Query.EdgeType["R:IMP"],
  Query.EdgeType["R:SUS"],
  Query.EdgeType["R:A1S"],
  Query.EdgeType["R:A2S"],
  Query.EdgeType["R:SYN"],
  Query.EdgeType["R:ANT"],
  Query.EdgeType["R:PRR"],
  Query.EdgeType["R:SAR"],
  Query.EdgeType["R:IDE"],
  Query.EdgeType["R:REL"],
];

const edgeData = (type: Query.EdgeType): Partial<Query.IEdge> => ({
  id: "e1",
  type,
  params: {},
  logic: Query.EdgeLogic.Positive,
  node: {
    id: "n1",
    type: Query.NodeType.E,
    operator: Query.NodeOperator.And,
    params: {},
    edges: [],
  },
});

describe("relation edge registration", () => {
  test.each(RELATION_EDGE_TYPES)(
    "getEdgeInstance resolves %s instead of throwing 'unknown edge type'",
    (type) => {
      const edge = getEdgeInstance(edgeData(type));
      expect(edge.type).toBe(type);
    }
  );

  it("still rejects an edge type with no implementation", () => {
    expect(() => getEdgeInstance(edgeData("NOPE" as Query.EdgeType))).toThrow(
      /unknown edge type/
    );
  });
});
