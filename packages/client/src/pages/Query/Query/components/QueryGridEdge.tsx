import { Checkbox } from "components";
import Dropdown from "components/advanced";
import React from "react";
import { QueryAction, QueryActionType } from "../state";
import { edgeTypesImplemented, INodeItem, QueryValidityProblem } from "../../types";
import { QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH } from "../../constants";
import { Query } from "@inkvisitor/shared/types/query";
import { useTheme } from "styled-components";
import { findValidEdgeTypesForSourceNode } from "pages/Query/utils";

interface QueryGridEdgeProps {
  node: INodeItem;
  edge: Query.IEdge;
  dispatch: React.Dispatch<QueryAction>;
  problems: QueryValidityProblem[];
  // when this edge is not the last of its parent's children, the vertical
  // spine must continue down past this branch to reach the siblings below
  extendVertical?: boolean;
  // the pass-through (lower) part of the spine feeds the NEXT sibling, so it is
  // coloured by that sibling's logic - red when the sibling below is negative
  extendNegative?: boolean;
}

export const QueryGridEdge: React.FC<QueryGridEdgeProps> = ({
  node,
  edge,
  dispatch,
  problems,
  extendVertical = false,
  extendNegative = false,
}) => {
  const theme = useTheme();
  const validEdgesTypes = findValidEdgeTypesForSourceNode(node);

  const edgeTypeOptions = validEdgesTypes.map((type) => ({
    value: type,
    label: Query.EdgeTypeLabels[type],
    isDisabled: !edgeTypesImplemented.includes(type),
  }));

  const isValid = problems.length === 0;

  const color = isValid ? theme.color.query2 : theme.color.queryInvalid;

  const isNegative = edge.logic === Query.EdgeLogic.Negative;

  // a valid negative ("NOT") edge gets a distinct red connector so it reads as
  // an exclusion at a glance; invalid still wins (its own red) over this
  const lineColor = isValid && isNegative ? theme.color.entityA : color;

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
        <g style={{ strokeWidth: 3 }}>
          {/* this edge's own branch: upper spine (junction) + horizontal to the
              node, in this edge's colour - red/dashed when negative */}
          <g style={{ stroke: lineColor }} strokeDasharray={isNegative ? "6 4" : undefined}>
            <line x1={20} x2={20} y1={0} y2={QUERY_GRID_HEIGHT / 2} strokeLinecap="round" />
            <line
              x1={20}
              x2={QUERY_GRID_WIDTH}
              y1={QUERY_GRID_HEIGHT / 2}
              y2={QUERY_GRID_HEIGHT / 2}
              strokeLinecap="round"
            />
          </g>
          {/* pass-through spine continuing down to the next sibling, coloured
              by that sibling's logic */}
          {extendVertical && (
            <g
              style={{
                stroke: extendNegative ? theme.color.entityA : theme.color.query2,
              }}
              strokeDasharray={extendNegative ? "6 4" : undefined}
            >
              <line
                x1={20}
                x2={20}
                y1={QUERY_GRID_HEIGHT / 2}
                y2={QUERY_GRID_HEIGHT}
                strokeLinecap="round"
              />
            </g>
          )}
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
          // keep the controls above the decorative connector line so the line
          // is hidden behind the box instead of drawn over the NOT checkbox
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "5px",
            // a negative edge tints its own box red; this is scoped to the edge
            // itself (its level), not its target node or deeper edges
            backgroundColor: lineColor,
            borderRadius: theme.borderRadius["default"],
            padding: theme.space[1],
            paddingLeft: theme.space[2],
            marginTop: 10,
          }}
        >
          <Checkbox
            key={`${edge.id}-not-${edge.logic}`}
            label="NOT"
            value={isNegative}
            tooltipLabel="negate this condition (find entities that do NOT match)"
            onChangeFn={(checked) => {
              const newLogic = checked ? Query.EdgeLogic.Negative : Query.EdgeLogic.Positive;
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
        </div>
      </div>
    </div>
  );
};
