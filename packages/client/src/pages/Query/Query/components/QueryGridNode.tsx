import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { IcoPlusBold, IcoQuestion, IcoTrash, IcoWarning } from "Theme/icons";

import { entitiesDict } from "@inkvisitor/shared/dictionaries";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Explore, Query } from "@inkvisitor/shared/types/query";
import api from "api";
import { useOrderedLanguageDict } from "hooks/react-query";
import { Button, Checkbox, IconWithTooltip, Input, SwitchGroup } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";

import { useTheme } from "styled-components";
import {
  edgeTypesWithoutSubordinates,
  edgeTypesWithSubtreeDepth,
  INodeItem,
  QueryValidityProblem,
} from "../../types";
import { entityPickerInitCategory, getRelationConstrainedCategoryTypes } from "../../utils";
import {
  classesReach,
  countNodeFilters,
  LOGICAL_TYPE_CLASSES,
  PART_OF_SPEECH_CLASSES,
} from "../utils";
import { FilterPopover } from "../../FilterPopover/FilterPopover";
import {
  StyledForm,
  StyledRow,
  StyledRowControl,
  StyledRowHeader,
} from "../../FloatingSearchContainer/FloatingSearchFormStyles";
import { CoOccurrencePicker } from "../../FloatingSearchContainer/CoOccurrencePicker";
import {
  logicalTypeFilterOptions,
  partOfSpeechFilterOptions,
  statusFilterOptions,
} from "../../FloatingSearchContainer/attributeFilterOptions";
import {
  DateRangeFilter,
  parseDate,
} from "../../FloatingSearchContainer/DateRangeFilter";
import { expansionCount } from "../nodeExpansion";
import { useEntityExpansion } from "../useEntityExpansion";
import { NodeExpansionPopover } from "./NodeExpansionPopover";
import { NodeFilterMatches } from "./NodeFilterMatches";
import { NodeUserFilterRows } from "./NodeUserFilterRows";
import { QueryAction, QueryActionType } from "../state";
import {
  StyledExpansionCountButton,
  StyledExpansionToggleGroup,
  StyledGraphNode,
  StyledNodeContainer,
  StyledNodeExpansionToggles,
  StyledNodeMainRow,
  StyledParallelOperatorSlot,
  StyledStartNodeIcon,
  StyledTooltipList,
  StyledTooltipListItem,
} from "./QueryStyles";
import { ButtonSize } from "types";

interface QueryGridNodeProps {
  node: INodeItem;
  edge: Query.IEdge | undefined;
  // classes the node this node's edge hangs off can hold, empty for any; the
  // root has no such node
  sourceClasses?: EntityEnums.Class[];
  dispatch: React.Dispatch<QueryAction>;
  problems: QueryValidityProblem[];
  isRoot: boolean;
  onOpenEntityInDetail?: (entityId: string) => void;
  // the value node of an HP: / SP: edge; removing it keeps the edge and its type node
  isValueNode?: boolean;
}

