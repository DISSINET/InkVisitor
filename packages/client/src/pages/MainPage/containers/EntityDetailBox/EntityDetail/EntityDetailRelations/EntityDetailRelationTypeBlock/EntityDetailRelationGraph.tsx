import { EntityEnums, RelationEnums } from "@shared/enums";
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
import { Colors } from "types";
import { ThemeColor } from "Theme/theme";

/**
 * TODO:
 *  - clean the code
 *  - create separate components for node, edge
 *  - do not draw on default
 *  - fix and text certainties
 *  - edge tooltips - probably just the certainty
 *  - fix layout / define the problem in  a separate PR
 */
interface Graph {
  nodes: Node[];
  edges: Edge[];
}

const EntityNode: React.FC<{
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
        <div
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
  relations: Relation.IConnection<Relation.IRelation>[],
  entities: any,
  nodeW: number,
  nodeH: number
): { nodes: Node[]; edges: Edge[]; maxHeight: number } => {
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
        markerEnd: "arrowhead",
        data: {
          certainty:
            (
              branch as Relation.IConnection<
                Relation.IIdentification,
                Relation.IIdentification
              >
            ).certainty || 1,
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
  const [open, setOpen] = useState<boolean>(true);

  const nodeW = 150;
  const nodeH = 50;

  const handleSetOpen = () => {
    setOpen(!open);
  };
  const [height, setHeight] = useState<number>(500);

  const { nodes, edges, maxHeight } = useMemo(() => {
    return convertToGraph(entity, relations, entities, nodeW, nodeH);
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
          <Controls showInteractive={false} showZoom={false} />
          <Background />
        </ReactFlow>
      )}
    </StyledEntityDetailRelationGraph>
  );
};
