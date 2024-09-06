import { Query } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { useAppSelector } from "redux/hooks";
import { INodeItem } from "../types";
import { Button } from "components";
import { FaPlus, FaPlusCircle, FaTrash } from "react-icons/fa";
import { QueryAction, QueryActionType } from "../state";

interface QueryGridNodeProps {
  node: INodeItem;
  edge: Query.IEdge | undefined;
  dispatch: React.Dispatch<QueryAction>;
}

export const QueryGridNode: React.FC<QueryGridNodeProps> = ({
  node,
  edge,
  dispatch,
}) => {
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
      <div
        style={{
          borderRadius: "20px",
          backgroundColor: "darkgrey",
          color: "white",
          width: "35px",
          height: "35px",
          padding: 0,
          fontWeight: "bold",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {node.type.substring(0, 1)}
      </div>
      <div>
        <Button
          icon={<FaPlus style={{ fontSize: "16px", padding: "2px" }} />}
          tooltipLabel="add new node"
          color="primary"
          onClick={() => {
            dispatch({
              type: QueryActionType.addNode,
              payload: {
                parentId: node.id,
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
