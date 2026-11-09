import { IResponseEntityRelations } from "@inkvisitor/shared/types/response-detail";
import { Handle, NodeTypes, Position } from "reactflow";
import "reactflow/dist/style.css";

import { EntityTag } from "components/advanced";
import React from "react";
import { StyledGraphVerticalHandle } from "../EntityDetailRelationTypeBlockStyles";

export const GraphNode: React.FC<{
  data: { entity: IResponseEntityRelations; level: number };
}> = ({ data }) => {
  if (!data.entity) {
    console.log("problem");
  }
  return (
    <>
      <Handle type="source" id="source-right" position={Position.Right} />
      <StyledGraphVerticalHandle type="source" id="source-top" position={Position.Top} />
      <StyledGraphVerticalHandle type="source" id="source-bottom" position={Position.Bottom} />
      {/* nopan keeps reactflow from zooming on a double click, which on a tag
          opens the entity in the detail */}
      <div className="nopan">
        {data.entity ? <EntityTag entity={data.entity} /> : <div />}
        <div className="custom-drag-handle"></div>
      </div>
      <Handle type="target" id="target-left" position={Position.Left} />
      <StyledGraphVerticalHandle type="target" id="target-top" position={Position.Top} />
      <StyledGraphVerticalHandle type="target" id="target-bottom" position={Position.Bottom} />
      <StyledGraphVerticalHandle type="target" id="target-right" position={Position.Right} />
    </>
  );
};

export const nodeTypes: NodeTypes = {
  entityNode: GraphNode,
};
