import { Button, Checkbox, IconWithTooltip } from "components";
import { IcoClose, IcoWarning } from "Theme/icons";
import Dropdown from "components/advanced";
import React from "react";
import { QueryAction, QueryActionType } from "../state";
import {
  edgeTypesHidden,
  edgeTypesImplemented,
  edgeTypesRetired,
  INodeItem,
  QueryValidityProblem,
} from "../../types";
import { QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH, QUERY_PROP_VALUE_X } from "../../constants";
import { Query } from "@inkvisitor/shared/types/query";
import { useTheme } from "styled-components";
import { EdgePropPairPicker } from "./EdgePropPairPicker";
import { buildEdgeTypeOptionGroups, findValidEdgeTypesForEdge } from "pages/Query/utils";
import {
  StyledEdgeBox,
  StyledEdgeContainer,
  StyledEdgeNotToggle,
  StyledEdgeControlsLayer,
  StyledEdgePropPairSlot,
  StyledEdgeSvg,
  StyledEdgeTypeCell,
  StyledEdgeValueBox,
  StyledEdgeValueControlsLayer,
  StyledEdgeValueLabel,
  StyledPropPairTabLabel,
} from "./QueryStyles";

interface QueryGridEdgeProps {
  node: INodeItem;
  rootNode: Query.INode;
  edge: Query.IEdge;
  dispatch: React.Dispatch<QueryAction>;
  problems: QueryValidityProblem[];
  // when this edge is not the last of its parent's children, the vertical
  // spine must continue down past this branch to reach the siblings below
  extendVertical?: boolean;
  // the pass-through (lower) part of the spine feeds the NEXT sibling, so it is
  // coloured by that sibling's logic - grey when the sibling below is negative
  extendNegative?: boolean;
  onOpenEntityInDetail?: (entityId: string) => void;
  // the connector to the value node of an HP: / SP: edge, which the edge's own controls
  // in the type node's row already set
  isValueConnector?: boolean;
}

