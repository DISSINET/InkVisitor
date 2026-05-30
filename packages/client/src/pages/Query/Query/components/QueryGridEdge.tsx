import { Checkbox } from "components";
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
import { Query } from "@inkvisitor/shared/types/query";
import { useTheme } from "styled-components";

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
  const theme = useTheme();
  const validEdgesTypes = Query.findValidEdgeTypesForSourceNode(node);

  const edgeTypeOptions = validEdgesTypes.map((type) => ({
    value: type,
    label: Query.EdgeTypeLabels[type],
    isDisabled: !edgeTypesImplemented.includes(type),
  }));

  const isValid = problems.length === 0;

  const color = isValid ? theme.color.query2 : theme.color.queryInvalid;

  const isNegative = edge.logic === Query.EdgeLogic.Negative;

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
        // decorative connector - must never intercept clicks on the controls
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        <g
          style={{ stroke: color, strokeWidth: 3 }}
          strokeDasharray={isNegative ? "6 4" : undefined}
        >
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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
            backgroundColor: color,
            padding: theme.space[1],
            marginTop: 10,
          }}
        >
          <Dropdown.Single.Basic
            options={edgeTypeOptions}
            width={200}
            noDropDownIndicator
            value={edge.type}
            onChange={(newValue) => {
              dispatch({
                type: QueryActionType.updateEdgeType,
                payload: {
                  edgeId: edge.id,
                  newType: newValue,
                },
              });
              dispatch({
                type: QueryActionType.updateNodeEntityId,
                payload: {
                  nodeId: node.id,
                  newEntityId: undefined,
                },
              });
            }}
          />
          <Checkbox
            key={`${edge.id}-not-${edge.logic}`}
            label="NOT"
            value={isNegative}
            tooltipLabel="negate this condition (find entities that do NOT match)"
            onChangeFn={(checked) => {
              const newLogic = checked
                ? Query.EdgeLogic.Negative
                : Query.EdgeLogic.Positive;
              // skip the redundant dispatch fired on (re)mount
              if (newLogic === edge.logic) {
                return;
              }
              dispatch({
                type: QueryActionType.updateEdgeLogic,
                payload: {
                  edgeId: edge.id,
                  newLogic,
                },
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};
