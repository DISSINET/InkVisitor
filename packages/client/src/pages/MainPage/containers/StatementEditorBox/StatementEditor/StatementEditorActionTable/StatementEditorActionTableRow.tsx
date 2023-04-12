import { EntityEnums } from "@shared/enums";
import { IProp, IResponseStatement } from "@shared/types";
import { excludedSuggesterEntities } from "Theme/constants";
import { AttributeIcon, Button, ButtonGroup, Dropdown } from "components";
import {
  ElvlButtonGroup,
  EntityDropzone,
  EntitySuggester,
  EntityTag,
  LogicButtonGroup,
  MoodVariantButtonGroup,
} from "components/advanced";
import { useSearchParams } from "hooks";
import AttributesEditor from "pages/MainPage/containers/AttributesEditor/AttributesEditor";
import { PropGroup } from "pages/MainPage/containers/PropGroup/PropGroup";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaGripVertical, FaPlus, FaTrashAlt } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { setDraggedActantRow } from "redux/features/rowDnd/draggedActantRowSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  DragItem,
  DraggedActantRowItem,
  DraggedPropRowCategory,
  FilteredActionObject,
  ItemTypes,
} from "types";
import { dndHoverFn } from "utils";
import {
  StyledGrid,
  StyledGridColumn,
} from "./StatementEditorActionTableStyles";
import { moodDict } from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { TbSettingsAutomation, TbSettingsFilled } from "react-icons/tb";

interface StatementEditorActionTableRow {
  filteredAction: FilteredActionObject;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  statement: IResponseStatement;
  userCanEdit?: boolean;
  updateOrderFn: () => void;
  addProp: (originId: string) => void;
  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  updateActionsMutation: UseMutationResult<any, unknown, object, unknown>;
  territoryParentId?: string;
  territoryActants?: string[];
  hasOrder?: boolean;
}

export const StatementEditorActionTableRow: React.FC<
  StatementEditorActionTableRow
