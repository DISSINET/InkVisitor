import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useRef, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

import { entitiesDict } from "@inkvisitor/shared/dictionaries";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import api from "api";
import { Button, Checkbox, SwitchGroup, Tooltip } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";

import { getRelationConstrainedCategoryTypes } from "../../utils";
import { INodeItem, QueryValidityProblem } from "../../types";
import { QueryAction, QueryActionType } from "../state";
import {
  StyledGraphNode,
  StyledNodeContainer,
  StyledNodeMainRow,
  StyledNodeTypeSelect,
  StyledParallelOperator,
} from "./QueryStyles";
import { useTheme } from "styled-components";

interface QueryGridNodeProps {
  node: INodeItem;
  edge: Query.IEdge | undefined;
  rootNode: Query.INode;
  dispatch: React.Dispatch<QueryAction>;
  problems: QueryValidityProblem[];
  isRoot: boolean;
  onOpenEntityInDetail?: (entityId: string) => void;
  // page-level expansion options (#2969): the node-edge entity picker surfaces
  // subordinates/equivalents (badged) so they can be picked directly
  includeEquivalents?: boolean;
  includeSubordinates?: boolean;
}

export const QueryGridNode: React.FC<QueryGridNodeProps> = ({
  node,
  edge,
  rootNode,
  dispatch,
  problems,
  isRoot = false,
  onOpenEntityInDetail,
  includeEquivalents = false,
  includeSubordinates = false,
}) => {
  const theme = useTheme();
  const isValid = problems.length === 0;

  const [nodeHovered, setNodeHovered] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const nodeTypeOptions = Object.values(Query.NodeType).map((type) => ({
    value: type,
    label: type.toString()[0],
    info: type.toString(),
  }));

  const edgeType = edge?.type;

  const nodeParams = edgeType ? Query.EdgeTypeTargetNodeParams[edgeType] : {};

  const { entityId: paramEntityId, entityClass: paramEntityClass } = nodeParams;

  const relationConstrainedCategoryTypes = useMemo(
    () => getRelationConstrainedCategoryTypes(edgeType, rootNode.params.entityClasses),
    [edgeType, rootNode.params.entityClasses],
  );

  const entityIdCategoryTypes = useMemo(() => {
    if (!paramEntityId) {
      return classesAll;
    }
    if (relationConstrainedCategoryTypes !== null) {
      return relationConstrainedCategoryTypes;
    }
    return paramEntityId.allowedClasses.length === 0 ? classesAll : paramEntityId.allowedClasses;
  }, [paramEntityId, relationConstrainedCategoryTypes]);

  const isRelationEntityPickerDisabled =
    relationConstrainedCategoryTypes !== null && relationConstrainedCategoryTypes.length === 0;

  const entityId = node.params.entityId;

  const { data: dataEntity } = useQuery({
    queryKey: ["entity", "query-grid-node", entityId],
    queryFn: async () => {
      const res = await api.entityGet(entityId!);
      return res.data;
    },
    enabled: !!entityId && api.isLoggedIn(),
  });

  // a node reached through a negative ("NOT") edge gets a red border to match
  // that edge; scoped to this node only - deeper nodes have their own edges
  const isNegativeEdge = edge?.logic === Query.EdgeLogic.Negative;

  const nodeBorder = useMemo(() => {
    if (!isValid) {
      return "none";
    }
    if (isNegativeEdge) {
      return theme.color.entityA;
    }
    return theme.color.query2;
  }, [theme, isValid, isNegativeEdge]);

  const nodeColor = useMemo(() => {
    if (isValid) {
      if (isRoot) {
        return theme.color.query2;
      }
      return theme.color.query1;
    } else {
      return theme.color.queryInvalid;
    }
  }, [theme, isValid, isRoot]);

  const hasParallelEdges = isRoot && node.edges.length > 1;

  return (
    <StyledNodeContainer>
      {hasParallelEdges && (
        <SwitchGroup $column>
          <Button
            label="AND"
            shape="rounded-sm"
            noBorder
            inverted={node.operator !== Query.NodeOperator.And}
            noBackground={node.operator !== Query.NodeOperator.And}
            color={node.operator === Query.NodeOperator.And ? "primary" : "greyer"}
            tooltipLabel="match all parallel branches"
            onClick={() => {
              dispatch({
                type: QueryActionType.updateNodeOperator,
                payload: {
                  nodeId: node.id,
                  newOperator: Query.NodeOperator.And,
                },
              });
            }}
          />
          <Button
            label="OR"
            shape="rounded-sm"
            noBorder
            inverted={node.operator !== Query.NodeOperator.Or}
            noBackground={node.operator !== Query.NodeOperator.Or}
            color={node.operator === Query.NodeOperator.Or ? "primary" : "greyer"}
            tooltipLabel="match any parallel branch"
            onClick={() => {
              dispatch({
                type: QueryActionType.updateNodeOperator,
                payload: {
                  nodeId: node.id,
                  newOperator: Query.NodeOperator.Or,
                },
              });
            }}
          />
        </SwitchGroup>
      )}
      <StyledNodeMainRow>
        <StyledGraphNode
          ref={nodeRef}
          onMouseEnter={() => setNodeHovered(true)}
          onMouseLeave={() => setNodeHovered(false)}
          style={{
            backgroundColor: nodeColor,
            border: `3px solid ${nodeBorder}`,
          }}
        >
          {!isRoot && paramEntityId && (
            <Tooltip
              visible={nodeHovered}
              referenceElement={nodeRef.current}
              content={
                paramEntityClass ? (
                  <>
                    <p>
                      Empty suggester entity = any entity of selected class (select * for all
                      classes).
                    </p>
                    <p>NOT with empty suggester entity = not has [edge type] entity empty.</p>
                  </>
                ) : (
                  <>
                    <p>Empty suggester entity = any entity.</p>
                    <p>NOT with empty suggester entity = not has [edge type] entity empty.</p>
                  </>
                )
              }
              position="top"
              color="tooltipNodeBackground"
            />
          )}
          {/* <StyledNodeTypeSelect>
          <Dropdown.Single.Basic
            options={nodeTypeOptions}
            value={node.type}
            tooltipLabel={`node type: ${node.type}`}
            tooltipPosition="top"
            width={30}
            noDropDownIndicator
            disableTyping
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
        </StyledNodeTypeSelect> */}
          {(paramEntityClass || isRoot) && !(paramEntityId && !isRoot) && (
            <Dropdown.Multi.Entity
              shortLabel
              closeMenuOnSelect={false}
              value={node.params.entityClasses ?? []}
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
                      paramEntityClass.allowedClasses.includes(ecl.value),
                    )
              }
              width={
                node.params.entityClasses && node.params.entityClasses.length > 4
                  ? 270
                  : node.params.entityClasses && node.params.entityClasses.length > 0
                    ? node.params.entityClasses.length * 37 + 60
                    : 110
              }
              noOptionsMessage="entity class"
              placeholder="all classes"
              disabled={node.params.entityId !== undefined}
              limitSelectedItems={Math.floor((270 - 110) / 37)}
            />
          )}
          {paramEntityId && (
            <div>
              {isRoot === false &&
                (dataEntity !== undefined ? (
                  <EntityTag
                    entity={dataEntity}
                    onDoubleClick={() => onOpenEntityInDetail?.(dataEntity.id)}
                    unlinkButton={{
                      onClick: () => {
                        dispatch({
                          type: QueryActionType.updateNodeEntityId,
                          payload: {
                            nodeId: node.id,
                            newEntityId: undefined,
                          },
                        });
                      },
                    }}
                  />
                ) : (
                  <EntitySuggester
                    inputWidth={100}
                    categoryTypes={entityIdCategoryTypes}
                    placeholder="entity"
                    disableCreate
                    includeEquivalents={includeEquivalents}
                    includeSubordinates={includeSubordinates}
                    disabled={isRelationEntityPickerDisabled}
                    initCategory={
                      node.params.entityClasses?.[0] ??
                      entityIdCategoryTypes[0] ??
                      EntityEnums.Class.Concept
                    }
                    onChangeCategory={(option) => {
                      if (paramEntityClass) {
                        const newClasses =
                          option === EntityEnums.Extension.Any ? [] : [option as EntityEnums.Class];
                        dispatch({
                          type: QueryActionType.updateNodeClass,
                          payload: {
                            nodeId: node.id,
                            newEntityClasses: newClasses,
                          },
                        });
                      }
                    }}
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
        {node.gridX !== 0 && node.gridY !== 0 && edge && (
          <div>
            <Button
              icon={<FaTrash style={{ fontSize: "16px", padding: "2px" }} />}
              tooltipLabel="remove this node"
              color="warning"
              onClick={() => {
                dispatch({
                  type: QueryActionType.removeEdge,
                  payload: {
                    edgeId: edge.id,
                  },
                });
              }}
            />
          </div>
        )}
      </StyledNodeMainRow>
    </StyledNodeContainer>
  );
};
