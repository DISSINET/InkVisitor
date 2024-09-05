import { Query } from "@shared/types";
import Dropdown from "components/advanced";
import React from "react";
import { QueryAction, QueryActionType } from "../state";
import { INodeItem, QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH } from "../types";

interface QueryGridEdgeProps {
  node: INodeItem;
  edge: Query.IEdge;
  dispatch: React.Dispatch<QueryAction>;
}

export const QueryGridEdge: React.FC<QueryGridEdgeProps> = ({
  node,
  edge,
  dispatch,
}) => {
  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <svg
        width={QUERY_GRID_WIDTH}
        height={QUERY_GRID_HEIGHT}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <g style={{ stroke: "rgb(0,0,0)", strokeWidth: 2 }}>
          <line x1={20} x2={20} y1={0} y2={QUERY_GRID_HEIGHT / 2} />
          <line
            x1={20}
            x2={QUERY_GRID_WIDTH}
            y1={QUERY_GRID_HEIGHT / 2}
            y2={QUERY_GRID_HEIGHT / 2}
          />
        </g>
      </svg>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          width: "100%",
          height: "100%",
          justifyContent: "center",
        }}
      >
        <Dropdown.Single.Basic
          options={[
            { value: Query.EdgeType.XHasPropType, label: "XHasPropType" },
            {
              value: Query.EdgeType.XHasClassification,
              label: "XHasClassification",
            },
            { value: Query.EdgeType.XHasRelation, label: "XHasRelation" },
            { value: Query.EdgeType.SUnderT, label: "SUnderT" },
            { value: Query.EdgeType.XHasSuperclass, label: "XHasSuperclass" },
          ]}
          width={200}
          value={edge?.type}
          onChange={(newValue) => {
            dispatch({
              type: QueryActionType.updateEdgeType,
              payload: {
                edgeId: edge?.id,
                newType: newValue,
              },
            });
          }}
        />
      </div>
    </div>
  );
};
