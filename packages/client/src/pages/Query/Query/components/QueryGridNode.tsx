import { Query } from "@shared/types";
import { Button } from "components";
import React from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { INodeItem, QueryValidityProblem } from "../../types";
import { QueryAction, QueryActionType } from "../state";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import { StyledGraphNode } from "./QueryStyles";
import { entitiesDict } from "@shared/dictionaries";
import { classesAll } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { useQuery } from "@tanstack/react-query";
import api from "api";

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
  const validSourceEdges = Query.findValidEdgeTypesForTarget(node.type);

  const isValid = problems.length === 0;

  const nodeTypeOptions = Object.values(Query.NodeType).map((type) => ({
    value: type,
    label: type.toString()[0],
    info: type.toString(),
  }));

  const { data: dataEntity } = useQuery({
    queryKey: ["entity", node.params.id ?? ""],
    queryFn: async () => {
      if (node.params.id) {
        const res = await api.entitiesGet(node.params.id);
        return res.data;
      } else {
        return undefined;
      }
    },
  });

  console.log(dataEntity);

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
      <Dropdown.Multi.Entity
        value={node.params.classes ?? [entitiesDict[0].value]}
        disableEmpty
        onChange={(newValue) => {
          dispatch({
            type: QueryActionType.updateNodeClass,
            payload: {
              nodeId: node.id,
              newClasses: newValue,
            },
          });
        }}
        options={entitiesDict}
        width={100}
        disabled={node.params.id !== undefined}
      />

      <div>
        {dataEntity !== undefined ? (
          <EntityTag
            entity={dataEntity}
            unlinkButton={{
              onClick: () => {
                dispatch({
                  type: QueryActionType.updateNodeEntityId,
                  payload: {
                    nodeId: node.id,
                    newType: undefined,
                  },
                });
              },
            }}
          />
        ) : (
          <EntitySuggester
            inputWidth={100}
            categoryTypes={classesAll}
            onSelected={(entityId: string) => {
              dispatch({
                type: QueryActionType.updateNodeEntityId,
                payload: {
                  nodeId: node.id,
                  newId: entityId,
                },
              });
            }}
          />
        )}
      </div>

      <div>
        <Button
          icon={<FaPlus style={{ fontSize: "16px", padding: "2px" }} />}
          tooltipLabel="add new edge"
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
