import { Query } from "@inkvisitor/shared/types/query";
import React, { useMemo } from "react";
import { useTheme } from "styled-components";
import { INodeItem, QueryValidity } from "../types";
import { QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH } from "../constants";
import { QueryGridEdge } from "./components/QueryGridEdge";
import { QueryGridNode } from "./components/QueryGridNode";
import { StyledQueryBox } from "./QueryBoxStyles";
import { QueryAction } from "./state";
import { getAllEdges, getAllNodes } from "./utils";

interface QueryBoxProps {
  state: Query.INode;
  dispatch: React.Dispatch<QueryAction>;
  isQueryFetching: boolean;
  queryError: Error | null;
  queryStateValidity: QueryValidity;
  onOpenEntityInDetail?: (entityId: string) => void;
  // page-level expansion options (#2969), forwarded to each node's entity picker
  includeEquivalents?: boolean;
  includeSubordinates?: boolean;
}

export const QueryBox: React.FC<QueryBoxProps> = ({
  state,
  dispatch,
  isQueryFetching,
  queryError,
  queryStateValidity,
  onOpenEntityInDetail,
  includeEquivalents = false,
  includeSubordinates = false,
}) => {
  const theme = useTheme();
  const gridWeight = useMemo<number>(() => {
    let maxNodeDepth = 1;

    const traverse = (node: Query.INode, depth: number) => {
      maxNodeDepth = Math.max(maxNodeDepth, depth);

      node.edges.forEach((edge) => {
        traverse(edge.node, depth + 1);
      });
    };

    traverse(state, 0);

    return maxNodeDepth;
  }, [state]);

  const allEdges = getAllEdges(state);
  const allNodes = getAllNodes(state);

  const nodeItems = useMemo<INodeItem[]>(() => {
    const nodeItems: INodeItem[] = [];

    const traverse = (node: Query.INode, depth: number) => {
      nodeItems.push({ ...node, gridX: depth, gridY: nodeItems.length });

      node.edges.forEach((edge, index) => {
        traverse(edge.node, depth + 1);
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
  const { extendEdgeIds, extendNegativeEdgeIds, railCells } = useMemo(() => {
    const idToItem = new Map(nodeItems.map((n) => [n.id, n]));
    const extend = new Set<string>();
    const extendNeg = new Set<string>();
    // cellKey -> whether the segment feeds a negative sibling (paint it red)
    const rails = new Map<string, boolean>();

    const isNeg = (e: Query.IEdge) => e.logic === Query.EdgeLogic.Negative;

    const traverse = (node: Query.INode) => {
      if (node.edges.length > 1) {
        const colEdge = idToItem.get(node.id)?.gridX ?? 0;
        const children = node.edges
          .map((e) => ({ edge: e, row: idToItem.get(e.node.id)?.gridY }))
          .filter(
            (ci): ci is { edge: Query.IEdge; row: number } =>
              ci.row !== undefined
          );

        // each spine segment between two consecutive siblings feeds the lower
        // (next) sibling, so it takes that sibling's colour
        for (let i = 0; i < children.length - 1; i++) {
          const cur = children[i];
          const next = children[i + 1];
          const nextNeg = isNeg(next.edge);

          extend.add(cur.edge.id);
          if (nextNeg) {
            extendNeg.add(cur.edge.id);
          }
          for (let r = cur.row + 1; r < next.row; r++) {
            rails.set(`${colEdge}-${r}`, nextNeg);
          }
        }
      }
      node.edges.forEach((e) => traverse(e.node));
    };
    traverse(state);

    return {
      extendEdgeIds: extend,
      extendNegativeEdgeIds: extendNeg,
      railCells: rails,
    };
  }, [state, nodeItems]);

  return (
    <StyledQueryBox $gridWeight={gridWeight} $nodeItems={nodeItems}>
      {[...Array(gridWeight + 1).keys()].map((wi) => {
        return [...Array(nodeItems.length).keys()].map((hi) => {
          const nextCellNode = nodeItems.find((node) => node.gridX === wi + 1 && node.gridY === hi);
          const thisCellNode = nodeItems.find((node) => node.gridX === wi && node.gridY === hi);
          const associatedEdge =
            thisCellNode && allEdges.find((edge) => edge.node.id === thisCellNode.id);

          const nextCellAssociatedEdge =
            nextCellNode && allEdges.find((edge) => edge.node.id === nextCellNode.id);

          const isRootCell = wi === 0 && hi === 0;
          const rootHasParallelEdges =
            isRootCell && thisCellNode !== undefined && thisCellNode.edges.length > 1;

          const railKey = `${wi}-${hi}`;
          const showRail = railCells.has(railKey);
          const railNegative = railCells.get(railKey) === true;

          return (
            <div
              key={`${wi}-${hi}`}
              style={{
                position: "relative",
                gridColumn: wi + 1,
                gridRow: hi + 1,
                width: QUERY_GRID_WIDTH,
                height: rootHasParallelEdges ? QUERY_GRID_HEIGHT + 28 : QUERY_GRID_HEIGHT,
                overflow: rootHasParallelEdges ? "visible" : undefined,
              }}
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
                    stroke={
                      railNegative ? theme.color.entityA : theme.color.query2
                    }
                    strokeWidth={3}
                    strokeDasharray={railNegative ? "6 4" : undefined}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {thisCellNode && (
                <QueryGridNode
                  node={thisCellNode}
                  rootNode={state}
                  isRoot={wi === 0}
                  dispatch={dispatch}
                  edge={associatedEdge}
                  problems={queryStateValidity.problems.filter(
                    (problem) => problem.source === thisCellNode.id
                  )}
                  onOpenEntityInDetail={onOpenEntityInDetail}
                  includeEquivalents={includeEquivalents}
                  includeSubordinates={includeSubordinates}
                />
              )}
              {/* Vertical spine from below AND/OR switch down to the first child edge */}
              {rootHasParallelEdges && (
                <svg
                  width={QUERY_GRID_WIDTH}
                  height={QUERY_GRID_HEIGHT + 28}
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
                    y1={QUERY_GRID_HEIGHT + 10}
                    y2={QUERY_GRID_HEIGHT + 28}
                    stroke={theme.color.query2}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {nextCellAssociatedEdge && (
                <QueryGridEdge
                  node={nextCellNode}
                  dispatch={dispatch}
                  edge={nextCellAssociatedEdge}
                  extendVertical={extendEdgeIds.has(nextCellAssociatedEdge.id)}
                  extendNegative={extendNegativeEdgeIds.has(
                    nextCellAssociatedEdge.id
                  )}
                  problems={queryStateValidity.problems.filter(
                    (problem) => problem.source === nextCellAssociatedEdge.id
                  )}
                />
              )}
            </div>
          );
        });
      })}
    </StyledQueryBox>
  );
};

export const MemoizedQueryBox = React.memo(QueryBox);
