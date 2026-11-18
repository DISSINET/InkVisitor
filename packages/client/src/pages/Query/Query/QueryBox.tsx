import { Query } from "@inkvisitor/shared/types/query";
import React, { useMemo } from "react";
import { useTheme } from "styled-components";
import { INodeItem, QueryValidity } from "../types";
import { QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH, QUERY_PROP_VALUE_X } from "../constants";
import { QueryGridEdge } from "./components/QueryGridEdge";
import { QueryGridNode } from "./components/QueryGridNode";
import { StyledGridCell, StyledQueryBox } from "./QueryBoxStyles";
import { QueryAction } from "./state";
import { edgeTargets, getAllEdges, valueNodeEdge } from "./utils";
import { getEdgeSourceClasses } from "../utils";

interface QueryBoxProps {
  state: Query.INode;
  dispatch: React.Dispatch<QueryAction>;
  isQueryFetching: boolean;
  queryError: Error | null;
  queryStateValidity: QueryValidity;
  onOpenEntityInDetail?: (entityId: string) => void;
}

export const QueryBox: React.FC<QueryBoxProps> = ({
  state,
  dispatch,
  isQueryFetching,
  queryError,
  queryStateValidity,
  onOpenEntityInDetail,
}) => {
  const theme = useTheme();
  const gridWeight = useMemo<number>(() => {
    let maxNodeDepth = 0;

    const traverse = (node: Query.INode, depth: number) => {
      maxNodeDepth = Math.max(maxNodeDepth, depth);

      node.edges.forEach((edge) => {
        edgeTargets(edge).forEach((target) => traverse(target, depth + 1));
      });
    };

    traverse(state, 0);

    return maxNodeDepth;
  }, [state]);

  const allEdges = getAllEdges(state);

  // the edge leading to a node; the value node of an HP: / SP: edge gets that edge as an HP:V
  // edge, with its connector in place of the edge's own controls
  const incomingEdge = (
    nodeId: string | undefined,
  ): { edge: Query.IEdge; isValue: boolean } | undefined => {
    if (!nodeId) {
      return undefined;
    }
    for (const edge of allEdges) {
      if (edge.node.id === nodeId) {
        return { edge, isValue: false };
      }
      if (edge.valueNode?.id === nodeId) {
        return { edge: valueNodeEdge({ ...edge, valueNode: edge.valueNode }), isValue: true };
      }
    }
    return undefined;
  };

  const nodeItems = useMemo<INodeItem[]>(() => {
    const nodeItems: INodeItem[] = [];

    const traverse = (node: Query.INode, depth: number) => {
      nodeItems.push({ ...node, gridX: depth, gridY: nodeItems.length });

      node.edges.forEach((edge) => {
        edgeTargets(edge).forEach((target) => traverse(target, depth + 1));
      });
    };

    traverse(state, 0);

    return nodeItems;
  }, [state]);

  // a parent's children sit on their own rows, but an earlier child's subtree
  // pushes later siblings several rows down - leaving the parent's column empty
  // on the rows in between. To keep the spine connected we (a) extend each
  // non-last sibling's vertical line full height and (b) draw a pass-through
  // vertical line in those empty "gap" rows.
  // The spine leads to each edge's node. The value node of an HP: / SP: edge hangs off a line
  // of its own at QUERY_PROP_VALUE_X, run from that edge's row down to the value node's row,
  // so the two halves of the prop read as one edge and the spine passes them by.
  const spine = useMemo(() => {
    const idToItem = new Map(nodeItems.map((n) => [n.id, n]));
    const extend = new Set<string>();
    const extendNeg = new Set<string>();
    // cellKey -> whether the segment feeds a negative sibling (paint it in the NOT colour)
    const rails = new Map<string, boolean>();
    // cellKey -> the HP: / SP: edge whose value line passes the cell
    const valueRails = new Map<string, Query.IEdge>();
    // nodeId -> whether the first child's edge is negative; a node's own row
    // never has anything drawn in its own column, so without this the spine
    // reads as broken between the node and the branch curve into its first child
    const childStubs = new Map<string, boolean>();

    const isNeg = (e: Query.IEdge) => e.logic === Query.EdgeLogic.Negative;

    const traverse = (node: Query.INode) => {
      if (node.edges.length > 0) {
        childStubs.set(node.id, isNeg(node.edges[0]));
      }
      const colEdge = idToItem.get(node.id)?.gridX ?? 0;
      node.edges.forEach((e) => {
        const typeRow = idToItem.get(e.node.id)?.gridY;
        const valueRow = e.valueNode && idToItem.get(e.valueNode.id)?.gridY;
        if (typeRow === undefined || valueRow === undefined) {
          return;
        }
        for (let r = typeRow + 1; r < valueRow; r++) {
          valueRails.set(`${colEdge}-${r}`, e);
        }
      });
      const children = node.edges
        .map((edge) => ({ edge, key: edge.node.id, row: idToItem.get(edge.node.id)?.gridY }))
        .filter(
          (ci): ci is { edge: Query.IEdge; key: string; row: number } => ci.row !== undefined,
        );
      if (children.length > 1) {

        // each spine segment between two consecutive siblings feeds the lower
        // (next) sibling, so it takes that sibling's colour
        for (let i = 0; i < children.length - 1; i++) {
          const cur = children[i];
          const next = children[i + 1];
          const nextNeg = isNeg(next.edge);

          extend.add(cur.key);
          if (nextNeg) {
            extendNeg.add(cur.key);
          }
          for (let r = cur.row + 1; r < next.row; r++) {
            rails.set(`${colEdge}-${r}`, nextNeg);
          }
        }
      }
      node.edges.forEach((e) => edgeTargets(e).forEach(traverse));
    };
    traverse(state);

    return {
      extendEdgeIds: extend,
      extendNegativeEdgeIds: extendNeg,
      railCells: rails,
      valueRailCells: valueRails,
      nodeChildStubs: childStubs,
    };
  }, [state, nodeItems]);
  const { extendEdgeIds, extendNegativeEdgeIds, railCells, valueRailCells, nodeChildStubs } = spine;

  return (
    <StyledQueryBox $gridWeight={gridWeight} $nodeItems={nodeItems}>
      {[...Array(gridWeight + 1).keys()].map((wi) => {
        return [...Array(nodeItems.length).keys()].map((hi) => {
          const nextCellNode = nodeItems.find((node) => node.gridX === wi + 1 && node.gridY === hi);
          const thisCellNode = nodeItems.find((node) => node.gridX === wi && node.gridY === hi);
          const associated = incomingEdge(thisCellNode?.id);
          const nextCellAssociated = incomingEdge(nextCellNode?.id);

          const railKey = `${wi}-${hi}`;
          const showRail = railCells.has(railKey);
          const railNegative = railCells.get(railKey) === true;
          const valueRailEdge = valueRailCells.get(railKey);
          // NOT on the edge or on its value alone both negate the value line
          const valueRailNegative =
            valueRailEdge?.logic === Query.EdgeLogic.Negative ||
            valueRailEdge?.valueLogic === Query.EdgeLogic.Negative;
          // the value line belongs to one edge, so it takes that edge's colour as its box does:
          // the invalid colour over the grey of NOT
          const valueRailInvalid =
            !!valueRailEdge &&
            queryStateValidity.problems.some(
              (problem) => problem.source === valueRailEdge.id && !problem.warning,
            );

          const showChildStub = !!thisCellNode && nodeChildStubs.has(thisCellNode.id);
          const childStubNegative = !!thisCellNode && nodeChildStubs.get(thisCellNode.id) === true;

          return (
            <StyledGridCell
              key={`${wi}-${hi}`}
              $column={wi + 1}
              $row={hi + 1}
              $hasNode={!!thisCellNode}
            >
              {showRail && (
                <svg
                  width={QUERY_GRID_WIDTH}
                  height={QUERY_GRID_HEIGHT}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                  }}
                >
                  <line
                    x1={20}
                    x2={20}
                    y1={0}
                    y2={QUERY_GRID_HEIGHT}
                    stroke={railNegative ? theme.color.queryNegative : theme.color.query2}
                    strokeWidth={3}
                    strokeDasharray={railNegative ? "6 4" : undefined}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {valueRailEdge && (
                <svg
                  width={QUERY_GRID_WIDTH}
                  height={QUERY_GRID_HEIGHT}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                  }}
                >
                  <line
                    x1={QUERY_PROP_VALUE_X}
                    x2={QUERY_PROP_VALUE_X}
                    y1={0}
                    y2={QUERY_GRID_HEIGHT}
                    stroke={
                      valueRailInvalid
                        ? theme.color.queryInvalid
                        : valueRailNegative
                          ? theme.color.queryNegative
                          : theme.color.query2
                    }
                    strokeWidth={3}
                    strokeDasharray={valueRailNegative ? "6 4" : undefined}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {showChildStub && (
                <svg
                  width={QUERY_GRID_WIDTH}
                  height={QUERY_GRID_HEIGHT}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                  }}
                >
                  <line
                    x1={20}
                    x2={20}
                    y1={QUERY_GRID_HEIGHT - 8}
                    y2={QUERY_GRID_HEIGHT}
                    stroke={childStubNegative ? theme.color.queryNegative : theme.color.query2}
                    strokeWidth={3}
                    strokeDasharray={childStubNegative ? "6 4" : undefined}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {thisCellNode && (
                <QueryGridNode
                  node={thisCellNode}
                  sourceClasses={associated && getEdgeSourceClasses(state, associated.edge.id)}
                  isRoot={wi === 0}
                  dispatch={dispatch}
                  edge={associated?.edge}
                  isValueNode={associated?.isValue}
                  problems={queryStateValidity.problems.filter(
                    (problem) => problem.source === thisCellNode.id,
                  )}
                  onOpenEntityInDetail={onOpenEntityInDetail}
                />
              )}
              {nextCellNode && nextCellAssociated && (
                <QueryGridEdge
                  node={nextCellNode}
                  rootNode={state}
                  isRootEdge={wi === 0}
                  dispatch={dispatch}
                  edge={nextCellAssociated.edge}
                  isValueConnector={nextCellAssociated.isValue}
                  extendVertical={extendEdgeIds.has(nextCellNode.id)}
                  extendNegative={extendNegativeEdgeIds.has(nextCellNode.id)}
                  // a value connector carries its edge's id, so an invalid edge colours it too
                  problems={queryStateValidity.problems.filter(
                    (problem) => problem.source === nextCellAssociated.edge.id,
                  )}
                  onOpenEntityInDetail={onOpenEntityInDetail}
                />
              )}
            </StyledGridCell>
          );
        });
      })}
    </StyledQueryBox>
  );
};

export const MemoizedQueryBox = React.memo(QueryBox);
