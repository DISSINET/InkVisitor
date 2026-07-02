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
   * Combines a list of edges over a base stream into a single id set,
   * preserving the node operator: AND -> intersection, OR -> union. A Positive
   * edge contributes the ids matching its condition; a Negative edge
   * contributes the ids that do NOT match it.
   *
   * AND is evaluated as a narrowing pipeline: every edge after the first runs
   * only over the survivors so far (`getAll` of the running accumulator), so
   * the working set shrinks monotonically and later edges never re-scan the
   * full base. Because each edge is a per-entity predicate (the "subset
   * invariant" negation already relies on), restricting the input to the
   * survivors yields exactly the same set as intersecting full-base matches.
   *
   * The full base id list is materialised lazily and only when actually needed
   * - a Negative edge before any positive has seeded the set, or an OR node
   * that contains a negative edge. AND negations are taken against the running
   * accumulator, so the common (positive-seeded) case never fetches it.
   *
   * @param baseIdsKnown optional precomputed base ids (the caller already
   * materialised the stream's ids, e.g. nested edges reusing the parent match)
   */
  private async evaluateEdges(
    db: Connection,
    baseStream: RStream,
    edges: Edge[],
    operator: Query.NodeOperator,
    baseIdsKnown?: string[]
  ): Promise<string[]> {
    let baseIdsCache: string[] | null = baseIdsKnown ?? null;
    const getBaseIds = async (): Promise<string[]> => {
      if (baseIdsCache === null) {
        baseIdsCache = (await baseStream
          .getField("id")
          .distinct()
          .run(db)) as string[];
      }
      return baseIdsCache;
    };

    if (operator !== Query.NodeOperator.And) {
      // OR: each edge is evaluated independently over the base, then unioned
      const baseIds = edges.some(
        (e) => e.logic === Query.EdgeLogic.Negative
      )
        ? await getBaseIds()
        : [];
      const acc = new Set<string>();
      for (const edge of edges) {
        const matchIds = await this.resolveEdgeMatch(db, baseStream, edge);
        if (edge.logic === Query.EdgeLogic.Negative) {
          const matchSet = new Set<string>(matchIds);
          for (const id of baseIds) {
            if (!matchSet.has(id)) {
              acc.add(id);
            }
          }
        } else {
          for (const id of matchIds) {
            acc.add(id);
          }
        }
      }
      return Array.from(acc);
    }

    // AND: narrowing pipeline. `acc === null` means "universe" (no edge applied
    // yet) so the first edge runs over the full base stream.
    let acc: Set<string> | null = null;
    for (const edge of edges) {
      const inputStream =
        acc === null
          ? baseStream
          : r.table(Entity.table).getAll(r.args(Array.from(acc)));

      const matchIds = await this.resolveEdgeMatch(db, inputStream, edge);

      if (edge.logic === Query.EdgeLogic.Negative) {
        const matchSet = new Set<string>(matchIds);
        const universe: string[] =
          acc === null ? await getBaseIds() : Array.from(acc);
        acc = new Set(universe.filter((id: string) => !matchSet.has(id)));
      } else {
        // positive: matchIds is already restricted to the current survivors
        acc = new Set<string>(matchIds);
      }

      if (acc.size === 0) {
        break; // an empty intersection stays empty - skip the remaining edges
      }
    }

    return acc === null ? await getBaseIds() : Array.from(acc);
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
    await edge.prepare(db);
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
