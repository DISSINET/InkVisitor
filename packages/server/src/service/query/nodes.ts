import Entity from "@models/entity/entity";
import { IEntity } from "@inkvisitor/shared/types";
import { Connection, r, RDatum, RStream } from "rethinkdb-ts";
import { Results, SearchEdge } from ".";
import Edge, { getEdgeInstance } from "./edge";
import { Query } from "@inkvisitor/shared/types/query";

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
   * Builds the base entity stream for this node from its own params
   * (entityClasses / entityId / label). Nested child-node params are NOT
   * applied here - they describe the target of the parent edge and are
   * consumed by that edge, not used to filter the entity stream.
   */
  private baseStream(): RStream {
    let q: RStream = r.table(Entity.table);
    if (this.params.entityClasses?.length) {
      const classes = this.params.entityClasses;
      q = q.filter(function (row: RDatum) {
        return r.expr(classes).contains(row("class"));
      });
    }
    if (this.params.entityId) {
      q = q.filter({ id: this.params.entityId });
    }
    if (this.params.label) {
      q = q.filter({ label: this.params.label });
    }
    return q;
  }

  /**
   * Builds & executes the query for this node + joined edges.
   * Each edge produces a result set (subset of the base set); the sets bubble
   * up and are combined per the node operator (AND = intersection,
   * OR = union). Edges whose target node carries its own edges are resolved
   * recursively, so nesting of arbitrary depth is supported.
   * @param db Connection
   * @returns Promise<Results<IEntity>>
   */
  async run(db: Connection): Promise<Results<IEntity>> {
    const baseStream = this.baseStream();

    let ids: string[];
    if (!this.edges.length) {
      ids = await baseStream.getField("id").distinct().run(db);
    } else {
      ids = await this.evaluateEdges(
        db,
        baseStream,
        this.edges,
        this.operator
      );
    }

    this.results.items = ids;
    return this.results;
  }

  /**
   * Combines a list of edges over a base stream into a single id set.
   * AND -> intersection of every edge's contribution, OR -> union.
   * A Positive edge contributes the ids matching its condition; a Negative
   * edge contributes the base ids that do NOT match it (base minus matches).
   * @param baseIdsKnown optional precomputed base ids (avoids a round-trip
   * when the caller already materialised the stream's ids)
   */
  private async evaluateEdges(
    db: Connection,
    baseStream: RStream,
    edges: Edge[],
    operator: Query.NodeOperator,
    baseIdsKnown?: string[]
  ): Promise<string[]> {
    const baseIds =
      baseIdsKnown ?? (await baseStream.getField("id").distinct().run(db));
    const isAnd = operator === Query.NodeOperator.And;

    let acc: Set<string> = isAnd ? new Set(baseIds) : new Set<string>();

    for (const edge of edges) {
      const matchIds = await this.resolveEdgeMatch(db, baseStream, edge);
      const matchSet = new Set<string>(matchIds);

      const contributing =
        edge.logic === Query.EdgeLogic.Negative
          ? baseIds.filter((id: string) => !matchSet.has(id))
          : matchIds;

      if (isAnd) {
        const contributingSet = new Set<string>(contributing);
        acc = new Set([...acc].filter((id: string) => contributingSet.has(id)));
      } else {
        for (const id of contributing) {
          acc.add(id);
        }
      }
    }

    return Array.from(acc);
  }

  /**
   * Resolves the ids (subset of baseStream) that satisfy a single edge,
   * including any conditions nested under the edge's target node. The edge's
   * own condition is matched first; if the target node has its own edges, they
   * are evaluated recursively over just the matched entities, so nested
   * constraints further narrow (or widen, via OR) the result.
   */
  private async resolveEdgeMatch(
    db: Connection,
    baseStream: RStream,
    edge: SearchEdge
  ): Promise<string[]> {
    const directIds = await edge.run(baseStream).distinct().run(db);

    const childNode = edge.node;
    if (!childNode.edges.length || directIds.length === 0) {
      return directIds;
    }

    // restrict the recursion to entities that matched this edge, then apply the
    // child node's own edges (the child node params themselves were already
    // consumed by this edge, so they are not re-applied as a filter)
    const childStream = r.table(Entity.table).getAll(r.args(directIds));
    return childNode.evaluateEdges(
      db,
      childStream,
      childNode.edges,
      childNode.operator,
      directIds
    );
  }

  // TODO: checking only edge validity
  /**
   * Tests if the node is valid - params & edges should be valid
   * @returns boolean
   */
  isValid(): boolean {
    return true;
  }
}
