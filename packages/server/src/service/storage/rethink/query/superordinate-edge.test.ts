import "ts-jest";
import { Query } from "@inkvisitor/shared/types/query";
import { getEdgeInstance } from "./edge";

// DB-free: the R:SOE (SuperordinateEntity) edge must be wired into the runtime
// dispatch. Before it was implemented, getEdgeInstance threw
// "unknown edge type: R:SOE" for this type.
const soeEdgeData = (): Partial<Query.IEdge> => ({
  id: "e1",
  type: Query.EdgeType["R:SOE"],
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

describe("R:SOE (SuperordinateEntity) edge registration", () => {
  it("getEdgeInstance resolves R:SOE instead of throwing 'unknown edge type'", () => {
    const edge = getEdgeInstance(soeEdgeData());
    expect(edge.type).toBe(Query.EdgeType["R:SOE"]);
  });
});
