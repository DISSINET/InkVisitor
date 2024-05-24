import { IResponseDetail } from "@shared/types";
import { Handle, NodeTypes, Position } from "reactflow";
import "reactflow/dist/style.css";

import { EntityTag } from "components/advanced";
import React from "react";

export const GraphNode: React.FC<{
  data: { entity: IResponseDetail; level: number };
}> = ({ data }) => {
  if (!data.entity) {
    console.log("problem");
  }
  return (
    <>
      <Handle type="source" position={Position.Right} />
      <div>
        {data.entity ? <EntityTag entity={data.entity} /> : <div />}
        <div className="custom-drag-handle"></div>
      </div>
      <Handle type="target" position={Position.Left} />
    </>
  );
};

export const nodeTypes: NodeTypes = {
  entityNode: GraphNode,
};
