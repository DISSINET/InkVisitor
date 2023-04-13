import { EntityEnums } from "@shared/enums";
import {
  IEntity,
  IProp,
  IResponseStatement,
  IStatementActant,
} from "@shared/types";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  AttributeIcon,
  BundleButtonGroup,
  Button,
  ButtonGroup,
} from "components";
import {
  ElvlButtonGroup,
  EntityDropzone,
  EntitySuggester,
  EntityTag,
  LogicButtonGroup,
  PositionButtonGroup,
} from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaGripVertical, FaPlus, FaTrashAlt } from "react-icons/fa";
import { TbSettingsAutomation, TbSettingsFilled } from "react-icons/tb";
import { UseMutationResult } from "react-query";
import { setDraggedActantRow } from "redux/features/rowDnd/draggedActantRowSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  DragItem,
  DraggedActantRowItem,
  DraggedPropRowCategory,
  FilteredActantObject,
  ItemTypes,
} from "types";
import { dndHoverFn } from "utils";
import AttributesEditor from "../../../AttributesEditor/AttributesEditor";
import { PropGroup } from "../../../PropGroup/PropGroup";
import { StatementEditorActantClassification } from "./StatementEditorActantClassification/StatementEditorActantClassification";
import { StatementEditorActantIdentification } from "./StatementEditorActantIdentification/StatementEditorActantIdentification";
import {
  StyledCI,
  StyledCIHeading,
  StyledExpandedRow,
  StyledGrid,
  StyledGridColumn,
  StyledRow,
  StyledTagWrapper,
} from "./StatementEditorActantTableStyles";

interface StatementEditorActantTableRow {
  filteredActant: FilteredActantObject;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  userCanEdit?: boolean;
  updateOrderFn: () => void;
  addProp: (originId: string) => void;
  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  statement: IResponseStatement;
  classEntitiesActant: EntityEnums.Class[];
  updateStatementDataMutation: UseMutationResult<any, unknown, object, unknown>;
  territoryParentId?: string;
  addClassification: (originId: string) => void;
  addIdentification: (originId: string) => void;
  territoryActants?: string[];
  hasOrder?: boolean;
}

export const StatementEditorActantTableRow: React.FC<
  StatementEditorActantTableRow
