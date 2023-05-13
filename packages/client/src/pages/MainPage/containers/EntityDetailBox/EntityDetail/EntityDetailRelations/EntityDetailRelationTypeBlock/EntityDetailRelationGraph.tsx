import { RelationEnums } from "@shared/enums";
import { IEntity, IResponseDetail, Relation } from "@shared/types";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";

import { StyledEntityDetailRelationGraph } from "./EntityDetailRelationTypeBlockStyles";
import React, { useState } from "react";
import { Button } from "components";

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: object;
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
}

function convertToGraph(arr: any[]): Graph {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  arr.forEach((obj) => {
    obj.entityIds.forEach((id: string, i: number) => {
      nodes.push({
        id,
        type: "default",
        data: {},
        position: { x: i * 10, y: i * 10 },
      });
    });

    if (obj.subtrees) {
      obj.subtrees.forEach((subtree: any) => {
        subtree.entityIds.forEach((id: string, index: number) => {
          if (index === 0) {
            edges.push({
              id: subtree.id,
              source: id,
              target: subtree.entityIds[index + 1],
            });
          } else if (index === subtree.entityIds.length - 1) {
            edges.push({
              id: subtree.id,
              source: id,
              target: subtree.entityIds[index - 1],
            });
          } else {
            edges.push({
              id: subtree.id,
              source: id,
              target: subtree.entityIds[index - 1],
            });
            edges.push({
              id: subtree.id,
              source: id,
              target: subtree.entityIds[index + 1],
            });
          }
        });
      });
    }
  });

  return { nodes, edges };
}

interface EntityDetailRelationGraph {
  relationRule: Relation.RelationRule;
  relationType: RelationEnums.Type;
  entity: IResponseDetail;
  entities: Record<string, IEntity>;
  relations: Relation.IConnection<Relation.IClassification>[];
}

export const EntityDetailRelationGraph: React.FC<EntityDetailRelationGraph> = ({
  relationRule,
  relationType,
  entity,
  entities,
  relations,
}) => {
  const [open, setOpen] = useState<boolean>(true);

  const handleSetOpen = () => {
    setOpen(!open);
  };
  const [height, setHeight] = useState<number>(500);

  const { nodes, edges } = convertToGraph(relations);
  return (
    <StyledEntityDetailRelationGraph height={open ? height : 50}>
      <Button
        onClick={handleSetOpen}
        label={open ? "hide graph" : "open graph"}
      />
      {/* {JSON.stringify(relations)} */}
      {open && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          style={{ backgroundColor: "white" }}
        />
      )}
    </StyledEntityDetailRelationGraph>
  );
};
