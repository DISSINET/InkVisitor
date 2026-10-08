import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation } from "@inkvisitor/shared/types";
import { unique } from "./helpers";

// Bounds one forward walk through the database; a deeper tree is left
// unchecked here and the server's own loop check still guards the write.
export const MAX_LOADED_NODES = 300;

/** Directed graph of relation edges (entityIds[0] → entityIds[1]). */
export class EdgeGraph {
  private readonly next = new Map<string, string[]>();

  addEdge(from: string, to: string) {
    const targets = this.next.get(from) ?? [];
    if (!targets.includes(to)) {
      targets.push(to);
      this.next.set(from, targets);
    }
  }

  successors(node: string): string[] {
    return this.next.get(node) ?? [];
  }

  /** Shortest path from `from` to `to` as the list of its nodes, or null. */
  findPath(from: string, to: string): string[] | null {
    const previous = new Map<string, string | null>([[from, null]]);
    const queue = [from];

    while (queue.length) {
      const node = queue.shift()!;
      if (node === to) {
        const path = [node];
        let step = previous.get(node);
        while (step) {
          path.unshift(step);
          step = previous.get(step);
        }
        return path;
      }
      for (const target of this.successors(node)) {
        if (!previous.has(target)) {
          previous.set(target, node);
          queue.push(target);
        }
      }
    }

    return null;
  }
}

export type ForwardRelationsFetcher = (
  entityId: string,
  type: RelationEnums.Type
) => Promise<Relation.IRelation[]>;

/** Adds the database edges of one type that leave `entityId`. */
export const addForwardEdges = async (
  graph: EdgeGraph,
  type: RelationEnums.Type,
  entityId: string,
  fetchForward: ForwardRelationsFetcher
) => {
  const relations = await fetchForward(entityId, type);
  relations
    .filter((relation) => relation.type === type && relation.entityIds[0] === entityId)
    .forEach((relation) => graph.addEdge(entityId, relation.entityIds[1]));
};

/**
 * Adds every database edge of `type` reachable forward from `startIds`, one
 * level of the walk per round of parallel requests. Entities of the input are
 * not in the database yet, so only their edges already in the graph are
 * followed.
 * @returns false when the walk stopped at MAX_LOADED_NODES
 */
export const loadForwardClosure = async (
  graph: EdgeGraph,
  type: RelationEnums.Type,
  startIds: string[],
  isNew: (entityId: string) => boolean,
  fetchForward: ForwardRelationsFetcher
): Promise<boolean> => {
  const visited = new Set<string>();
  let frontier = unique(startIds);

  while (frontier.length) {
    frontier.forEach((entityId) => visited.add(entityId));
    if (visited.size > MAX_LOADED_NODES) {
      return false;
    }

    await Promise.all(
      frontier
        .filter((entityId) => !isNew(entityId))
        .map((entityId) => addForwardEdges(graph, type, entityId, fetchForward))
    );

    frontier = unique(frontier.flatMap((entityId) => graph.successors(entityId))).filter(
      (entityId) => !visited.has(entityId)
    );
  }

  return true;
};
