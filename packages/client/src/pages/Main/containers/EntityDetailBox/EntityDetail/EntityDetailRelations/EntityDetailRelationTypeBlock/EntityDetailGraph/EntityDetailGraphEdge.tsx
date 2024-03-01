import { EntityEnums } from "@shared/enums";
import {
  EdgeLabelRenderer,
  EdgeProps,
  EdgeTypes,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";

import { LetterIcon, Tooltip } from "components";
import React, { useMemo, useState } from "react";
import { certaintyDict } from "@shared/dictionaries";

import { Relation } from "@shared/types/relation";
import { RelationEnums } from "@shared/enums";

const certaintyStyles: Record<
  EntityEnums.Certainty,
  { dashArray: string; width: number; stroke: string; strokeOpacity: number }
> = {
  "0": { strokeOpacity: 1, dashArray: "1 1", width: 1, stroke: "white" },
  "1": { strokeOpacity: 1, dashArray: "10 0", width: 3, stroke: "black" },
  "2": { strokeOpacity: 1, dashArray: "5 2", width: 2, stroke: "black" },
  "3": { strokeOpacity: 1, dashArray: "5 5", width: 2, stroke: "black" },
  "4": { strokeOpacity: 1, dashArray: "3 3", width: 1, stroke: "grey" },
  "5": { strokeOpacity: 1, dashArray: "2 2", width: 1, stroke: "darkred" },
  "6": { strokeOpacity: 1, dashArray: "1 1", width: 1, stroke: "red" },
};

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
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);

  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const scaleLabel = 0.75;

  const edgeStyle = useMemo(() => {
    if (data.certainty) {
      return certaintyStyles[data.certainty as EntityEnums.Certainty];
    } else {
      return { strokeOpacity: 1, dashArray: "10 0", width: 3, stroke: "black" };
    }
  }, [data.certainty]);

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
        <Tooltip
          content={
            <>
              <div>
                {
                  Relation.RelationRules[
                    data.relationType as RelationEnums.Type
                  ]?.label
                }{" "}
              </div>

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
        />
        {/* tooltip interaction path */}
        <path
          id={id}
          d={edgePath}
          fill="none"
          strokeWidth={10}
          stroke="orange"
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
