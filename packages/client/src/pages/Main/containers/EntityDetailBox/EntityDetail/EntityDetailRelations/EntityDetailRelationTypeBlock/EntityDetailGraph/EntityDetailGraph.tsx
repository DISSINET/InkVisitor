import { RelationEnums } from "@shared/enums";
import { IEntity, IResponseDetail, Relation } from "@shared/types";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MarkerType,
  Node,
  Position,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import React, { useEffect, useMemo, useState } from "react";
import { StyledEntityDetailRelationGraph } from "../EntityDetailRelationTypeBlockStyles";

import { edgeTypes } from "./EntityDetailGraphEdge";
import { nodeTypes } from "./EntityDetailGraphNode";

interface Graph {
  nodes: Node[];
  edges: Edge[];
  maxHeight: number;
}

const convertToGraph = (
  entity: IResponseDetail,
  relations: Relation.IConnection<Relation.IRelation>[],
  entities: any,
  nodeW: number,
  nodeH: number
): Graph => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const levelNodes: Record<string, number> = {};
  const addNode = (entityId: string, level: number) => {
    if (!nodes.map((n) => n.id).includes(entityId)) {
      const sLevel = String(level);
      if (!Object.keys(levelNodes).includes(sLevel)) {
        levelNodes[sLevel] = 0;
      }
      levelNodes[sLevel] += 1;

      const entity = entities[entityId];

      nodes.push({
        id: entityId,
        type: "entityNode",
        data: { entity: entity, level: level },
        position: { x: level * nodeW, y: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        dragHandle: ".custom-drag-handle",
      });
    }
  };
  const addEdge = (
    sourceId: string,
    targetId: string,
    branch: Relation.IConnection<Relation.IRelation, Relation.IRelation>
  ) => {
    if (!edges.find((e) => e.source === sourceId && e.target === targetId)) {
      edges.push({
        id: String(edges.length),
        type: "relationship",
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          certainty:
            (
              branch as Relation.IConnection<
                Relation.IIdentification,
                Relation.IIdentification
              >
            ).certainty ?? undefined,
          relationType: branch.type,
        },
        style: {
          strokeWidth: 1,
          stroke: "black",
        },
        source: sourceId,
        target: targetId,
      });
    }
  };

  addNode(entity.id, 0);

  const getNodesFromSubtree = (
    sourceId: string,
    relationNode: Relation.IConnection<Relation.IRelation, Relation.IRelation>,
    level: number
  ) => {
    relationNode.subtrees &&
      relationNode.subtrees.forEach((branch: any) => {
        const [sourceEntityId, targetEntityId] =
          sourceId === branch.entityIds[0]
            ? branch.entityIds
            : [branch.entityIds[1], branch.entityIds[0]];

        addNode(targetEntityId, level);
        addEdge(sourceEntityId, targetEntityId, branch);

        getNodesFromSubtree(targetEntityId, branch, level + 1);
      });
  };

  relations.forEach((relation) => {
    const [sourceEntityId, targetEntityId] =
      entity.id === relation.entityIds[0]
        ? relation.entityIds
        : [relation.entityIds[1], relation.entityIds[0]];

    addNode(targetEntityId, 1);
    addEdge(sourceEntityId, targetEntityId, relation);

    getNodesFromSubtree(targetEntityId, relation, 2);
  });

  const maxOnLevel = Math.max(...Object.values(levelNodes));

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

    const newY = (p - (a + 1) / 2) * nodeH;

    return {
      ...node,
      ...{
        position: { y: newY, x: node.position.x },
      },
    };
  });

  return { nodes: nodesWithY, edges, maxHeight: (maxOnLevel + 1) * nodeH };
};

interface EntityDetailRelationGraph {
  relationRule: Relation.RelationRule;
  relationType: RelationEnums.Type;
  entity: IResponseDetail;
  entities: Record<string, IEntity>;
  relations: Relation.IConnection<Relation.IRelation>[];
}

export const EntityDetailRelationGraph: React.FC<EntityDetailRelationGraph> = ({
  relationRule,
  relationType,
  entity,
  entities,
  relations,
}) => {
  const nodeW = 200;
  const nodeH = 50;

  const [height, setHeight] = useState<number>(0);

  const { nodes, edges, maxHeight } = useMemo(() => {
    return convertToGraph(entity, relations, entities, nodeW, nodeH);
  }, [entity, relations]);

  useEffect(() => {
    setHeight(maxHeight);
  }, [maxHeight]);

  return (
    <StyledEntityDetailRelationGraph height={height}>
      {/* <div style={{ position: "absolute", top: 0, left: 0 }}>
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 6 6"
              refX="6"
              refY="3"
              markerUnits="strokeWidth"
              markerWidth="3"
              markerHeight="3"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 6 3 L 0 6 z" fill="currentColor" />
            </marker>
          </defs>
        </svg>
      </div> */}

      {/* {JSON.stringify(relations)} */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        style={{ backgroundColor: "white" }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        onInit={(reactFlowInstance: ReactFlowInstance) => {
          setTimeout(() => {
            reactFlowInstance.fitView();
          }, 100);
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        {/* <MiniMap /> */}
        <Controls showInteractive={false} showZoom={false} />
        <Background />
      </ReactFlow>
    </StyledEntityDetailRelationGraph>
  );
};
