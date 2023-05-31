import { EntityEnums } from "@shared/enums";
import {
  EdgeLabelRenderer,
  EdgeProps,
  EdgeTypes,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";

import { LetterIcon, Tooltip } from "components";
import React, { useState } from "react";

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

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const scaleLabel = 0.75;

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

  return (
    <>
      <path
        id={id}
        d={edgePath}
        strokeDasharray={
          certaintyStyles[data.certainty as EntityEnums.Certainty].dashArray
        }
        strokeOpacity={
          certaintyStyles[data.certainty as EntityEnums.Certainty].strokeOpacity
        }
        fill="none"
        width={certaintyStyles[data.certainty as EntityEnums.Certainty].width}
        stroke={certaintyStyles[data.certainty as EntityEnums.Certainty].stroke}
        style={{}}
      />
      <EdgeLabelRenderer>
        <Tooltip
          label={data.certainty}
          visible
          referenceElement={referenceElement}
        >
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
        </Tooltip>
      </EdgeLabelRenderer>
    </>
  );
};

export const edgeTypes: EdgeTypes = {
  relationship: GraphEdge,
};
