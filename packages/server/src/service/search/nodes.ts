import Entity from "@models/entity/entity";
import { IEntity, Search } from "@shared/types";
import { Connection, r, RDatum } from "rethinkdb-ts";
import { SearchEdge } from ".";

export default class SearchNode implements Search.INode {
  type: Search.NodeType;
  params: Search.INodeParams;
  operator: Search.NodeOperator;
  edges: Search.IEdge[];
  results: any;

  constructor(data: Partial<Search.INode>) {
    this.type = data.type || ("" as Search.NodeType);
    this.params = data.params || {};
    this.operator = data.operator || Search.NodeOperator.And;
    this.edges = data.edges
      ? data.edges.map((edgeData) => new SearchEdge(edgeData))
      : [];
  }

  addEdge(edgeData: Partial<Search.IEdge>): void {
    this.edges.push(new SearchEdge(edgeData));
  }

  async run(db: Connection): Promise<any> {
    let q = r.table(Entity.table);
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

    this.results = await q.run(db);
    return this.results;
  }
}