export const QueryGridNode: React.FC<QueryGridNodeProps> = ({
  node,
  edge,
  sourceClasses,
  dispatch,
  problems,
  isRoot = false,
  onOpenEntityInDetail,
  isValueNode = false,
}) => {
  const theme = useTheme();
  const isValid = problems.every((problem) => problem.warning);
  // a node's warnings are those of a start node's SE edge, which is not drawn
  const warning = problems.find((problem) => problem.warning);

  const nodeTypeOptions = Object.values(Query.NodeType).map((type) => ({
    value: type,
    label: type.toString()[0],
    info: type.toString(),
  }));

  const edgeType = edge?.type;
  // a saved query can hold an edge type from a newer build, with no label or target params here
  const edgeLabel = edgeType ? (Query.EdgeTypeLabels[edgeType] ?? edgeType) : "related";
  // a start node is the entity itself, so it is narrowed by its classes, as the root
  // is; it sits in the root's column and is drawn as a root
  const isStartNode = edgeType === Query.EdgeType.SE;

  const nodeParams = (edgeType && Query.EdgeTypeTargetNodeParams[edgeType]) || {};

  const { entityId: paramEntityId, entityClass: paramEntityClass } = nodeParams;

  // the suggester below re-seeds the class it shows whenever it is handed a new
  // list of allowed classes, so the list is rebuilt only when the source's
  // classes differ in content
  const sourceClassesKey = sourceClasses?.join();
  const relationConstrainedCategoryTypes = useMemo(
    () => getRelationConstrainedCategoryTypes(edgeType, sourceClasses),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [edgeType, sourceClassesKey],
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

  // the constraint comes from the source node's class and the edge together,
  // so neither named alone tells the user what to change
  const sourceClassLabels = (sourceClasses ?? [])
    .map((c) => entitiesDict.find((e) => e.value === c)?.label ?? c)
    .join(", ");

  const entityId = node.params.entityId;
  // a start node shows its entity only while one is pinned (a loaded query), so
  // it can be unlinked; EQ / SUB widen only a pinned entity, so they go with it
  const showsEntityPicker = !!paramEntityId && !(isStartNode && !entityId);
  const orderedLanguageDict = useOrderedLanguageDict();

  // the classes this node's entities can be of, empty for any; a filter on a field none of
  // them carries is offered only while it still holds a value, so it can be cleared
  const nodeClasses = node.params.entityClasses?.length
    ? node.params.entityClasses
    : (relationConstrainedCategoryTypes ?? paramEntityId?.allowedClasses ?? []);
  const showLogicalType =
    classesReach(nodeClasses, LOGICAL_TYPE_CLASSES) || !!node.params.entityLogicalTypes?.length;
  const showPartOfSpeech =
    classesReach(nodeClasses, PART_OF_SPEECH_CLASSES) ||
    !!node.params.entityPartsOfSpeech?.length;

  const updateFilters = (changes: Partial<Query.INodeParams>) =>
    dispatch({ type: QueryActionType.updateNodeFilters, payload: { nodeId: node.id, changes } });

  const { data: dataEntity } = useQuery({
    queryKey: ["entity", "query-grid-node", entityId],
    queryFn: async () => {
      const res = await api.entityGet(entityId!);
      return res.data;
    },
    enabled: !!entityId && api.isLoggedIn(),
  });

  // EQ / SUB only widen a picked entity, and not on every edge; a toggle that
  // does not apply reads as off, whatever the node params still carry
  const withoutSubordinates = !!edgeType && edgeTypesWithoutSubordinates.includes(edgeType);
  const subordinatesAsDepth = !!edgeType && edgeTypesWithSubtreeDepth.includes(edgeType);
  const equivalentsApply = !!entityId;
  const subordinatesApply = !!entityId && !withoutSubordinates;
  const includeEquivalents = equivalentsApply && node.params.includeEquivalents === true;
  const includeSubordinates = subordinatesApply && node.params.includeSubordinates === true;
  // with no entity picked yet, a toggle shows the params it will apply once one is picked,
  // disabled; on an edge without subordinates SUB stays off, as it never applies there
  const showEquivalents = entityId ? includeEquivalents : node.params.includeEquivalents === true;
  const showSubordinates =
    entityId || withoutSubordinates
      ? includeSubordinates
      : node.params.includeSubordinates === true;

  const {
    dataExpansion,
    isExpansionFetching,
    isExpansionError,
    openExpansionGroup,
    setOpenExpansionGroup,
    equivalentsBadgeRef,
    subordinatesBadgeRef,
    openExpansion,
  } = useEntityExpansion(entityId, includeEquivalents, includeSubordinates);

  // a node reached through a negative ("NOT") edge gets a grey border to match
  // that edge; scoped to this node only - deeper nodes have their own edges. The value node
  // of HP: / SP: also turns grey when NOT is on its "with value" box alone
  const isNegativeEdge =
    edge?.logic === Query.EdgeLogic.Negative ||
    (isValueNode && edge?.valueLogic === Query.EdgeLogic.Negative);

  const nodeBorder = useMemo(() => {
    if (!isValid) {
      return "none";
    }
    if (isNegativeEdge) {
      return theme.color.queryNegative;
    }
    return theme.color.query2;
  }, [theme, isValid, isNegativeEdge]);

  const nodeColor = useMemo(() => {
    if (isValid) {
      if (isRoot || isStartNode) {
        return theme.color.query2;
      }
      return theme.color.query1;
    } else {
      return theme.color.queryInvalid;
    }
  }, [theme, isValid, isRoot, isStartNode]);

  const hasParallelEdges = (isRoot || isStartNode) && node.edges.length > 1;

  return (
    <StyledNodeContainer data-testid={isStartNode ? "query-start-node" : undefined}>
      {hasParallelEdges && (
        <StyledParallelOperatorSlot>
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
              textRegular={node.operator !== Query.NodeOperator.And}
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
              textRegular={node.operator !== Query.NodeOperator.Or}
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
        </StyledParallelOperatorSlot>
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
          {(isRoot || (paramEntityClass && !showsEntityPicker)) && (
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
          {/* the root node's own status is filtered in the Filters panel of the
              search rows (Explore status filter), so the node filters are
              offered only on edge targets */}
          {!isRoot && !node.params.entityId && (
            <FilterPopover
              label="filters"
              title="Node filters"
              count={countNodeFilters(node.params)}
              tooltipLabel="filters for the entities of this node"
              width="32rem"
              onBlueFill={isStartNode}
              // beside the button, the panel takes the window's height
              placement="right"
              onClear={() =>
                dispatch({ type: QueryActionType.clearNodeFilters, payload: { nodeId: node.id } })
              }
            >
              <StyledForm>
                <StyledRow>
                  <StyledRowHeader>label</StyledRowHeader>
                  <StyledRowControl>
                    {/* matched from the start of a word, as the main search box matches */}
                    <Input
                      width="full"
                      value={node.params.label ?? ""}
                      placeholder="any label"
                      changeOnType
                      clearable
                      onChangeFn={(newLabel: string) => updateFilters({ label: newLabel })}
                    />
                  </StyledRowControl>
                </StyledRow>
                <StyledRow>
                  <StyledRowHeader>status</StyledRowHeader>
                  <StyledRowControl>
                    <Dropdown.Multi.Basic
                      value={node.params.entityStatuses ?? []}
                      placeholder="any status"
                      width="full"
                      options={statusFilterOptions}
                      onChange={(entityStatuses) => updateFilters({ entityStatuses })}
                    />
                  </StyledRowControl>
                </StyledRow>
                <StyledRow>
                  <StyledRowHeader>language</StyledRowHeader>
                  <StyledRowControl>
                    <Dropdown.Multi.Basic
                      value={node.params.entityLanguages ?? []}
                      placeholder="any language"
                      width="full"
                      options={orderedLanguageDict}
                      onChange={(entityLanguages) => updateFilters({ entityLanguages })}
                    />
                  </StyledRowControl>
                </StyledRow>
                {showLogicalType && (
                  <StyledRow>
                    <StyledRowHeader>logical type</StyledRowHeader>
                    <StyledRowControl>
                      <Dropdown.Multi.Basic
                        value={node.params.entityLogicalTypes ?? []}
                        placeholder="any logical type"
                        width="full"
                        options={logicalTypeFilterOptions}
                        onChange={(entityLogicalTypes) => updateFilters({ entityLogicalTypes })}
                      />
                    </StyledRowControl>
                  </StyledRow>
                )}
                {showPartOfSpeech && (
                  <StyledRow>
                    <StyledRowHeader>part of speech</StyledRowHeader>
                    <StyledRowControl>
                      <Dropdown.Multi.Basic
                        value={node.params.entityPartsOfSpeech ?? []}
                        placeholder="any part of speech"
                        width="full"
                        options={partOfSpeechFilterOptions}
                        onChange={(entityPartsOfSpeech) =>
                          updateFilters({ entityPartsOfSpeech })
                        }
                      />
                    </StyledRowControl>
                  </StyledRow>
                )}
                <StyledRow>
                  <StyledRowHeader>{Explore.SearchOption.CoOccurrence}</StyledRowHeader>
                  <StyledRowControl>
                    <CoOccurrencePicker
                      entityIds={node.params.coOccurrence ?? []}
                      onChange={(coOccurrence) => updateFilters({ coOccurrence })}
                    />
                  </StyledRowControl>
                </StyledRow>
                <StyledRow>
                  <StyledRowHeader $belowFieldLabel>date created</StyledRowHeader>
                  <StyledRowControl>
                    <DateRangeFilter
                      after={parseDate(node.params.createdAfter)}
                      before={parseDate(node.params.createdBefore)}
                      onChange={(after, before) =>
                        updateFilters({
                          createdAfter: after?.toISOString(),
                          createdBefore: before?.toISOString(),
                        })
                      }
                    />
                  </StyledRowControl>
                </StyledRow>
                <StyledRow>
                  <StyledRowHeader $belowFieldLabel>date updated</StyledRowHeader>
                  <StyledRowControl>
                    <DateRangeFilter
                      after={parseDate(node.params.updatedAfter)}
                      before={parseDate(node.params.updatedBefore)}
                      onChange={(after, before) =>
                        updateFilters({
                          updatedAfter: after?.toISOString(),
                          updatedBefore: before?.toISOString(),
                        })
                      }
                    />
                  </StyledRowControl>
                </StyledRow>
                <NodeUserFilterRows params={node.params} onChange={updateFilters} />
              </StyledForm>
            </FilterPopover>
          )}
          {!isRoot &&
            !node.params.entityId &&
            (countNodeFilters(node.params) > 0 || node.edges.length > 0) && (
              <NodeFilterMatches
                node={node}
                edgeType={edgeType}
                onOpenEntityInDetail={onOpenEntityInDetail}
                isOnStartNode={isStartNode}
              />
            )}
          {showsEntityPicker && (
            <div>
              {isRoot === false &&
                (dataEntity !== undefined ? (
                  <EntityTag
                    fullWidth
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
                    // internal state don't carry over to a different edge, and
                    // per node, since a grid cell passes to another node when
                    // one above it is removed
                    key={`${node.id}:${edgeType}`}
                    inputWidth={212}
                    suggestionListWidth={320}
                    categoryTypes={entityIdCategoryTypes}
                    placeholder={
                      isRelationEntityPickerDisabled
                        ? "no class for this edge"
                        : isValueNode
                          ? "value"
                          : edgeType && Query.TupleValueEdgeTypes[edgeType]
                            ? "type"
                            : "entity"
                    }
                    disableCreate
                    disabled={isRelationEntityPickerDisabled}
                    // seeds the class shown on mount / edge switch: the node's
                    // committed class, the wildcard when its class filter is
                    // cleared, else the wildcard its empty (any-class) list
                    // stands for, or the sole class the edge allows.
                    // The suggester owns the selection afterwards, so a wildcard
                    // pick (which clears entityClasses) is not re-derived here.
                    initCategory={
                      paramEntityClass && node.params.entityClasses?.length === 0
                        ? undefined
                        : entityPickerInitCategory(node.params.entityClasses, entityIdCategoryTypes)
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
                        color={isRelationEntityPickerDisabled ? "warning" : "success"}
                        icon={
                          isRelationEntityPickerDisabled ? (
                            <IcoWarning size={12} />
                          ) : (
                            <IcoQuestion size={11} />
                          )
                        }
                        tooltipPosition="top"
                        tooltipColor={
                          isRelationEntityPickerDisabled
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
                              {sourceClassLabels ? (
                                <b>{sourceClassLabels}</b>
                              ) : (
                                "the node it starts from"
                              )}
                              . Change that node's class or the edge type.
                            </p>
                          ) : (
                            <StyledTooltipList>
                              <StyledTooltipListItem>
                                <b>Empty</b> → matches any entity{" "}
                                {isStartNode ? "" : `that has the "${edgeLabel}" relation `}
                                {(selectedClassLabels && `of class ${selectedClassLabels}`) || ""}
                              </StyledTooltipListItem>
                              <StyledTooltipListItem>
                                <b>Empty + NOT</b> → matches{" "}
                                {isStartNode
                                  ? "the entities this start node leaves out"
                                  : `nodes that have no "${edgeLabel}" relation`}
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
          {!isRoot && showsEntityPicker && (
            <StyledNodeExpansionToggles>
              <StyledExpansionToggleGroup>
                <Checkbox
                  label="EQ"
                  size={13}
                  color="info"
                  value={showEquivalents}
                  disabled={!equivalentsApply}
                  tooltipLabel="include equivalents"
                  tooltipContent={
                    entityId
                      ? "Also include entities equivalent (SYN, IDE, AEE) to this node."
                      : "Pick an entity to include its equivalents."
                  }
                  onChangeFn={() => {
                    dispatch({
                      type: QueryActionType.updateNodeExpansionToggles,
                      payload: {
                        nodeId: node.id,
                        field: "includeEquivalents",
                        value: includeEquivalents ? undefined : true,
                      },
                    });
                  }}
                  disableEnterKey
                />
                {!!entityId && includeEquivalents && (
                  <StyledExpansionCountButton
                    ref={equivalentsBadgeRef}
                    type="button"
                    title="show the equivalent entities"
                    onClick={() => openExpansion("equivalents")}
                  >
                    {expansionCount(dataExpansion, "equivalents") ?? "…"}
                  </StyledExpansionCountButton>
                )}
              </StyledExpansionToggleGroup>
              <StyledExpansionToggleGroup>
                <Checkbox
                  label="SUB"
                  size={13}
                  color="warning"
                  value={showSubordinates}
                  disabled={!subordinatesApply}
                  tooltipLabel={
                    subordinatesAsDepth ? "match the whole subtree" : "include subordinates"
                  }
                  tooltipContent={
                    !entityId
                      ? "Pick an entity to include its subordinates."
                      : subordinatesAsDepth
                        ? "Match every territory below the picked one, not just its direct children."
                        : withoutSubordinates
                          ? "This edge looks upward at the territory's ancestors, so subordinates don't apply."
                          : "Also include subordinate entities (subclasses, subordinates, meronyms and child territories, all levels) of this node."
                  }
                  onChangeFn={() => {
                    dispatch({
                      type: QueryActionType.updateNodeExpansionToggles,
                      payload: {
                        nodeId: node.id,
                        field: "includeSubordinates",
                        value: includeSubordinates ? undefined : true,
                      },
                    });
                  }}
                  disableEnterKey
                />
                {!!entityId && includeSubordinates && (
                  <StyledExpansionCountButton
                    ref={subordinatesBadgeRef}
                    type="button"
                    title="show the subordinate entities"
                    onClick={() => openExpansion("subordinates")}
                  >
                    {expansionCount(dataExpansion, "subordinates") ?? "…"}
                  </StyledExpansionCountButton>
                )}
              </StyledExpansionToggleGroup>
              {openExpansionGroup !== null && (
                <NodeExpansionPopover
                  referenceElement={
                    openExpansionGroup === "equivalents"
                      ? equivalentsBadgeRef.current
                      : subordinatesBadgeRef.current
                  }
                  group={openExpansionGroup}
                  data={dataExpansion}
                  isLoading={isExpansionFetching}
                  isError={isExpansionError}
                  onClose={() => setOpenExpansionGroup(null)}
                  onOpenEntityInDetail={onOpenEntityInDetail}
                />
              )}
            </StyledNodeExpansionToggles>
          )}
          {warning && (
            <IconWithTooltip
              icon={<IcoWarning size={16} />}
              color="warning"
              tooltipText={warning.text}
              tooltipPosition="top"
            />
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
        {(isRoot || isStartNode) && (
          <div>
            <Button
              icon={<StyledStartNodeIcon />}
              tooltipLabel="add start node"
              dataTestId="add-start-node"
              color="primary"
              onClick={() => dispatch({ type: QueryActionType.addStartNode })}
            />
          </div>
        )}
        {edge && (
          <div>
            <Button
              icon={<IcoTrash style={{ fontSize: "16px", padding: "2px" }} />}
              tooltipLabel={isValueNode ? "remove the value node" : "remove this node"}
              color="warning"
              onClick={() => {
                // a value node's edge is its HP: / SP: edge, under that edge's id
                dispatch(
                  isValueNode
                    ? {
                        type: QueryActionType.updateEdgeValueNode,
                        payload: { edgeId: edge.id, hasValueNode: false },
                      }
                    : { type: QueryActionType.removeEdge, payload: { edgeId: edge.id } },
                );
              }}
            />
          </div>
        )}
      </StyledNodeMainRow>
    </StyledNodeContainer>
  );
};
