import { Checkbox } from "components";
import Dropdown from "components/advanced";
import React from "react";
import { QueryAction, QueryActionType } from "../state";
import { edgeTypesImplemented, INodeItem, QueryValidityProblem } from "../../types";
import { QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH } from "../../constants";
import { Query } from "@inkvisitor/shared/types/query";
import { useTheme } from "styled-components";
import { findValidEdgeTypesForSourceNode } from "pages/Query/utils";
import {
  StyledEdgeBox,
  StyledEdgeContainer,
  StyledEdgeControlsLayer,
  StyledEdgeSvg,
} from "./QueryStyles";

interface QueryGridEdgeProps {
  node: INodeItem;
  rootNode: Query.INode;
  edge: Query.IEdge;
  dispatch: React.Dispatch<QueryAction>;
  problems: QueryValidityProblem[];
  isRootEdge?: boolean;
  // when this edge is not the last of its parent's children, the vertical
  // spine must continue down past this branch to reach the siblings below
  extendVertical?: boolean;
  // the pass-through (lower) part of the spine feeds the NEXT sibling, so it is
  // coloured by that sibling's logic - red when the sibling below is negative
  extendNegative?: boolean;
}

export const QueryGridEdge: React.FC<QueryGridEdgeProps> = ({
  node,
  rootNode,
  edge,
  dispatch,
  problems,
  isRootEdge = false,
  extendVertical = false,
  extendNegative = false,
}) => {
  const theme = useTheme();
  const sourceNode = isRootEdge ? rootNode : node;
  const validEdgesTypes = findValidEdgeTypesForSourceNode(sourceNode, isRootEdge);

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

  const x = 20;
  const midY = QUERY_GRID_HEIGHT / 2;
  const curveRadius = 8;
  const branchPath = [
    `M ${x} 0`,
    `L ${x} ${midY - curveRadius}`,
    `Q ${x} ${midY} ${x + curveRadius} ${midY}`,
    `L ${QUERY_GRID_WIDTH} ${midY}`,
  ].join(" ");

  return (
    <StyledEdgeContainer>
      <StyledEdgeSvg>
        <g style={{ strokeWidth: 3 }}>
          <g style={{ stroke: lineColor }} strokeDasharray={isNegative ? "6 4" : undefined}>
            <path d={branchPath} fill="none" strokeLinecap="round" />
          </g>
          {extendVertical && (
            <g
              style={{
                stroke: extendNegative ? theme.color.entityA : theme.color.query2,
              }}
              strokeDasharray={extendNegative ? "6 4" : undefined}
            >
              <line x1={x} x2={x} y1={midY - 4} y2={QUERY_GRID_HEIGHT} strokeLinecap="round" />
            </g>
          )}
        </g>
      </StyledEdgeSvg>
      <StyledEdgeControlsLayer>
        <StyledEdgeBox $color={lineColor}>
          <Checkbox
            key={`${edge.id}-not-${edge.logic}`}
            label="NOT"
            value={isNegative}
            // neutral white box + dark check, reads as a control resting on the
            // red negated edge rather than competing with it
            accentColor="primary"
            tooltipLabel="negate this condition (find entities that do NOT match)"
            onChangeFn={(checked) => {
              const newLogic = checked ? Query.EdgeLogic.Negative : Query.EdgeLogic.Positive;
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
            width={212}
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
        </StyledEdgeBox>
      </StyledEdgeControlsLayer>
    </StyledEdgeContainer>
  );
};
