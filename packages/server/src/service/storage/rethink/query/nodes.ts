import { Connection, r, RDatum, RStream } from "rethinkdb-ts";
import { Query } from "@inkvisitor/shared/types/query";
import { nodeLabel } from "../../../../common/searchLabel";
import { Conn, ExplorePlan, ExploreResolvers } from "../../types";
import { unwrap } from "../conn";
import { searchWordByWord } from "../search";
import { TABLE } from "../tables";
import SearchEdge, { getEdgeInstance } from "./edge";
import { auditAndCoOccurrenceIds, withinIds } from "./filters";
import { QUERY_RUN_OPTIONS } from "./run-options";

export default class SearchNode implements Query.INode, ExplorePlan {
  type: Query.NodeType;
  params: Query.INodeParams;
  operator: Query.NodeOperator;
  id: string;
  edges: SearchEdge[];

  constructor(data: Partial<Query.INode>, resolvers?: ExploreResolvers) {
    this.type = data.type || ("" as Query.NodeType);
    this.params = data.params || {};
    this.operator = data.operator || Query.NodeOperator.And;
    this.edges = data.edges
      ? data.edges.map((edgeData) => getEdgeInstance(edgeData))
      : [];
    this.id = data.id || "";
    if (resolvers) {
      this.setResolvers(resolvers);
    }
  }

  /** hands the id expansion down to every edge and nested node */
  setResolvers(resolvers: ExploreResolvers): void {
    for (const edge of this.edges) {
      edge.setResolvers(resolvers);
    }
  }

  addEdge(edgeData: Partial<Query.IEdge>): SearchEdge {
    const edgeInstance = getEdgeInstance(edgeData);
    this.edges.push(edgeInstance);
    return edgeInstance;
  }

  /**
   * Builds the base entity stream for this node from its own params
   * (entityClasses / entityStatuses / entityLanguages / entityId / label). Nested child-node params are NOT
   * applied here - they describe the target of the parent edge and are
   * consumed by that edge, not used to filter the entity stream.
   */
  private baseStream(): RStream {
    let q: RStream = r.table(TABLE.entities);
    if (this.params.entityClasses?.length) {
      const classes = this.params.entityClasses;
      q = q.filter(function (row: RDatum) {
        return r.expr(classes).contains(row("class"));
      });
    }
    if (this.params.entityStatuses?.length) {
      const statuses = this.params.entityStatuses;
      q = q.filter(function (row: RDatum) {
        return r.expr(statuses).contains(row("status"));
      });
    }
    if (this.params.entityLanguages?.length) {
      const languages = this.params.entityLanguages;
      q = q.filter(function (row: RDatum) {
        return r.expr(languages).contains(row("language"));
      });
    }
    if (this.params.entityId) {
      q = q.filter({ id: this.params.entityId });
    }
    const label = nodeLabel(this.params.label);
    if (label) {
      q = q.filter((row: RDatum) => searchWordByWord(row, ...label));
    }
    return q;
  }

  /**
   * Builds & executes the query for this node + joined edges.
   * Each edge produces a result set (subset of the base set); the sets bubble
   * up and are combined per the node operator (AND = intersection,
   * OR = union). Edges whose target node carries its own edges are resolved
   * recursively, so nesting of arbitrary depth is supported.
   * @param conn storage connection
   * @returns matching entity ids
   */
  async run(conn: Conn): Promise<string[]> {
    const db = unwrap(conn);
    const filtered = await auditAndCoOccurrenceIds(db, this.params);
    return this.match(db, withinIds(this.baseStream(), filtered));
  }

  /** ids of the entities in `stream` meeting this node's edges */
  async match(db: Connection, stream: RStream): Promise<string[]> {
    if (!this.edges.length) {
      return stream.getField("id").distinct().run(db, QUERY_RUN_OPTIONS) as Promise<string[]>;
    }
    return this.evaluateEdges(db, stream, this.edges, this.operator);
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
   */
  private async evaluateEdges(
    db: Connection,
    baseStream: RStream,
    edges: SearchEdge[],
    operator: Query.NodeOperator
  ): Promise<string[]> {
    let baseIdsCache: string[] | null = null;
    const getBaseIds = async (): Promise<string[]> => {
      if (baseIdsCache === null) {
        baseIdsCache = (await baseStream
          .getField("id")
          .distinct()
          .run(db, QUERY_RUN_OPTIONS)) as string[];
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
          : r.table(TABLE.entities).getAll(r.args(Array.from(acc)));

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
   * Resolves the ids (subset of baseStream) that satisfy a single edge. The
   * conditions nested under the edge's target node narrow the target's own
   * entities, which prepare() resolves before the edge matches against them.
   */
  private async resolveEdgeMatch(
    db: Connection,
    baseStream: RStream,
    edge: SearchEdge
  ): Promise<string[]> {
    await edge.prepare(db);
    return edge.run(baseStream).distinct().run(db, QUERY_RUN_OPTIONS);
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
