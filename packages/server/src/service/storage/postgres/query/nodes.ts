import { Query } from "@inkvisitor/shared/types/query";
import { TABLE } from "../../names";
import { Conn, ExplorePlan, ExploreResolvers } from "../../types";
import { Params, ident } from "../sql";
import { q } from "../tables";
import SearchEdge, { getEdgeInstance } from "./edges";

/** the rows an edge runs over: the node's own params, or the ids earlier edges left */
export type Input = { kind: "base"; params: Query.INodeParams } | { kind: "ids"; ids: string[] };

/** WHERE fragment over alias `e` selecting the input rows */
export function inputWhere(input: Input, p: Params): string {
  if (input.kind === "ids") {
    return `e.id = ANY(${p.add(input.ids)}::text[])`;
  }
  const { entityClasses, entityStatuses, entityId, label } = input.params;
  const where: string[] = [];
  if (entityClasses?.length) {
    where.push(`e.class = ANY(${p.add(entityClasses)}::text[])`);
  }
  if (entityStatuses?.length) {
    where.push(`e.status = ANY(${p.add(entityStatuses)}::text[])`);
  }
  if (entityId) {
    where.push(`e.id = ${p.add(entityId)}`);
  }
  // entities carry `labels`, not `label`, so this matches nothing; RethinkDB filters the same field
  if (label) {
    where.push(`e.doc->>'label' = ${p.add(label)}`);
  }
  return where.length ? where.join(" AND ") : "TRUE";
}

/**
 * the order of every id list the evaluator reads, which the node operators
 * carry through: ReQL distinct() returns its ids sorted by code point, and the
 * explore stats view returns the list unsorted and caps it by position
 */
export const ID_ORDER = `ORDER BY e.id COLLATE "C"`;

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
    this.edges = data.edges ? data.edges.map((edgeData) => getEdgeInstance(edgeData)) : [];
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

  private async selectIds(conn: Conn, input: Input): Promise<string[]> {
    const p = new Params();
    const res = await q(conn, `SELECT e.id FROM ${ident(TABLE.entities)} e WHERE ${inputWhere(input, p)} ${ID_ORDER}`, p.list);
    return res.rows.map((row: { id: string }) => row.id);
  }

  /**
   * Evaluates this node and its edges.
   * @returns matching entity ids
   */
  async run(conn: Conn): Promise<string[]> {
    const base: Input = { kind: "base", params: this.params };
    if (!this.edges.length) {
      return this.selectIds(conn, base);
    }
    return this.evaluateEdges(conn, base, this.edges, this.operator);
  }

  /**
   * Combines a list of edges over an input into a single id set,
   * preserving the node operator: AND -> intersection, OR -> union. A Positive
   * edge contributes the ids matching its condition; a Negative edge
   * contributes the ids that do NOT match it.
   *
   * AND is evaluated as a narrowing pipeline: every edge after the first runs
   * only over the survivors so far (an id-list input, `e.id = ANY(...)` of the
   * running accumulator), so the working set shrinks monotonically and later
   * edges never re-scan the full base. Because each edge is a per-entity predicate (the "subset
   * invariant" negation already relies on), restricting the input to the
   * survivors yields exactly the same set as intersecting full-base matches.
   *
   * The full base id list is materialised lazily and only when actually needed
   * - a Negative edge before any positive has seeded the set, or an OR node
   * that contains a negative edge. AND negations are taken against the running
   * accumulator, so the common (positive-seeded) case never fetches it.
   *
   * @param baseIdsKnown optional precomputed base ids (the caller already
   * materialised the input's ids, e.g. nested edges reusing the parent match)
   */
  private async evaluateEdges(
    conn: Conn,
    input: Input,
    edges: SearchEdge[],
    operator: Query.NodeOperator,
    baseIdsKnown?: string[]
  ): Promise<string[]> {
    let baseIdsCache: string[] | null = baseIdsKnown ?? null;
    const getBaseIds = async (): Promise<string[]> => {
      if (baseIdsCache === null) {
        baseIdsCache = await this.selectIds(conn, input);
      }
      return baseIdsCache;
    };

    if (operator !== Query.NodeOperator.And) {
      // OR: each edge is evaluated independently over the base, then unioned
      const baseIds = edges.some((e) => e.logic === Query.EdgeLogic.Negative) ? await getBaseIds() : [];
      const acc = new Set<string>();
      for (const edge of edges) {
        const matchIds = await this.resolveEdgeMatch(conn, input, edge);
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
    // yet) so the first edge runs over the full base.
    let acc: Set<string> | null = null;
    for (const edge of edges) {
      const edgeInput: Input = acc === null ? input : { kind: "ids", ids: Array.from(acc) };
      const matchIds = await this.resolveEdgeMatch(conn, edgeInput, edge);

      if (edge.logic === Query.EdgeLogic.Negative) {
        const matchSet = new Set<string>(matchIds);
        const universe: string[] = acc === null ? await getBaseIds() : Array.from(acc);
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
   * Resolves the ids (subset of `input`) that satisfy a single edge,
   * including any conditions nested under the edge's target node. The edge's
   * own condition is matched first; if the target node has its own edges, they
   * are evaluated recursively over just the matched entities, so nested
   * constraints further narrow (or widen, via OR) the result.
   */
  private async resolveEdgeMatch(conn: Conn, input: Input, edge: SearchEdge): Promise<string[]> {
    await edge.prepare(conn);
    const directIds = await edge.run(conn, input);

    const childNode = edge.node;
    if (!childNode.edges.length || directIds.length === 0) {
      return directIds;
    }

    // restrict the recursion to entities that matched this edge, then apply the
    // child node's own edges (the child node params themselves were already
    // consumed by this edge, so they are not re-applied as a filter)
    return childNode.evaluateEdges(conn, { kind: "ids", ids: directIds }, childNode.edges, childNode.operator, directIds);
  }

  /**
   * Tests if the node is valid - params & edges should be valid
   * @returns boolean
   */
  isValid(): boolean {
    return true;
  }
}