> = ({
  filteredAction,
  index,
  moveRow,
  statement,
  userCanEdit = false,
  updateOrderFn,
  addProp,
  updateProp,
  removeProp,
  movePropToIndex,
  updateActionsMutation,
  territoryParentId,
  territoryActants,
  hasOrder,
}) => {
  const isInsideTemplate = statement.isTemplate || false;
  const { statementId, territoryId } = useSearchParams();

  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableCellElement>(null);

  const updateAction = (statementActionId: string, changes: any) => {
    if (statement && statementActionId) {
      const updatedActions = statement.data.actions.map((a) =>
        a.id === statementActionId ? { ...a, ...changes } : a
      );
      const newData = { actions: updatedActions };
      updateActionsMutation.mutate(newData);
    }
  };
  const removeAction = (statementActionId: string) => {
    if (statement) {
      const updatedActions = statement.data.actions.filter(
        (a) => a.id !== statementActionId
      );
      const newData = { actions: updatedActions };
      updateActionsMutation.mutate(newData);
    }
  };

  const [, drop] = useDrop({
    accept: ItemTypes.ACTION_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: {
      type: ItemTypes.ACTION_ROW,
      index,
      id: filteredAction.id.toString(),
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

  const renderActionCell = () => {
    const { action, sAction } = filteredAction.data;
    return action ? (
      <EntityDropzone
        onSelected={(newSelectedId: string) => {
          updateAction(sAction.id, {
            actionId: newSelectedId,
          });
        }}
        isInsideTemplate={isInsideTemplate}
        categoryTypes={[EntityEnums.Class.Action]}
        excludedEntities={excludedSuggesterEntities}
        territoryParentId={territoryParentId}
        excludedActantIds={[action.id]}
      >
        <EntityTag
          fullWidth
          entity={action}
          unlinkButton={
            userCanEdit && {
              onClick: () => {
                updateAction(sAction.id, {
                  actionId: "",
                });
              },
            }
          }
          elvlButtonGroup={
            <ElvlButtonGroup
              value={sAction.elvl}
              onChange={(elvl) =>
                updateAction(sAction.id, {
                  elvl: elvl,
                })
              }
            />
          }
        />
      </EntityDropzone>
    ) : (
      userCanEdit && (
        <EntitySuggester
          onSelected={(newSelectedId: string) => {
            updateAction(sAction.id, {
              actionId: newSelectedId,
            });
          }}
          openDetailOnCreate
          categoryTypes={[EntityEnums.Class.Action]}
          excludedEntities={excludedSuggesterEntities}
          placeholder={"add action"}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
          territoryActants={territoryActants}
        />
      )
    );
  };

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const renderButtonsCell = () => {
    const { action, sAction } = filteredAction.data;
    const { actionId: propOriginId, id: rowId } = sAction;

    return (
      <ButtonGroup noMarginRight height={19}>
        {sAction && (
          <AttributesEditor
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            modalTitle={`Action attribute`}
            entity={action}
            disabledAllAttributes={!userCanEdit}
            data={{
              elvl: sAction.elvl,
              certainty: sAction.certainty,
              logic: sAction.logic,
              mood: sAction.mood,
              moodvariant: sAction.moodvariant,
              bundleOperator: sAction.bundleOperator,
              bundleStart: sAction.bundleStart,
              bundleEnd: sAction.bundleEnd,
            }}
            handleUpdate={(newData) => {
              updateAction(sAction.id, newData);
            }}
            updateActantId={(newId: string) => {
              updateAction(sAction.id, { actionId: newId });
            }}
            userCanEdit={userCanEdit}
            classEntitiesActant={[EntityEnums.Class.Action]}
            loading={updateActionsMutation.isLoading}
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
            tooltipLabel="remove action row"
            onClick={() => {
              removeAction(filteredAction.data.sAction.id);
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
              addProp(rowId);
            }}
          />
        )}
        {sAction.logic == "2" && (
          <Button
            key="neg"
            tooltipLabel="Negative logic"
            color="danger"
            inverted
            noBorder
            icon={<AttributeIcon attributeName={"negation"} />}
            onClick={() => setModalOpen(true)}
          />
        )}
        {sAction.bundleOperator && (
          <Button
            key="oper"
            tooltipLabel="Logical operator type"
            color="success"
            inverted
            noBorder
            icon={sAction.bundleOperator}
            onClick={() => setModalOpen(true)}
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
        setDraggedActantRow({ category: DraggedPropRowCategory.ACTION })
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

  return (
    <React.Fragment key={index}>
      <StyledGrid ref={dropRef} style={{ opacity }} hasOrder={hasOrder}>
        {userCanEdit && hasOrder ? (
          <StyledGridColumn ref={dragRef} style={{ cursor: "move" }}>
            <FaGripVertical />
          </StyledGridColumn>
        ) : (
          <StyledGridColumn />
        )}
        <StyledGridColumn>{renderActionCell()}</StyledGridColumn>
        <StyledGridColumn>
          {
            <LogicButtonGroup
              border
              value={filteredAction.data.sAction.logic}
              onChange={(logic) =>
                updateAction(filteredAction.data.sAction.id, { logic: logic })
              }
            />
          }
        </StyledGridColumn>
        <StyledGridColumn>
          {
            <Dropdown
              width={100}
              isMulti
              // disabled={disabled}
              placeholder="mood"
              options={moodDict}
              value={[allEntities]
                .concat(moodDict)
                .filter((i: any) =>
                  filteredAction.data.sAction.mood.includes(i.value)
                )}
              onChange={(newValue: any) => {
                updateAction(filteredAction.data.sAction.id, {
                  mood: newValue ? newValue.map((v: any) => v.value) : [],
                });
              }}
            />
          }
        </StyledGridColumn>
        <StyledGridColumn>{renderButtonsCell()}</StyledGridColumn>
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

      {isExpanded && (
        <div
          style={{
            display: "grid",
            marginLeft: "2rem",
            gridTemplateColumns: "repeat(3, auto) 1fr",
            gridColumnGap: "1rem",
            fontSize: "1.4rem",
            backgroundColor: "",
          }}
        >
          <MoodVariantButtonGroup
            border
            onChange={(moodvariant) =>
              updateAction(filteredAction.data.sAction.id, {
                moodvariant: moodvariant,
              })
            }
            value={filteredAction.data.sAction.moodvariant}
          />
          <div>{"logical op."}</div>
          <div>{"start|end"}</div>
          <div>{"certainty"}</div>
        </div>
      )}

      {!(
        draggedActantRow.category &&
        draggedActantRow.category === DraggedPropRowCategory.ACTION
      ) &&
        renderPropGroup(
          filteredAction.data.sAction.actionId,
          filteredAction.data.sAction.props,
          DraggedPropRowCategory.ACTION
        )}
    </React.Fragment>
  );
};
