import "ts-jest";
import { SearchEdgeTypesInvalid } from "@inkvisitor/shared/types/errors";
import { Explore, Query } from "@inkvisitor/shared/types/query";
import QuerySearch from "./search";

const explore = (): Explore.IExplore => ({
  view: { mode: Explore.EViewMode.Table, columns: [] },
  filters: [],
  sort: undefined,
  limit: 10,
  offset: 0,
});
const node = (edges: Query.IEdge[] = [], operator = Query.NodeOperator.And): Query.INode => ({
  id: "",
  type: Query.NodeType.E,
  params: {},
  operator,
  edges,
});
const edge = (type: string, target: Query.INode = node()): Query.IEdge => ({
  id: "",
  type: type as Query.EdgeType,
  params: {},
  logic: Query.EdgeLogic.Positive,
  node: target,
});
const search = (root: Query.INode) => () => new QuerySearch(root, explore());

describe("QuerySearch start nodes", () => {
  it("accepts SE edges as the only edges of an Or root", () => {
    expect(search(node([edge("SE"), edge("SE")], Query.NodeOperator.Or))).not.toThrow();
    expect(search(node([edge("SE")], Query.NodeOperator.Or))).not.toThrow();
  });

  it("rejects start nodes joined by anything but Or, a single one included", () => {
    expect(search(node([edge("SE"), edge("SE")]))).toThrow(SearchEdgeTypesInvalid);
    expect(search(node([edge("SE")]))).toThrow(SearchEdgeTypesInvalid);
    const noOperator = { ...node([edge("SE")]), operator: undefined as unknown as Query.NodeOperator };
    expect(search(noOperator)).toThrow(SearchEdgeTypesInvalid);
  });

  it("rejects start nodes beside another edge of the root", () => {
    expect(search(node([edge("SE"), edge("R:")], Query.NodeOperator.Or))).toThrow(SearchEdgeTypesInvalid);
  });

  // any node can be sent as a root of its own, as the builder's matches badge does
  it("rejects an SE edge below the root", () => {
    const below = node([edge("SE"), edge("EP:T")]);
    expect(search(node([edge("R:", below)]))).toThrow(SearchEdgeTypesInvalid);
    const startNode = node([edge("R:", node([edge("SE")], Query.NodeOperator.Or))]);
    expect(search(node([edge("SE", startNode)], Query.NodeOperator.Or))).toThrow(SearchEdgeTypesInvalid);
  });

  it("leaves a query without SE edges alone, whatever stands for its edges", () => {
    expect(search(node([edge("R:"), edge("EP:T", node([edge("R:")]))]))).not.toThrow();
    for (const edges of [undefined, null, 0, ""]) {
      expect(search({ ...node(), edges: edges as unknown as Query.IEdge[] })).not.toThrow();
    }
  });
});