export const QueryGridEdge: React.FC<QueryGridEdgeProps> = ({
  node,
  rootNode,
  edge,
  dispatch,
  problems,
  extendVertical = false,
  extendNegative = false,
  onOpenEntityInDetail,
  isValueConnector = false,
}) => {
  const theme = useTheme();
  const validEdgesTypes = findValidEdgeTypesForEdge(rootNode, edge.id);

  const edgeTypeOptions = buildEdgeTypeOptionGroups(
    validEdgesTypes.filter(
      (type) =>
        !edgeTypesHidden.includes(type) &&
        (!edgeTypesRetired.includes(type) || type === edge.type),
    ),
    edgeTypesImplemented,
  );

  const isValid = problems.every((problem) => problem.warning);
  const warning = problems.find((problem) => problem.warning);

  const color = isValid ? theme.color.query2 : theme.color.queryInvalid;

  const isNegative = edge.logic === Query.EdgeLogic.Negative;

  // a valid negative ("NOT") edge gets a distinct grey connector so it reads as
  // an exclusion at a glance; invalid still wins (its red) over this
  const lineColor = isValid && isNegative ? theme.color.queryNegative : color;

  // the value line of HP: / SP: is negated by NOT on the edge or on the value alone
  const isValueNegated = edge.valueLogic === Query.EdgeLogic.Negative;
  const isValueLineNegative = isNegative || isValueNegated;
  const valueLineColor = isValid && isValueLineNegative ? theme.color.queryNegative : color;
  const branchNegative = isValueConnector ? isValueLineNegative : isNegative;
  const branchColor = isValueConnector ? valueLineColor : lineColor;

  const x = 20;
  const midY = QUERY_GRID_HEIGHT / 2;
  const curveRadius = 8;
  // the "with value" branch leaves the HP: / SP: edge's own value line, not the parent's spine
  const branchX = isValueConnector ? QUERY_PROP_VALUE_X : x;
  const ControlsLayer = isValueConnector ? StyledEdgeValueControlsLayer : StyledEdgeControlsLayer;
  const branchPath = [
    `M ${branchX} 0`,
    `L ${branchX} ${midY - curveRadius}`,
    `Q ${branchX} ${midY} ${branchX + curveRadius} ${midY}`,
    `L ${QUERY_GRID_WIDTH} ${midY}`,
  ].join(" ");

  return (
    <StyledEdgeContainer>
      <StyledEdgeSvg>
        <g style={{ strokeWidth: 3 }}>
          <g style={{ stroke: branchColor }} strokeDasharray={branchNegative ? "6 4" : undefined}>
            <path d={branchPath} fill="none" strokeLinecap="round" />
          </g>
          {edge.valueNode && !isValueConnector && (
            <g
              style={{ stroke: valueLineColor }}
              strokeDasharray={isValueLineNegative ? "6 4" : undefined}
            >
              <line
                x1={QUERY_PROP_VALUE_X}
                x2={QUERY_PROP_VALUE_X}
                y1={midY}
                y2={QUERY_GRID_HEIGHT}
                strokeLinecap="round"
              />
            </g>
          )}
          {extendVertical && (
            <g
              style={{
                stroke: extendNegative ? theme.color.queryNegative : theme.color.query2,
              }}
              strokeDasharray={extendNegative ? "6 4" : undefined}
            >
              <line x1={x} x2={x} y1={midY - 4} y2={QUERY_GRID_HEIGHT} strokeLinecap="round" />
            </g>
          )}
        </g>
      </StyledEdgeSvg>
      <ControlsLayer>
        {isValueConnector ? (
          <StyledEdgeValueBox $color={branchColor}>
            <StyledEdgeNotToggle $active={isValueNegated}>
              <Checkbox
                size={15}
                key={`${edge.id}-value-not-${edge.valueLogic}`}
                label="NOT"
                labelColor="query2Text"
                value={isValueNegated}
                color="primary"
                noFill
                tooltipLabel="match props of this type whose value does not match the value node, or that have no value"
                onChangeFn={(checked) =>
                  dispatch({
                    type: QueryActionType.updateEdgeValueLogic,
                    payload: {
                      edgeId: edge.id,
                      newLogic: checked ? Query.EdgeLogic.Negative : Query.EdgeLogic.Positive,
                    },
                  })
                }
              />
            </StyledEdgeNotToggle>
            <StyledEdgeValueLabel>with value</StyledEdgeValueLabel>
            <Button
              icon={<IcoClose size={12} />}
              noBackground
              noBorder
              textColor="query2Text"
              tooltipLabel="remove the value node"
              onClick={() =>
                dispatch({
                  type: QueryActionType.updateEdgeValueNode,
                  payload: { edgeId: edge.id, hasValueNode: false },
                })
              }
            />
          </StyledEdgeValueBox>
        ) : (
          <StyledEdgeBox $color={lineColor}>
            <StyledEdgeNotToggle $active={isNegative}>
              <Checkbox
                size={15}
                key={`${edge.id}-not-${edge.logic}`}
                label="NOT"
                labelColor="query2Text"
                value={isNegative}
                // neutral white box + dark check, reads as a control resting on the
                // grey negated edge rather than competing with it
                color="primary"
                noFill
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
            </StyledEdgeNotToggle>
            <StyledEdgeTypeCell>
              <Dropdown.Single.Basic
                options={edgeTypeOptions}
                width={212}
                noDropDownIndicator
                value={edge.type}
                tooltipContent={Query.EdgeTypeDescriptions[edge.type]}
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
              {Query.PropPairEdges[edge.type] && (
                <StyledEdgePropPairSlot $color={lineColor}>
                  <EdgePropPairPicker
                    edge={edge}
                    dispatch={dispatch}
                    onOpenEntityInDetail={onOpenEntityInDetail}
                  />
                </StyledEdgePropPairSlot>
              )}
              {Query.TupleValueEdgeTypes[edge.type] && !edge.valueNode && (
                <StyledEdgePropPairSlot $color={lineColor}>
                  <StyledPropPairTabLabel
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: QueryActionType.updateEdgeValueNode,
                        payload: { edgeId: edge.id, hasValueNode: true },
                      })
                    }
                  >
                    + with value
                  </StyledPropPairTabLabel>
                </StyledEdgePropPairSlot>
              )}
            </StyledEdgeTypeCell>
            {warning && (
              <IconWithTooltip
                icon={<IcoWarning size={16} />}
                color="warning"
                tooltipText={warning.text}
                tooltipPosition="top"
              />
            )}
          </StyledEdgeBox>
        )}
      </ControlsLayer>
    </StyledEdgeContainer>
  );
};
