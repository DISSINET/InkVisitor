import Entity from "@models/entity/entity";
import { IEntity, Query } from "@shared/types";
import { Connection, r, RDatum, RStream } from "rethinkdb-ts";
import { Results, SearchEdge } from ".";
import Edge, { getEdgeInstance } from "./edge";

export default class SearchNode implements Query.INode {
  type: Query.NodeType;
  params: Query.INodeParams;
  operator: Query.NodeOperator;
  id: string;
  edges: Edge[];
  results: Results<IEntity>;

  constructor(data: Partial<Query.INode>) {
    this.type = data.type || ("" as Query.NodeType);
    this.params = data.params || {};
    this.operator = data.operator || Query.NodeOperator.And;
    this.edges = data.edges
      ? data.edges.map((edgeData) => getEdgeInstance(edgeData))
      : [];
    this.id = data.id || "";
    this.results = new Results();
  }

  /**
   * adds single edge constructed from parameter object
   * @param edgeData Partial<Query.IEdge>
   * @returns SearchEdge created edge
   */
  addEdge(edgeData: Partial<Query.IEdge>): SearchEdge {
    const edgeInstance = getEdgeInstance(edgeData);
    this.edges.push(edgeInstance);
    return edgeInstance;
  }

  /**
   * Builds & executes the query for this node + joined edges
   * @param db Connection
   * @returns Promise<any>
   */
  async run(db: Connection): Promise<Results<IEntity>> {
    if (!this.edges.length) {
      await this.runSingleBatch(db, this);
    } else {
      for (const edge of this.edges) {
        await this.runSingleBatch(db, this, edge);
      }
    }

    return this.results;
  }

  async runSingleBatch(
    db: Connection,
    node: SearchNode,
    edge?: SearchEdge
  ): Promise<void> {
    let q: RStream = r.table(Entity.table);
    if (node.params.classes?.length) {
      q = q.filter(function (row: RDatum) {
        return r.expr(node.params.classes).contains(row("class"));
      });
    }

    if (this.params.id) {
      q = q.filter({ id: this.params.id });
    }
    if (this.params.label) {
      q = q.filter({ label: this.params.label });
    }

    // processing could be done solely on params
    if (edge) {
      q = edge.run(q);
    }

    console.log(q.toString());

    const edgeResults = await q.distinct().run(db);

    if (this.operator === Query.NodeOperator.And) {
      this.results.addAnd(edgeResults);
    } else {
      this.results.addOr(edgeResults);
    }
  }

  /**
   * Tests if the node is valid - params & edges should be valid
   * @returns boolean
   */
  isValid(): boolean {
    for (const edge of this.edges) {
      const rule = Query.EdgeTypeNodeRules[edge.type];
      if (!rule) {
        return false;
      }

      if (rule[0] === Query.NodeType.X || this.type === Query.NodeType.X) {
        // if source is X or node is X
      } else if (rule[0] !== this.type) {
        return false;
      }
    }

    return true;
  }
}