> = ({
  filteredActant,
  index,
  moveRow,
  statement,
  userCanEdit = false,
  updateOrderFn,
  classEntitiesActant,
  updateStatementDataMutation,
  addProp,
  updateProp,
  removeProp,
  movePropToIndex,
  territoryParentId,
  addClassification,
  addIdentification,
  territoryActants,
  hasOrder,
}) => {
  const isInsideTemplate = statement.isTemplate || false;
  const { statementId, territoryId } = useSearchParams();
  const {
    actant,
    sActant,
  }: {
    actant?: IEntity;
    sActant: IStatementActant;
  } = filteredActant.data;

  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableCellElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.ACTANT_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: {
      type: ItemTypes.ACTANT_ROW,
      index,
      id: filteredActant.id.toString(),
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      if (item) updateOrderFn();
    },
  });

  const opacity = isDragging ? 0.2 : 1;

  preview(drop(dropRef));
  drag(dragRef);

  const updateActant = (statementActantId: string, changes: any) => {
    if (statement && statementActantId) {
      const updatedActants = statement.data.actants.map((a) =>
        a.id === statementActantId ? { ...a, ...changes } : a
      );
      const newData = { actants: updatedActants };
      updateStatementDataMutation.mutate(newData);
    }
  };

  const removeActant = (statementActantId: string) => {
    if (statement) {
      const updatedActants = statement.data.actants.filter(
        (a) => a.id !== statementActantId
      );
      const newData = { actants: updatedActants };
      updateStatementDataMutation.mutate(newData);
    }
  };

  const renderActantCell = () => {
    return actant ? (
      <StyledTagWrapper>
        <EntityDropzone
          onSelected={(newSelectedId: string) => {
            updateActant(sActant.id, {
              entityId: newSelectedId,
            });
          }}
          categoryTypes={classEntitiesActant}
          excludedEntities={excludedSuggesterEntities}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
          excludedActantIds={[actant.id]}
        >
          <EntityTag
            entity={actant}
            fullWidth
            unlinkButton={
              userCanEdit && {
                onClick: () => {
                  updateActant(sActant.id, {
                    entityId: "",
                  });
                },
              }
            }
            elvlButtonGroup={
              <ElvlButtonGroup
                value={sActant.elvl}
                onChange={(elvl) =>
                  updateActant(sActant.id, {
                    elvl: elvl,
                  })
                }
              />
            }
          />
        </EntityDropzone>
      </StyledTagWrapper>
    ) : (
      userCanEdit && (
        <EntitySuggester
          onSelected={(newSelectedId: string) => {
            updateActant(sActant.id, {
              entityId: newSelectedId,
            });
          }}
          categoryTypes={classEntitiesActant}
          openDetailOnCreate
          excludedEntities={excludedSuggesterEntities}
          excludedActantIds={[statement.id]}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
          territoryActants={territoryActants}
          placeholder={"add actant"}
          isInsideStatement
        />
      )
    );
  };

  const renderPositionCell = () => {
    return (
      <PositionButtonGroup
        border
        value={sActant.position}
        onChange={(position) =>
          updateActant(sActant.id, {
            position: position,
          })
        }
      />
    );
  };

  const [actantAttributesModalOpen, setActantAttributesModalOpen] =
    useState<boolean>(false);

  const renderAttributesCell = () => {
    const { entityId: propOriginId, id: propRowId } = sActant;

    return (
      <ButtonGroup noMarginRight height={19}>
        {sActant && (
          <AttributesEditor
            modalOpen={actantAttributesModalOpen}
            setModalOpen={setActantAttributesModalOpen}
            modalTitle={`Actant involvement`}
            entity={actant}
            disabledAllAttributes={!userCanEdit}
            userCanEdit={userCanEdit}
            data={{
              elvl: sActant.elvl,
              logic: sActant.logic,
              virtuality: sActant.virtuality,
              partitivity: sActant.partitivity,
              bundleOperator: sActant.bundleOperator,
              bundleStart: sActant.bundleStart,
              bundleEnd: sActant.bundleEnd,
            }}
            handleUpdate={(newData) => {
              updateActant(sActant.id, newData);
            }}
            updateActantId={(newId: string) => {
              updateActant(sActant.id, { entityId: newId });
            }}
            classEntitiesActant={classEntitiesActant}
            loading={updateStatementDataMutation.isLoading}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
          />
        )}
        {userCanEdit && (
          <Button
            key="d"
            icon={<FaTrashAlt />}
            color="plain"
            inverted
            tooltipLabel="remove actant row"
            onClick={() => {
              removeActant(filteredActant.data.sActant.id);
            }}
          />
        )}
        {userCanEdit && (
          <Button
            key="a"
            icon={<FaPlus />}
            noIconMargin
            label="p"
            color="primary"
            inverted
            tooltipLabel="add new prop"
            onClick={() => {
              addProp(propRowId);
            }}
          />
        )}
        {userCanEdit && (
          <Button
            key="c"
            icon={<FaPlus />}
            noIconMargin
            label="c"
            color="primary"
            inverted
            tooltipLabel="add classification"
            onClick={() => {
              addClassification(propRowId);
            }}
          />
        )}
        {userCanEdit && (
          <Button
            key="i"
            icon={<FaPlus />}
            noIconMargin
            label="i"
            color="primary"
            inverted
            tooltipLabel="add identification"
            onClick={() => {
              addIdentification(propRowId);
            }}
          />
        )}
        {sActant.logic == "2" && (
          <Button
            key="neg"
            tooltipLabel="Negative logic"
            color="danger"
            inverted
            noBorder
            icon={<AttributeIcon attributeName={"negation"} />}
            onClick={() => setActantAttributesModalOpen(true)}
          />
        )}
        {sActant.bundleOperator && (
          <Button
            key="oper"
            tooltipLabel="Logical operator type"
            color="success"
            inverted
            noBorder
            icon={sActant.bundleOperator}
            onClick={() => setActantAttributesModalOpen(true)}
          />
        )}
      </ButtonGroup>
    );
  };

  const dispatch = useAppDispatch();
  const draggedActantRow: DraggedActantRowItem = useAppSelector(
    (state) => state.rowDnd.draggedActantRow
  );

  useEffect(() => {
    if (isDragging) {
      dispatch(
        setDraggedActantRow({ category: DraggedPropRowCategory.ACTANT })
      );
    } else {
      dispatch(setDraggedActantRow({}));
    }
  }, [isDragging]);

  const renderPropGroup = useCallback(
    (originId: string, props: IProp[], category: DraggedPropRowCategory) => {
      const originActant = statement.entities[originId];

      if (props.length > 0) {
        return (
          <PropGroup
            boxEntity={statement}
            originId={originActant ? originActant.id : ""}
            entities={statement.entities}
            props={props}
            territoryId={territoryId}
            updateProp={updateProp}
            removeProp={removeProp}
            addProp={addProp}
            movePropToIndex={movePropToIndex}
            userCanEdit={userCanEdit}
            openDetailOnCreate
            category={category}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
          />
        );
      }
    },
    [statement]
  );

  const [isExpanded, setIsExpanded] = useState(true);

  const { classifications, identifications } = filteredActant.data.sActant;

  return (
    <StyledRow
      key={index}
      marginBottom={classifications.length > 0 || identifications.length > 0}
    >
      <StyledGrid
        ref={dropRef}
        style={{ opacity }}
        hasOrder={hasOrder}
        hasActant={!!filteredActant.data.actant}
      >
        {userCanEdit && hasOrder ? (
          <StyledGridColumn ref={dragRef} style={{ cursor: "move" }}>
            <FaGripVertical />
          </StyledGridColumn>
        ) : (
          <StyledGridColumn />
        )}
        <StyledGridColumn>{renderActantCell()}</StyledGridColumn>
        <StyledGridColumn>
          {
            <LogicButtonGroup
              border
              value={filteredActant.data.sActant.logic}
              onChange={(logic) =>
                updateActant(filteredActant.data.sActant.id, { logic: logic })
              }
            />
          }
        </StyledGridColumn>
        <StyledGridColumn>{renderPositionCell()}</StyledGridColumn>
        <StyledGridColumn>{renderAttributesCell()}</StyledGridColumn>
        <StyledGridColumn>
          <Button
            inverted
            onClick={() => setIsExpanded(!isExpanded)}
            icon={
              isExpanded ? (
                <TbSettingsFilled size={16} />
              ) : (
                <TbSettingsAutomation
                  size={16}
                  style={{ transform: "rotate(90deg)" }}
                />
              )
            }
          />
        </StyledGridColumn>
      </StyledGrid>

      {/* Expanded Row */}
      {isExpanded && (
        <StyledExpandedRow>
          <div>{"virtuality"}</div>
          <div>{"partivity"}</div>
          <div>{"logical op."}</div>
          <div>
            <BundleButtonGroup
              bundleStart={sActant.bundleStart}
              onBundleStartChange={(bundleStart) =>
                updateActant(sActant.id, {
                  bundleStart: bundleStart,
                })
              }
              bundleEnd={sActant.bundleEnd}
              onBundleEndChange={(bundleEnd) =>
                updateActant(sActant.id, {
                  bundleEnd: bundleEnd,
                })
              }
            />
          </div>
        </StyledExpandedRow>
      )}

      {/* Prop group */}
      {!(
        draggedActantRow.category &&
        draggedActantRow.category === DraggedPropRowCategory.ACTANT
      ) &&
        renderPropGroup(
          filteredActant.data.sActant.entityId,
          filteredActant.data.sActant.props,
          DraggedPropRowCategory.ACTANT
        )}

      {/* CI */}
      {!(
        draggedActantRow.category &&
        draggedActantRow.category === DraggedPropRowCategory.ACTANT
      ) && (
        <>
          {/* Classifications */}
          {classifications.length > 0 && (
            <StyledCI>
              <StyledCIHeading>Classifications:</StyledCIHeading>
              {classifications.length > 0 &&
                classifications.map((classification, key) => (
                  <StatementEditorActantClassification
                    key={key}
                    classifications={classifications}
                    classification={classification}
                    sActant={filteredActant.data.sActant}
                    statement={statement}
                    territoryParentId={territoryParentId}
                    isInsideTemplate={isInsideTemplate}
                    updateActant={updateActant}
                    updateStatementDataMutation={updateStatementDataMutation}
                    userCanEdit={userCanEdit}
                    territoryActants={territoryActants}
                  />
                ))}
            </StyledCI>
          )}

          {/* Identifications */}
          {identifications.length > 0 && (
            <StyledCI>
              <StyledCIHeading>Identifications:</StyledCIHeading>
              {identifications.length > 0 &&
                identifications.map((identification, key) => (
                  <StatementEditorActantIdentification
                    key={key}
                    identification={identification}
                    identifications={identifications}
                    sActant={filteredActant.data.sActant}
                    statement={statement}
                    territoryParentId={territoryParentId}
                    isInsideTemplate={isInsideTemplate}
                    updateActant={updateActant}
                    updateStatementDataMutation={updateStatementDataMutation}
                    userCanEdit={userCanEdit}
                    classEntitiesActant={classEntitiesActant}
                    territoryActants={territoryActants}
                  />
                ))}
            </StyledCI>
          )}
        </>
      )}
    </StyledRow>
  );
};
