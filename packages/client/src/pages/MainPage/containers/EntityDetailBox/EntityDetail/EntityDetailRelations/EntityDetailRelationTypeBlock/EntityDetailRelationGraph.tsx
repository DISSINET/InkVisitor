import { RelationEnums } from "@shared/enums";
import { IEntity, IResponseDetail, Relation } from "@shared/types";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlowInstance,
  MarkerType,
  Edge,
  Node,
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  EdgeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

import {
  StyledEntityDetailRelationGraph,
  StyledEntityDetailRelationGraphButton,
} from "./EntityDetailRelationTypeBlockStyles";
import React, { memo, useEffect, useMemo, useState } from "react";
import { Button, LetterIcon } from "components";
import { EntityTag } from "components/advanced";
import { EntityDetailRelationTypeIcon } from "./EntityDetailRelationTypeIcon/EntityDetailRelationTypeIcon";

interface Graph {
  nodes: Node[];
  edges: Edge[];
}

const EntityNode: React.FC<{
  data: { entity: IResponseDetail; level: number };
}> = ({ data }) => {
  return (
    <>
      <Handle type="source" position={Position.Right} />
      <div>
        <EntityTag entity={data.entity} />
        <div className="custom-drag-handle"></div>
      </div>
      <Handle type="target" position={Position.Left} />
    </>
  );
};

const RelationshipEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const scaleLabel = 0.5;

  return (
    <>
      <path id={id} className="react-flow__edge-path" d={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px) scale(${scaleLabel},${scaleLabel})`,
          }}
          className="nodrag nopan"
        >
          <LetterIcon size={6} letter={data.relationType} color="info" />
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = {
  entityNode: EntityNode,
};

const edgeTypes: EdgeTypes = {
  relationship: RelationshipEdge,
};

const convertToGraph = (
  entity: IResponseDetail,
  relations: Relation.IConnection<Relation.IClassification>[],
  entities: any
): { nodes: Node[]; edges: Edge[]; maxHeight: number } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const nodeW = 120;
  const nodeH = 50;

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
  const addEdge = (sourceId: string, targetId: string) => {
    if (!edges.find((e) => e.source === sourceId && e.target === targetId)) {
      edges.push({
        id: String(edges.length),
        type: "relationship",
        markerEnd: "arrowhead",
        data: {
          relationType: RelationEnums.Type.Superclass,
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

  return { nodes: nodesWithY, edges, maxHeight: maxOnLevel * nodeH };
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
      <div style={{ position: "absolute", top: 0, left: 0 }}>
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 6 6"
              refX="6"
              refY="3"
              markerUnits="strokeWidth"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 6 3 L 0 6 z" fill="black" />
            </marker>
          </defs>
        </svg>
      </div>

      <StyledEntityDetailRelationGraphButton style={{ position: "relative" }}>
        <Button
          onClick={handleSetOpen}
          label={open ? "hide graph" : "open graph"}
        />
      </StyledEntityDetailRelationGraphButton>
      {/* {JSON.stringify(relations)} */}
      {open && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          style={{ backgroundColor: "white" }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={true}
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
