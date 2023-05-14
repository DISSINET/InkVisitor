import Entity from "@models/entity/entity";
import { Search } from "@shared/types";
import { Connection, r, RDatum, RStream } from "rethinkdb-ts";
import { SearchEdge } from ".";
import Edge, { getEdgeInstance } from "./edge";

type Validation = Record<Search.EdgeType, [Search.NodeType, Search.NodeType]>;

/**
 * validationRules should be applicable for each node - between open node and close node
 */
const validationRules: Validation = {
  [Search.EdgeType.XHasPropType]: [Search.NodeType.X, Search.NodeType.C],
  [Search.EdgeType.XHasPropValue]: [Search.NodeType.X, Search.NodeType.X],
  [Search.EdgeType.XIsInS]: [Search.NodeType.X, Search.NodeType.S],
  [Search.EdgeType.AIsActionInS]: [Search.NodeType.A, Search.NodeType.S],
  [Search.EdgeType.XIsSubjectInS]: [Search.NodeType.X, Search.NodeType.S],
  [Search.EdgeType.XIsActant1InS]: [Search.NodeType.X, Search.NodeType.S],
  [Search.EdgeType.XIsActant2InS]: [Search.NodeType.X, Search.NodeType.S],
  [Search.EdgeType.SUnderT]: [Search.NodeType.S, Search.NodeType.T],
  [Search.EdgeType.XHasReferenceR]: [Search.NodeType.X, Search.NodeType.R],
  [Search.EdgeType.THasChildT]: [Search.NodeType.T, Search.NodeType.T],
  [Search.EdgeType.XHasSPropTypeC]: [Search.NodeType.X, Search.NodeType.C],
  [Search.EdgeType.XHasSPropValue]: [Search.NodeType.X, Search.NodeType.X],
  [Search.EdgeType.XHasSIdentification]: [Search.NodeType.X, Search.NodeType.X],
  [Search.EdgeType.XHasSClassification]: [Search.NodeType.X, Search.NodeType.C],
  [Search.EdgeType.XHasRelation]: [Search.NodeType.X, Search.NodeType.X],
  [Search.EdgeType.XHasSuperclass]: [Search.NodeType.C, Search.NodeType.C],
  [Search.EdgeType.XHasClassification]: [Search.NodeType.X, Search.NodeType.C],
};

export default class SearchNode implements Search.INode {
  type: Search.NodeType;
  params: Search.INodeParams;
  operator: Search.NodeOperator;
  edges: Edge[];
  results: any;

  constructor(data: Partial<Search.INode>) {
    this.type = data.type || ("" as Search.NodeType);
    this.params = data.params || {};
    this.operator = data.operator || Search.NodeOperator.And;
    this.edges = data.edges
      ? data.edges.map((edgeData) => new SearchEdge(edgeData))
      : [];
  }

  /**
   * adds single edge constructed from parameter object
   * @param edgeData Partial<Search.IEdge>
   * @returns SearchEdge created edge
   */
  addEdge(edgeData: Partial<Search.IEdge>): SearchEdge {
    const edgeInstance = getEdgeInstance(edgeData);
    this.edges.push(edgeInstance);
    return edgeInstance;
  }

  /**
   * Builds & executes the query for this node + joined edges
   * @param db Connection
   * @returns Promise<any>
   */
  async run(db: Connection): Promise<unknown> {
    for (const edge of this.edges) {
      let q: RStream = r.table(Entity.table);
      const searchParams = this.params;
      if (this.params.classes && this.params.classes.length) {
        q = q.filter(function (row: RDatum) {
          return r.expr(searchParams.classes).contains(row("class"));
        });
      }

      if (this.params.id) {
        q = q.filter({ id: this.params.id });
      }
      if (this.params.label) {
        q = q.filter({ label: this.params.label });
      }

      q = edge.run(q);

      this.results = await q.run(db);
    }

    return this.results;
  }

  /**
   * Tests if the node is valid - params & edges should be valid
   * @returns boolean
   */
  isValid(): boolean {
    for (const edge of this.edges) {
      const rule = validationRules[edge.type];

      if (!rule) {
        return false;
      }

      if (rule[0] !== this.type || rule[1] !== edge.node.type) {
        return false;
      }
    }

    return true;
  }
}
