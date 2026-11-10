import { RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseEntityRelations, Relation } from "@inkvisitor/shared/types";
import ReactFlow, { Background, Controls, ReactFlowInstance } from "reactflow";
import "reactflow/dist/style.css";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "styled-components";
import {
  StyledEntityDetailRelationGraph,
  StyledGraphResizeHandle,
} from "../EntityDetailRelationTypeBlockStyles";

import { edgeTypes } from "./EntityDetailGraphEdge";
import { convertToGraph } from "./EntityDetailGraphLayout";
import { nodeTypes } from "./EntityDetailGraphNode";

const MIN_HEIGHT = 120;
const DEFAULT_MAX_HEIGHT = 400;

interface EntityDetailRelationGraph {
  relationRule: Relation.RelationRule;
  relationType: RelationEnums.Type;
  entity: IResponseEntityRelations;
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
  const theme = useTheme();
  const nodeW = 200;
  // leaves room between stacked nodes for an edge with its label and arrowheads
  const nodeH = 90;

  const { nodes, edges, maxHeight } = useMemo(() => {
    return convertToGraph(entity, relations, entities, nodeW, nodeH, relationRule.asymmetrical);
  }, [entity, relations, relationRule]);

  // the graph opens at its content height up to a cap, so a large tree never
  // starts taller than the viewport; a dragged height belongs to the entity it
  // was dragged on, since the graph stays mounted when the detail switches entity
  const [dragged, setDragged] = useState<{ entityId: string; height: number } | null>(null);
  const height =
    dragged?.entityId === entity.id ? dragged.height : Math.min(maxHeight, DEFAULT_MAX_HEIGHT);

  const flowInstance = useRef<ReactFlowInstance | null>(null);
  useEffect(() => {
    flowInstance.current?.fitView();
  }, [height]);
  // the graph instance stays mounted when the detail switches to another
  // entity; new nodes are measured only after they render, hence the delay
  useEffect(() => {
    const timer = setTimeout(() => flowInstance.current?.fitView(), 100);
    return () => clearTimeout(timer);
  }, [nodes]);

  const dragStart = useRef<{ clientY: number; height: number } | null>(null);
  const onResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    // pointer capture keeps the moves coming while the pointer is off the edge
    e.currentTarget.setPointerCapture(e.pointerId);
    // keeps the drag from selecting the text around the graph
    e.preventDefault();
    dragStart.current = { clientY: e.clientY, height };
  };
  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const requested = dragStart.current.height + e.clientY - dragStart.current.clientY;
    setDragged({ entityId: entity.id, height: Math.max(MIN_HEIGHT, requested) });
  };
  const onResizeEnd = () => {
    dragStart.current = null;
  };

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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        onInit={(reactFlowInstance: ReactFlowInstance) => {
          flowInstance.current = reactFlowInstance;
          setTimeout(() => {
            reactFlowInstance.fitView();
          }, 100);
        }}
        // the graph sits in the scrolling detail panel, so a plain wheel scrolls
        // the panel; ctrl + wheel and pinch still zoom
        zoomOnScroll={false}
        preventScrolling={false}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        {/* <MiniMap /> */}
        <Controls showInteractive={false} />
        <Background color={theme.color["gray"][500]} />
      </ReactFlow>
      <StyledGraphResizeHandle
        onPointerDown={onResizeStart}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
        onLostPointerCapture={onResizeEnd}
      />
    </StyledEntityDetailRelationGraph>
  );
};
