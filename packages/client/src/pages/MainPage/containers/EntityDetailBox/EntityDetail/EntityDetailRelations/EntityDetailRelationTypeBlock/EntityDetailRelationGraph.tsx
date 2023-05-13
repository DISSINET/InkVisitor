import { RelationEnums } from "@shared/enums";
import { IEntity, IResponseDetail, Relation } from "@shared/types";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Position,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import { StyledEntityDetailRelationGraph } from "./EntityDetailRelationTypeBlockStyles";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "components";

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    level: number;
  };
  sourcePosition: Position;
  targetPosition: Position;
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

const convertToGraph = (
  entity: IResponseDetail,
  relations: Relation.IConnection<Relation.IClassification>[],
  entities: any
): { nodes: Node[]; edges: Edge[]; maxHeight: number } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  console.log(relations);

  const levelNodes: Record<string, number> = {};
  const addNode = (entityId: string, level: number) => {
    if (!nodes.map((n) => n.id).includes(entityId)) {
      console.log(entityId, level);
      const sLevel = String(level);
      if (!Object.keys(levelNodes).includes(sLevel)) {
        levelNodes[sLevel] = 0;
      }
      levelNodes[sLevel] += 1;

      nodes.push({
        id: entityId,
        type: "default",
        data: { label: entityId, level: level },
        position: { x: level * 200, y: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    }
  };
  const addEdge = (sourceId: string, targetId: string) => {
    if (!edges.find((e) => e.source === sourceId && e.target === targetId)) {
      edges.push({
        id: String(edges.length),
        source: sourceId,
        target: targetId,
      });
    }
  };

  addNode(entity.id, 0);

  const getNodesFromSubtree = (relationNode: any, level: number) => {
    relationNode.subtrees.forEach((branch: any) => {
      addNode(branch.entityIds[1], level);
      addEdge(branch.entityIds[0], branch.entityIds[1]);

      getNodesFromSubtree(branch, level + 1);
    });
  };

  relations.forEach((relation) => {
    const entityId = relation.entityIds[1];

    addNode(entityId, 1);
    addEdge(relation.entityIds[0], relation.entityIds[1]);

    getNodesFromSubtree(relation, 2);
  });

  const maxOnLevel = Math.max(...Object.values(levelNodes));

  const nodeW = 60;
  const processedLevels: Record<string, number> = {};
  const nodesWithY: Node[] = nodes.map((node) => {
    const nodeLevel = node.data.level;
    const nodeSLevel = String(nodeLevel);

    if (!Object.keys(processedLevels).includes(nodeSLevel)) {
      processedLevels[nodeSLevel] = 0;
    }
    processedLevels[nodeSLevel] += 1;

    const p = processedLevels[nodeSLevel];
    const a = levelNodes[nodeSLevel];

    const newY = (p - (a + 1) / 2) * nodeW;

    return {
      ...node,
      ...{
        position: { y: newY, x: node.position.x },
      },
    };
  });

  return { nodes: nodesWithY, edges, maxHeight: maxOnLevel * nodeW };
};

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

  const { nodes, edges, maxHeight } = useMemo(() => {
    return convertToGraph(entity, relations, entities);
  }, [entity, relations]);

  useEffect(() => {
    setHeight(maxHeight);
  }, [maxHeight]);

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
          style={{ backgroundColor: "white" }}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          onInit={(reactFlowInstance: ReactFlowInstance) => {
            reactFlowInstance.fitView();
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          {/* <MiniMap /> */}
          <Controls showInteractive={false} />
          <Background />
        </ReactFlow>
      )}
    </StyledEntityDetailRelationGraph>
  );
};
