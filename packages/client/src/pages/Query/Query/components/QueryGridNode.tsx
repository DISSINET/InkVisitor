import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

import { entitiesDict } from "@shared/dictionaries";
import { classesAll } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { Query } from "@shared/types/query";
import api from "api";
import { Button } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import theme from "Theme/theme";

import { INodeItem, QueryValidityProblem } from "../../types";
import { QueryAction, QueryActionType } from "../state";
import { StyledGraphNode, StyledNodeTypeSelect } from "./QueryStyles";

interface QueryGridNodeProps {
  node: INodeItem;
  edge: Query.IEdge | undefined;
  dispatch: React.Dispatch<QueryAction>;
  problems: QueryValidityProblem[];
  isRoot: boolean;
}

export const QueryGridNode: React.FC<QueryGridNodeProps> = ({
  node,
  edge,
  dispatch,
  problems,
  isRoot = false,
}) => {
  const isValid = problems.length === 0;

  const nodeTypeOptions = Object.values(Query.NodeType).map((type) => ({
    value: type,
    label: type.toString()[0],
    info: type.toString(),
  }));

  const edgeType = edge?.type;

  const nodeParams = edgeType ? Query.EdgeTypeTargetNodeParams[edgeType] : {};

  const { entityId: paramEntityId, entityClass: paramEntityClass } = nodeParams;

  const { data: dataEntity } = useQuery({
    queryKey: ["entity", node.params.entityId ?? ""],
    queryFn: async () => {
      if (node.params.entityId) {
        const res = await api.entitiesGet(node.params.entityId);
        return res.data;
      } else {
        return undefined;
      }
    },
  });

  const nodeBorder = useMemo(() => {
    if (isValid) {
      if (isRoot) {
        return theme.color.query2;
      } else {
        return theme.color.query2;
      }
    }
    return "none";
  }, [isValid, isRoot]);

  const nodeColor = useMemo(() => {
    if (isValid) {
      if (isRoot) {
        return theme.color.query2;
      }
      return theme.color.query1;
    } else {
      return theme.color.queryInvalid;
    }
  }, [isValid, isRoot]);

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
          backgroundColor: nodeColor,
          border: `3px solid ${nodeBorder}`,
        }}
      >
        <StyledNodeTypeSelect>
          <Dropdown.Single.Basic
            options={nodeTypeOptions}
            value={node.type}
            tooltipLabel="node type"
            width={30}
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
        </StyledNodeTypeSelect>
        {(paramEntityClass || isRoot) && (
          <Dropdown.Multi.Entity
            value={node.params.entityClasses ?? [entitiesDict[0].value]}
            disableEmpty
            onChange={(newValue) => {
              dispatch({
                type: QueryActionType.updateNodeClass,
                payload: {
                  nodeId: node.id,
                  newEntityClasses: newValue,
                },
              });
            }}
            options={
              isRoot || paramEntityClass.allowedClasses.length === 0
                ? entitiesDict
                : entitiesDict.filter((ecl) =>
                    paramEntityClass.allowedClasses.includes(ecl.value)
                  )
            }
            width={150}
            noOptionsMessage="entity class"
            disabled={node.params.entityId !== undefined}
          />
        )}
        {paramEntityId && (
          <div>
            {isRoot === false &&
              (dataEntity !== undefined ? (
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
                  categoryTypes={
                    paramEntityId.allowedClasses.length === 0
                      ? classesAll
                      : paramEntityId.allowedClasses
                  }
                  placeholder="entity"
                  disableCreate
                  initCategory={
                    node.params.entityClasses?.[0] ??
                    paramEntityId.allowedClasses[0] ??
                    EntityEnums.Class.Concept
                  }
                  onSelected={(entityId: string) => {
                    dispatch({
                      type: QueryActionType.updateNodeEntityId,
                      payload: {
                        nodeId: node.id,
                        newEntityId: entityId,
                      },
                    });
                  }}
                />
              ))}
          </div>
        )}
      </StyledGraphNode>

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
