import { IResponseQuery, Query } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { useAppSelector } from "redux/hooks";
import { QueryGridEdge } from "./components/QueryGridEdge";
import { QueryGridNode } from "./components/QueryGridNode";
import { QueryAction } from "./state";
import {
  INodeItem,
  QUERY_GRID_HEIGHT,
  QUERY_GRID_WIDTH,
  QueryValidity,
} from "../types";
import { getAllEdges, getAllNodes } from "./utils";

interface QueryBoxProps {
  state: Query.INode;
  dispatch: React.Dispatch<QueryAction>;
  data: IResponseQuery | undefined;
  isQueryFetching: boolean;
  queryError: Error | null;
  queryStateValidity: QueryValidity;
}

export const QueryBox: React.FC<QueryBoxProps> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
  queryStateValidity,
}) => {
  const queryClient = useQueryClient();

  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

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

  return (
    <div>
      <div
        id="query-header"
        style={{
          height: "40px",
        }}
      ></div>
      <div
        style={{
          padding: "10px",
          display: "grid",
          gridTemplateColumns: `repeat(${
            gridWeight + 1
          }, ${QUERY_GRID_WIDTH}px)`,
          gridTemplateRows: `repeat(${nodeItems.length}, ${QUERY_GRID_HEIGHT}px)`,
        }}
      >
        {[...Array(gridWeight + 1).keys()].map((wi) => {
          return [...Array(nodeItems.length).keys()].map((hi) => {
            const nextCellNode = nodeItems.find(
              (node) => node.gridX === wi + 1 && node.gridY === hi
            );
            const thisCellNode = nodeItems.find(
              (node) => node.gridX === wi && node.gridY === hi
            );
            const associatedEdge =
              thisCellNode &&
              allEdges.find((edge) => edge.node.id === thisCellNode.id);

            const nextCellAssociatedEdge =
              nextCellNode &&
              allEdges.find((edge) => edge.node.id === nextCellNode.id);

            return (
              <div
                key={`${wi}-${hi}`}
                style={{
                  gridColumn: wi + 1,
                  gridRow: hi + 1,
                  width: QUERY_GRID_WIDTH,
                  height: QUERY_GRID_HEIGHT,
                }}
              >
                {thisCellNode && (
                  <QueryGridNode
                    node={thisCellNode}
                    isRoot={wi === 0}
                    dispatch={dispatch}
                    edge={associatedEdge}
                    problems={queryStateValidity.problems.filter(
                      (problem) => problem.source === thisCellNode.id
                    )}
                  />
                )}
                {nextCellAssociatedEdge && (
                  <QueryGridEdge
                    node={nextCellNode}
                    dispatch={dispatch}
                    edge={nextCellAssociatedEdge}
                    problems={queryStateValidity.problems.filter(
                      (problem) => problem.source === nextCellAssociatedEdge.id
                    )}
                  />
                )}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};

export const MemoizedQueryBox = React.memo(QueryBox);
