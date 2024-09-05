import { IResponseQuery, Query } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { useAppSelector } from "redux/hooks";
import { QueryGridNode } from "./components/QueryGridNode";
import { INodeItem, QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH } from "./types";

interface QueryBoxProps {
  state: Query.INode;
  dispatch: React.Dispatch<any>;
  data: IResponseQuery | undefined;
  isQueryFetching: boolean;
  queryError: Error | null;
}

export const QueryBox: React.FC<QueryBoxProps> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
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
      <div id="query-header"></div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${
            gridWeight + 1
          }, ${QUERY_GRID_WIDTH}px)`,
          gridTemplateRows: `repeat(${nodeItems.length}, ${QUERY_GRID_HEIGHT}px)`,
        }}
      >
        {[...Array(gridWeight + 1).keys()].map((wi) => {
          return [...Array(nodexport class EdgeHasPropType extends SearchEdge {
            constructor(data: Partial<Query.IEdge>) {
              super(data);
              this.type = Query.EdgeType.XHasPropType;
            }
          
            run(q: RStream): RStream {
              return q.concatMap(function (entity: RDatum<IEntity>) {
                return r
                  .table(Entity.table)
                  .getAll(entity("id"))
                  .filter(function (e: RDatum<IEntity>) {
                    // some of the e.[props].type.entityId is entity.id
                    return e("props").filter(function (prop) {
                      return prop("type")("entityId").eq(data.node.params.id );
                    });
                  });
              });
            }
          }eItems.length).keys()].map((hi) => {
            const nodeItem = nodeItems.find(
              (node) => node.gridX === wi && node.gridY === hi
            );

            return (
              <div key={`${wi}-${hi}`}>
                {nodeItem && <QueryGridNode item={nodeItem} />}
                {!nodeItem && <div>nic</div>}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};

export const MemoizedQueryBox = React.memo(QueryBox);
