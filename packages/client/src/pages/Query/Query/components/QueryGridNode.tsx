import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { IcoPlusBold, IcoQuestion, IcoTrash, IcoWarning } from "Theme/icons";

import { entitiesDict } from "@inkvisitor/shared/dictionaries";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import api from "api";
import { Button, Checkbox, IconWithTooltip, SwitchGroup } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";

import { useTheme } from "styled-components";
import { INodeItem, QueryValidityProblem } from "../../types";
import { getRelationConstrainedCategoryTypes } from "../../utils";
import { QueryAction, QueryActionType } from "../state";
import {
  StyledGraphNode,
  StyledNodeContainer,
  StyledNodeExpansionToggles,
  StyledNodeMainRow,
  StyledTooltipList,
  StyledTooltipListItem,
} from "./QueryStyles";
import { ButtonSize } from "types";

interface QueryGridNodeProps {
  node: INodeItem;
  edge: Query.IEdge | undefined;
  rootNode: Query.INode;
  dispatch: React.Dispatch<QueryAction>;
  problems: QueryValidityProblem[];
  isRoot: boolean;
  onOpenEntityInDetail?: (entityId: string) => void;
}

export const QueryGridNode: React.FC<QueryGridNodeProps> = ({
  node,
  edge,
  rootNode,
  dispatch,
  problems,
  isRoot = false,
  onOpenEntityInDetail,
}) => {
  const theme = useTheme();
  const isValid = problems.length === 0;

  const nodeTypeOptions = Object.values(Query.NodeType).map((type) => ({
    value: type,
    label: type.toString()[0],
    info: type.toString(),
  }));

  const edgeType = edge?.type;
  const edgeLabel = edgeType ? Query.EdgeTypeLabels[edgeType] : "related";

  // edges whose target entity is mandatory: with an empty picker the backend
  // matches nothing (membership is only meaningful relative to a specific
  // territory/statement), so the generic "empty = any" hint does not apply -
  // these get a "requires a target entity" note instead. Mirrors the
  // `if (!id) matches nothing` guards in server/src/service/query/edge.ts.
  const edgeRequiresTarget =
    !!edgeType &&
    (
      [
        Query.EdgeType["IS:"],
        Query.EdgeType["I_IS:"],
        Query.EdgeType["SUT:"],
        Query.EdgeType["SUT:C"],
        Query.EdgeType["EUT:"],
      ] as Query.EdgeType[]
    ).includes(edgeType);

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

  // class label shown in the empty-suggester hint, e.g. "Concept". Only shown for
  // classes the user actively picked in the suggester (written back to
  // node.params.entityClasses on entityClass edges). When the suggester offers a
  // single forced option the class is obvious from the picker itself, so no hint.
  const selectedClassLabels =
    node.params.entityClasses && node.params.entityClasses.length > 0
      ? node.params.entityClasses
          .map((c) => entitiesDict.find((e) => e.value === c)?.label ?? c)
          .join(", ")
      : "";

  const isRelationEntityPickerDisabled =
    relationConstrainedCategoryTypes !== null && relationConstrainedCategoryTypes.length === 0;

  // the constraint comes from the root class and the edge together, so neither
  // named alone tells the user what to change
  const rootClassLabels =
    rootNode.params.entityClasses && rootNode.params.entityClasses.length > 0
      ? rootNode.params.entityClasses
          .map((c) => entitiesDict.find((e) => e.value === c)?.label ?? c)
          .join(", ")
      : "";

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
        <SwitchGroup
          $column
          $zIndex={10}
          pillColor="info"
          activeIndex={node.operator === Query.NodeOperator.And ? 0 : 1}
        >
          <Button
            size={ButtonSize.Medium}
            label="AND"
            shape="rounded-sm"
            noBorder
            inverted
            noBackground
            textColor={node.operator === Query.NodeOperator.And ? "white" : undefined}
            noHoverBackground={node.operator === Query.NodeOperator.And}
            color={node.operator === Query.NodeOperator.And ? "info" : "greyer"}
            bold={node.operator === Query.NodeOperator.And}
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
            size={ButtonSize.Medium}
            label="OR"
            shape="rounded-sm"
            noBorder
            inverted
            noBackground
            textColor={node.operator === Query.NodeOperator.Or ? "white" : undefined}
            noHoverBackground={node.operator === Query.NodeOperator.Or}
            color={node.operator === Query.NodeOperator.Or ? "info" : "greyer"}
            bold={node.operator === Query.NodeOperator.Or}
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
          style={{
            backgroundColor: nodeColor,
            border: `3px solid ${nodeBorder}`,
          }}
        >
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
                    tagMaxWidth={200}
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
                    // remount on edge type switch so the typed input and other
                    // internal state don't carry over to a different edge
                    key={edgeType}
                    inputWidth={212}
                    suggestionListWidth={320}
                    categoryTypes={entityIdCategoryTypes}
                    placeholder={
                      isRelationEntityPickerDisabled ? "no class for this edge" : "entity"
                    }
                    disableCreate
                    disabled={isRelationEntityPickerDisabled}
                    // seeds the class shown on mount / edge switch: the node's
                    // committed class, else the first class the edge allows.
                    // The suggester owns the selection afterwards, so a wildcard
                    // pick (which clears entityClasses) is not re-derived here.
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
                    rightContent={
                      <IconWithTooltip
                        color={
                          edgeRequiresTarget || isRelationEntityPickerDisabled
                            ? "warning"
                            : "success"
                        }
                        icon={
                          edgeRequiresTarget || isRelationEntityPickerDisabled ? (
                            <IcoWarning size={12} />
                          ) : (
                            <IcoQuestion size={11} />
                          )
                        }
                        tooltipPosition="top"
                        tooltipColor={
                          edgeRequiresTarget || isRelationEntityPickerDisabled
                            ? "tooltipNodeWarningBackground"
                            : "tooltipNodeInfoBackground"
                        }
                        tooltipLabel={
                          isRelationEntityPickerDisabled
                            ? "No allowed target class"
                            : "Empty Entity Suggester"
                        }
                        tooltipContent={
                          isRelationEntityPickerDisabled ? (
                            <p>
                              The "{edgeLabel}" relation allows no target class for{" "}
                              {rootClassLabels ? <b>{rootClassLabels}</b> : "the root node's class"}.
                              Change the root class or the edge type.
                            </p>
                          ) : edgeRequiresTarget ? (
                            <p>This edge requires a target entity.</p>
                          ) : (
                            <StyledTooltipList>
                              <StyledTooltipListItem>
                                <b>Empty</b> → matches any entity that has the "{edgeLabel}"
                                relation{" "}
                                {(selectedClassLabels && `of class ${selectedClassLabels}`) || ""}
                              </StyledTooltipListItem>
                              <StyledTooltipListItem>
                                <b>Empty + NOT</b> → matches nodes that have no "{edgeLabel}"
                                relation
                              </StyledTooltipListItem>
                            </StyledTooltipList>
                          )
                        }
                      />
                    }
                  />
                ))}
            </div>
          )}
          {!isRoot && !!paramEntityId && (
            <StyledNodeExpansionToggles>
              <Checkbox
                label="EQ"
                size={13}
                value={node.params.includeEquivalents === true}
                tooltipLabel="include equivalents"
                tooltipContent="Also include entities equivalent (SYN, IDE, AEE) to this node's target entity."
                onChangeFn={() => {
                  dispatch({
                    type: QueryActionType.updateNodeExpansionToggles,
                    payload: {
                      nodeId: node.id,
                      field: "includeEquivalents",
                      value: node.params.includeEquivalents === true ? undefined : true,
                    },
                  });
                }}
              />
              <Checkbox
                label="SUB"
                size={13}
                value={node.params.includeSubordinates === true}
                tooltipLabel="include subordinates"
                tooltipContent="Also include subordinate entities (subclasses, subordinates, meronyms and child territories, all levels) of this node's target entity."
                onChangeFn={() => {
                  dispatch({
                    type: QueryActionType.updateNodeExpansionToggles,
                    payload: {
                      nodeId: node.id,
                      field: "includeSubordinates",
                      value: node.params.includeSubordinates === true ? undefined : true,
                    },
                  });
                }}
              />
            </StyledNodeExpansionToggles>
          )}
        </StyledGraphNode>

        <div>
          <Button
            icon={<IcoPlusBold style={{ fontSize: "16px", padding: "2px" }} />}
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
              icon={<IcoTrash style={{ fontSize: "16px", padding: "2px" }} />}
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
