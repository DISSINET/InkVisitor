import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  EdgeLabelRenderer,
  EdgeProps,
  EdgeTypes,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";

import { certaintyDict } from "@inkvisitor/shared/dictionaries";
import { LetterIcon, Tooltip } from "components";
import React, { useId, useMemo, useState } from "react";

import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation } from "@inkvisitor/shared/types/relation";
import { DefaultTheme, useTheme } from "styled-components";

type EdgeStyle = { dashArray: string; width: number; stroke: string; strokeOpacity: number };

const getCertaintyStyles = (theme: DefaultTheme): Record<EntityEnums.Certainty, EdgeStyle> => ({
  "0": { strokeOpacity: 1, dashArray: "1 1", width: 1, stroke: theme.color["white"] },
  "1": { strokeOpacity: 1, dashArray: "10 0", width: 3, stroke: theme.color["black"] },
  "2": { strokeOpacity: 1, dashArray: "5 2", width: 2, stroke: theme.color["black"] },
  "3": { strokeOpacity: 1, dashArray: "5 5", width: 2, stroke: theme.color["black"] },
  "4": { strokeOpacity: 1, dashArray: "3 3", width: 1, stroke: theme.color["gray"][600] },
  "5": { strokeOpacity: 1, dashArray: "2 2", width: 1, stroke: theme.color["danger"] },
  "6": { strokeOpacity: 1, dashArray: "1 1", width: 1, stroke: theme.color["queryInvalid"] },
});

export const GraphEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const theme = useTheme();
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);

  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);

  // edge ids repeat across the graphs on one page and a url(#...) reference
  // takes the first match in the document, so the marker id must be page-unique;
  // useId may contain characters that break a url() reference
  const markerId = `arrowhead-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // both ends of an arc face right at about the same x, where a bezier between
  // handles collapses into a straight line; the bulge grows with the distance
  // so arcs of different lengths nest instead of overlapping, up to a cap that
  // keeps the arc in the gap before the next column
  const bulge = Math.min(Math.abs(targetY - sourceY) / 2, 80);
  const [edgePath, labelX, labelY] = data.arc
    ? [
        [
          `M ${sourceX},${sourceY}`,
          `C ${sourceX + bulge},${sourceY}`,
          `${targetX + bulge},${targetY}`,
          `${targetX},${targetY}`,
        ].join(" "),
        (sourceX + targetX) / 2 + (bulge * 3) / 4,
        (sourceY + targetY) / 2,
      ]
    : getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });

  const scaleLabel = 0.75;

  const relType =
    Relation.RelationRules[data.relationType as RelationEnums.Type];

  // if the relation is assymetric, the edge has only one arrow
  const relAssymetric = relType?.asymmetrical;

  const edgeStyle = useMemo(() => {
    if (data.certainty) {
      return getCertaintyStyles(theme)[data.certainty as EntityEnums.Certainty];
    } else {
      return {
        strokeOpacity: 1,
        dashArray: "10 0",
        width: 3,
        stroke: theme.color.info,
      };
    }
  }, [theme, data.certainty]);

  return (
    <>
      <g
        onMouseEnter={() => {
          setTooltipVisible(true);
        }}
        onMouseLeave={() => {
          setTooltipVisible(false);
        }}
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 6 6"
            refX="6"
            refY="3"
            markerUnits="strokeWidth"
            markerWidth="3"
            markerHeight="3"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill={edgeStyle.stroke} />
          </marker>
        </defs>
        <Tooltip
          content={
            <>
              <div>{relType?.label}</div>

              {data.certainty && (
                <div>
                  {`certainty = ${
                    certaintyDict.find((op) => op.value === data.certainty)
                      ?.label
                  }`}
                </div>
              )}
            </>
          }
          visible={tooltipVisible}
          referenceElement={referenceElement}
        ></Tooltip>
        <path
          id={id}
          d={edgePath}
          strokeDasharray={edgeStyle.dashArray}
          strokeOpacity={edgeStyle.strokeOpacity}
          fill="none"
          strokeWidth={edgeStyle.width}
          stroke={edgeStyle.stroke}
          style={{}}
          markerEnd={`url(#${markerId})`}
          markerStart={relAssymetric ? "none" : `url(#${markerId})`}
        />
        {/* tooltip interaction path */}
        <path
          id={id}
          d={edgePath}
          fill="none"
          strokeWidth={10}
          stroke={theme.color["warning"]}
          strokeOpacity={tooltipVisible ? 0.2 : 0.01}
        />
        <EdgeLabelRenderer>
          <div
            ref={setReferenceElement}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px) scale(${scaleLabel},${scaleLabel})`,
            }}
            className="nodrag nopan"
          >
            <LetterIcon
              size={6}
              letter={data.relationType}
              color="info"
              bgColor="white"
            />
          </div>
        </EdgeLabelRenderer>
      </g>
    </>
  );
};

export const edgeTypes: EdgeTypes = {
  relationship: GraphEdge,
};
