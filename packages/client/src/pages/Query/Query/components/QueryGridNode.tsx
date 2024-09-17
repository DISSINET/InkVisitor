import { Query } from "@shared/types";
import { Button } from "components";
import React from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { INodeItem, QueryValidityProblem } from "../../types";
import { QueryAction, QueryActionType } from "../state";
import Dropdown from "components/advanced";
import { StyledGraphNode } from "./QueryStyles";

interface QueryGridNodeProps {
  node: INodeItem;
  edge: Query.IEdge | undefined;
  dispatch: React.Dispatch<QueryAction>;
  problems: QueryValidityProblem[];
}

export const QueryGridNode: React.FC<QueryGridNodeProps> = ({
  node,
  edge,
  dispatch,
  problems,
}) => {
  console.log("node", node, edge);

  const validSourceEdges = Query.findValidEdgeTypesForTarget(node.type);

  const isValid = problems.length === 0;

  const nodeTypeOptions = Object.values(Query.NodeType).map((type) => ({
    value: type,
    label: type.toString()[0],
    info: type.toString(),
  }));

  return (
    <div
      style={{
        borderColor: "white",
        borderWidth: 2,
        display: "flex",
        alignItems: "center",
        gap: "5px",
        width: "100%",
        height: "100%",
      }}
    >
      <StyledGraphNode
        style={{
          backgroundColor: isValid ? "dimgray" : "red",
        }}
      >
        <Dropdown.Single.Basic
          options={nodeTypeOptions}
          value={node.type}
          tooltipLabel="node type"
          width={45}
          noDropDownIndicator
          onChange={(newValue) => {
            dispatch({
              type: QueryActionType.updateNodeType,
              payload: {
                nodeId: node.id,
                newType: newValue,
              },
            });
          }}
        />
      </StyledGraphNode>
      <div>
        <Button
          icon={<FaPlus style={{ fontSize: "16px", padding: "2px" }} />}
          tooltipLabel="add new node"
          color="primary"
          onClick={() => {
            dispatch({
              type: QueryActionType.addNode,
              payload: {
                parentId: edge?.node.id,
              },
            });
          }}
        />
      </div>
      {node.gridX !== 0 && node.gridY !== 0 && (
        <div>
          <Button
            icon={<FaTrash style={{ fontSize: "16px", padding: "2px" }} />}
            tooltipLabel="remove this node"
            color="warning"
            onClick={() => {
              dispatch({
                type: QueryActionType.removeEdge,
                payload: {
                  edgeId: edge?.id,
                },
              });
            }}
          />
        </div>
      )}
    </div>
  );
};
