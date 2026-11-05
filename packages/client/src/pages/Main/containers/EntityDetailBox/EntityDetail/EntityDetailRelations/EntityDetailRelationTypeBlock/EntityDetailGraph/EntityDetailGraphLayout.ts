import { IResponseDetail, Relation } from "@inkvisitor/shared/types";
import { Edge, MarkerType, Node, Position } from "reactflow";

interface Graph {
  nodes: Node[];
  edges: Edge[];
  maxHeight: number;
}

const permutations = <T>(items: T[]): T[][] =>
  items.length <= 1
    ? [items]
    : items.flatMap((item, i) =>
        permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
      );

// columns larger than this keep the order by parent, trying every order is too slow
const MAX_REORDERED_COLUMN = 7;

/**
 * Picks the row of every node within its column: next to the entities it
 * hangs off in the column before, and with the entities of one column that are
 * linked to each other next to each other, so few edges need an arc.
 * @returns row index of each node id within its column
 */
export const orderColumns = (columns: string[][], edges: Edge[]): Record<string, number> => {
  const rows: Record<string, number> = {};
  const neighbours = (id: string) =>
    edges.flatMap((e) => (e.source === id ? [e.target] : e.target === id ? [e.source] : []));

  columns.forEach((column, level) => {
    const previous = columns[level - 1] ?? [];
    const parentRow = (id: string) => {
      const parentRows = neighbours(id)
        .filter((n) => previous.includes(n))
        .map((n) => rows[n]);
      return parentRows.length
        ? parentRows.reduce((sum, row) => sum + row, 0) / parentRows.length
        : 0;
    };
    const byParent = [...column].sort((a, b) => parentRow(a) - parentRow(b));
    const sameColumnLinks = edges.filter(
      (e) => column.includes(e.source) && column.includes(e.target)
    );

    let best = byParent;
    if (sameColumnLinks.length && column.length <= MAX_REORDERED_COLUMN) {
      // linked neighbours count far more than staying in the order by parent
      const cost = (order: string[]) =>
        sameColumnLinks.reduce(
          (sum, e) => sum + Math.abs(order.indexOf(e.source) - order.indexOf(e.target)),
          0
        ) *
          column.length *
          column.length +
        order.reduce((sum, id, row) => sum + Math.abs(row - byParent.indexOf(id)), 0);
      let bestCost = cost(best);
      for (const order of permutations(byParent)) {
        const orderCost = cost(order);
        if (orderCost < bestCost) {
          best = order;
          bestCost = orderCost;
        }
      }
    }
    best.forEach((id, row) => {
      rows[id] = row;
    });
  });
  return rows;
};

export const convertToGraph = (
  entity: IResponseDetail,
  relations: Relation.IConnection<Relation.IRelation>[],
  entities: any,
  nodeW: number,
  nodeH: number,
  asymmetrical: boolean
): Graph => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const addNode = (entityId: string, level: number) => {
    if (!nodes.map((n) => n.id).includes(entityId)) {
      const entity = entities[entityId];

      nodes.push({
        id: entityId,
        type: "entityNode",
        data: { entity: entity, level: level },
        position: { x: level * nodeW, y: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        dragHandle: ".custom-drag-handle",
      });
    }
  };
  const addEdge = (
    sourceId: string,
    targetId: string,
    branch: Relation.IConnection<Relation.IRelation, Relation.IRelation>
  ) => {
    // a symmetrical relation reads the same both ways, so B -> A repeats A -> B
    const drawn = edges.some(
      (e) =>
        (e.source === sourceId && e.target === targetId) ||
        (!asymmetrical && e.source === targetId && e.target === sourceId)
    );
    if (!drawn) {
      edges.push({
        id: String(edges.length),
        type: "relationship",
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          certainty:
            (
              branch as Relation.IConnection<
                Relation.IIdentification,
                Relation.IIdentification
              >
            ).certainty ?? undefined,
          relationType: branch.type,
        },
        style: {
          strokeWidth: 1,
          stroke: "black",
        },
        source: sourceId,
        target: targetId,
      });
    }
  };

  addNode(entity.id, 0);

  // a node keeps the level it is first placed at, so the tree is walked level
  // by level: every entity lands at its shortest distance from the root
  type Branch = Relation.IConnection<Relation.IRelation, Relation.IRelation>;
  let level = 1;
  let frontier: { sourceId: string; branch: Branch }[] = relations.map((branch) => ({
    sourceId: entity.id,
    branch,
  }));
  while (frontier.length) {
    const next: typeof frontier = [];
    for (const { sourceId, branch } of frontier) {
      const [sourceEntityId, targetEntityId] =
        sourceId === branch.entityIds[0]
          ? branch.entityIds
          : [branch.entityIds[1], branch.entityIds[0]];

      addNode(targetEntityId, level);
      addEdge(sourceEntityId, targetEntityId, branch);
      for (const subtree of branch.subtrees ?? []) {
        next.push({ sourceId: targetEntityId, branch: subtree });
      }
    }
    frontier = next;
    level += 1;
  }

  const columns: string[][] = [];
  nodes.forEach((node) => {
    columns[node.data.level] = [...(columns[node.data.level] ?? []), node.id];
  });
  const rows = orderColumns(columns, edges);
  const maxOnLevel = Math.max(...columns.map((column) => column.length));

  const nodesWithY: Node[] = nodes.map((node) => {
    const columnSize = columns[node.data.level].length;
    const y = (rows[node.id] - (columnSize - 1) / 2) * nodeH;
    return { ...node, position: { x: node.position.x, y } };
  });

  // an edge within one column runs straight between neighbours, and as an arc
  // on the right side between nodes further apart so it passes no node
  const nodeById = Object.fromEntries(nodesWithY.map((node) => [node.id, node]));
  const edgesWithHandles: Edge[] = edges.map((edge) => {
    const source = nodeById[edge.source];
    const target = nodeById[edge.target];
    if (source.data.level !== target.data.level) {
      return { ...edge, sourceHandle: "source-right", targetHandle: "target-left" };
    }
    if (Math.abs(source.position.y - target.position.y) > nodeH) {
      return {
        ...edge,
        sourceHandle: "source-right",
        targetHandle: "target-right",
        data: { ...edge.data, arc: true },
      };
    }
    return source.position.y < target.position.y
      ? { ...edge, sourceHandle: "source-bottom", targetHandle: "target-top" }
      : { ...edge, sourceHandle: "source-top", targetHandle: "target-bottom" };
  });

  return { nodes: nodesWithY, edges: edgesWithHandles, maxHeight: (maxOnLevel + 1) * nodeH };
};
