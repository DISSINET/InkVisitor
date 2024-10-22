import { Query } from "@shared/types";
import Dropdown from "components/advanced";
import React from "react";
import { QueryAction, QueryActionType } from "../state";
import {
  edgeTypesImplemented,
  INodeItem,
  QUERY_GRID_HEIGHT,
  QUERY_GRID_WIDTH,
  QueryValidityProblem,
} from "../../types";
import theme from "Theme/theme";

interface QueryGridEdgeProps {
  node: INodeItem;
  edge: Query.IEdge;
  dispatch: React.Dispatch<QueryAction>;
  problems: QueryValidityProblem[];
}

export const QueryGridEdge: React.FC<QueryGridEdgeProps> = ({
  node,
  edge,
  dispatch,
  problems,
}) => {
  const validEdgesTypes = Query.findValidEdgeTypesForSourceNode(node);

  const edgeTypeOptions = validEdgesTypes.map((type) => ({
    value: type,
    label: Query.EdgeTypeLabels[type],
    isDisabled: !edgeTypesImplemented.includes(type),
  }));

  const isValid = problems.length === 0;

  const color = isValid ? "dimgray" : "red";

  edgeTypeOptions.sort((a, b) => {
    if (a.isDisabled && !b.isDisabled) {
      return 1;
    }

    if (!a.isDisabled && b.isDisabled) {
      return -1;
    }

    return a.label.localeCompare(b.label);
  });

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
        <g style={{ stroke: color, strokeWidth: 3 }}>
          <line
            x1={20}
            x2={20}
            y1={0}
            y2={QUERY_GRID_HEIGHT / 2}
            strokeLinecap="round"
          />
          <line
            x1={20}
            x2={QUERY_GRID_WIDTH}
            y1={QUERY_GRID_HEIGHT / 2}
            y2={QUERY_GRID_HEIGHT / 2}
            strokeLinecap="round"
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
        <div
          style={{
            backgroundColor: color,
            padding: theme.space[1],
          }}
        >
          <Dropdown.Single.Basic
            options={edgeTypeOptions}
            width={200}
            noDropDownIndicator
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
    </div>
  );
};
