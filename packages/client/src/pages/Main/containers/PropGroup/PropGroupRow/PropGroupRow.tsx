import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp } from "@inkvisitor/shared/types";
import { AttributeIcon, Button, ButtonGroup, Submit } from "components";
import { useUserQuery } from "hooks/react-query";
import React, { useEffect, useRef, useState } from "react";
import { DragSourceMonitor, DropTargetMonitor, useDrag, useDrop } from "react-dnd";
import { FaPlus } from "react-icons/fa";
import { IcoTrash } from "Theme/icons";
import { FaCaretDown } from "react-icons/fa6";
import { setDraggedPropRow } from "redux/features/rowDnd/draggedPropRowSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  DragItem,
  DraggedPropRowCategory,
  DraggedPropRowItem,
  Identifier,
  ItemTypes,
  PropAttributeFilter,
} from "types";
import { dndHoverFn } from "utils/utils";
import { TooltipAttributesGroup } from "../..";
import { PropGroupRowStatementAttributes } from "./PropGroupRowStatementAttributes";
import {
  StyledBorderLeft,
  StyledFaGripVertical,
  StyledGrid,
  StyledPropLineColumn,
} from "./PropGroupRowStyles";
import { PropGroupRowType } from "./PropGroupRowType";
import { PropGroupRowValue } from "./PropGroupRowValue";

interface PropGroupRow {
  prop: IProp;
  entities: { [key: string]: IEntity };
  level: 1 | 2 | 3;
  hasOrder: boolean;

  updateProp: (
    propId: string,
    changes: Partial<IProp>,
    instantUpdate?: boolean,
    languageCheck?: boolean,
  ) => void;
  removeProp: (propId: string) => void;
  addProp: (originId: string) => void;
  moveProp: (dragIndex: number, hoverIndex: number) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;

  userCanEdit: boolean;
  territoryId?: string;
  openDetailOnCreate: boolean;

  parentId: string;
  id: string;
  index: number;
  itemType?: ItemTypes;
  category: DraggedPropRowCategory;

  disabledAttributes?: PropAttributeFilter;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  lowIdent?: boolean;
  alwaysShowCreateModal?: boolean;

  initTypeTyped?: string;
  initValueTyped?: string;
  autoFocusType?: boolean;
  autoFocusValue?: boolean;
}

const countAllChildren = (prop: IProp): number =>
  prop.children.reduce((sum, child) => sum + 1 + countAllChildren(child), 0);

export const PropGroupRow: React.FC<PropGroupRow> = ({
  prop,
  entities,
  level,
  hasOrder,
  updateProp,
  removeProp,
  addProp,
  moveProp,
  movePropToIndex,
  userCanEdit,
  territoryId,
  openDetailOnCreate = false,
  parentId,
  id,
  index,
  itemType,
  category,
  disabledAttributes = {} as PropAttributeFilter,
  isInsideTemplate = false,
  territoryParentId,
  lowIdent = false,
  alwaysShowCreateModal,

  initTypeTyped,
  initValueTyped,
  autoFocusType,
  autoFocusValue,
}) => {
  const propTypeEntity: IEntity | undefined = entities[prop.type.entityId];
  const propValueEntity: IEntity | undefined = entities[prop.value.entityId];

  const dropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const draggedPropRowRef = useRef<DraggedPropRowItem>({});

  const dispatch = useAppDispatch();
  const draggedPropRow: DraggedPropRowItem = useAppSelector((state) => state.rowDnd.draggedPropRow);

  const [tempDisabled, setTempDisabled] = useState(false);

  useEffect(() => {
    if (
      (draggedPropRow.parentId && draggedPropRow.parentId !== parentId) ||
      (draggedPropRow.category && draggedPropRow.category !== category)
    ) {
      setTempDisabled(true);
    } else {
      setTempDisabled(false);
    }
  }, [draggedPropRow.parentId, draggedPropRow.category, parentId, category]);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: itemType ? itemType : ItemTypes.PROP_ROW,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (tempDisabled) {
        return;
      }
      dndHoverFn(item, index, monitor, dropRef, moveProp);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: itemType ? itemType : ItemTypes.PROP_ROW,
    item: { id, index },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      if (item && draggedPropRow.index !== undefined && item.index !== undefined)
        if (draggedPropRow.index !== item.index) {
          movePropToIndex(id, draggedPropRow.index, item.index);
        }
    },
  });

  preview(drop(dropRef));
  drag(dragRef);

  useEffect(() => {
    if (isDragging) {
      const dragData = { id, index, lvl: level, parentId, category };
      draggedPropRowRef.current = dragData;
      dispatch(setDraggedPropRow(dragData));
    } else {
      draggedPropRowRef.current = {};
      dispatch(setDraggedPropRow({}));
    }
  }, [isDragging]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteSubmit, setShowDeleteSubmit] = useState(false);

  const { data: user } = useUserQuery();
  const askBeforePropDelete = user?.options.askBeforePropDelete !== false;

  const opacity = isDragging ? 0.5 : 1;

  const handleDeleteClick = () => {
    if (prop.children.length > 0 && askBeforePropDelete) {
      setShowDeleteSubmit(true);
    } else {
      removeProp(prop.id);
    }
  };

  return (
    <>
      <div ref={dropRef} data-handler-id={handlerId} style={{ opacity: opacity }}>
        <StyledGrid
          key={level + "|" + id}
          $tempDisabled={tempDisabled && category === draggedPropRow.category}
        >
          <StyledPropLineColumn $level={level} $lowIdent={lowIdent}>
            {userCanEdit && hasOrder ? (
              <div ref={dragRef} style={{ width: "2rem" }}>
                <StyledFaGripVertical />
              </div>
            ) : (
              <div style={{ width: "2rem" }} />
            )}
          </StyledPropLineColumn>
          <StyledPropLineColumn $level={level} $lowIdent={lowIdent}>
            <StyledBorderLeft>
              <PropGroupRowType
                propTypeEntity={propTypeEntity}
                prop={prop}
                isExpanded={isExpanded}
                disabledAttributes={disabledAttributes}
                isInsideTemplate={isInsideTemplate}
                openDetailOnCreate={openDetailOnCreate}
                territoryId={territoryId}
                territoryParentId={territoryParentId}
                updateProp={updateProp}
                userCanEdit={userCanEdit}
                alwaysShowCreateModal={alwaysShowCreateModal}
                initTypeTyped={initTypeTyped}
                autoFocus={autoFocusType}
              />
            </StyledBorderLeft>
          </StyledPropLineColumn>
          <StyledPropLineColumn>
            <PropGroupRowValue
              propValueEntity={propValueEntity}
              prop={prop}
              isExpanded={isExpanded}
              disabledAttributes={disabledAttributes}
              isInsideTemplate={isInsideTemplate}
              openDetailOnCreate={openDetailOnCreate}
              territoryId={territoryId}
              territoryParentId={territoryParentId}
              updateProp={updateProp}
              userCanEdit={userCanEdit}
              alwaysShowCreateModal={alwaysShowCreateModal}
              initValueTyped={initValueTyped}
              autoFocus={autoFocusValue}
            />
          </StyledPropLineColumn>
          <StyledPropLineColumn style={{ paddingRight: "0.5rem" }}>
            <PropGroupRowStatementAttributes
              prop={prop}
              updateProp={updateProp}
              isExpanded={isExpanded}
              disabledAttributes={disabledAttributes}
              userCanEdit={userCanEdit}
              buttons={
                <>
                  <ButtonGroup $height={19} $noGap>
                    {prop.logic == "2" && (
                      <Button
                        tooltipLabel="Negative logic"
                        color="danger"
                        inverted
                        noBorder
                        icon={<AttributeIcon attributeName={"negation"} />}
                      />
                    )}

                    {prop.bundleOperator != EntityEnums.Operator.And && (
                      <Button
                        tooltipLabel="Logical operator type"
                        color="success"
                        inverted
                        noBorder
                        icon={prop.bundleOperator}
                      />
                    )}
                    {(level === 1 || level === 2) && userCanEdit && (
                      <Button
                        key="add"
                        icon={<FaPlus size={8} />}
                        label="p"
                        noIconMargin
                        color="primary"
                        inverted
                        tooltipLabel="add child prop"
                        onClick={() => {
                          addProp(prop.id);
                        }}
                      />
                    )}
                  </ButtonGroup>
                  <Button
                    inverted
                    onClick={() => setIsExpanded(!isExpanded)}
                    color={isExpanded ? "success" : "plain"}
                    icon={
                      <FaCaretDown
                        size={12}
                        style={{
                          transform: `rotate(${isExpanded ? "90deg" : "0deg"})`,
                          transition: "transform 0.8s ease",
                        }}
                      />
                    }
                    hideTooltipOnClick
                    tooltipContent={
                      <TooltipAttributesGroup
                        data={{
                          statement: {
                            elvl: prop.elvl,
                            certainty: prop.certainty,
                            logic: prop.logic,
                            mood: prop.mood,
                            moodvariant: prop.moodvariant,
                            bundleOperator: prop.bundleOperator,
                            bundleStart: prop.bundleStart,
                            bundleEnd: prop.bundleEnd,
                          },
                          type: {
                            elvl: prop.type.elvl,
                            logic: prop.type.logic,
                            virtuality: prop.type.virtuality,
                            partitivity: prop.type.partitivity,
                          },
                          value: {
                            elvl: prop.value.elvl,
                            logic: prop.value.logic,
                            virtuality: prop.value.virtuality,
                            partitivity: prop.value.partitivity,
                          },
                        }}
                        disabledAttributes={disabledAttributes}
                      />
                    }
                  />
                  {userCanEdit && (
                    <Button
                      key="delete"
                      icon={<IcoTrash />}
                      tooltipLabel="remove prop row"
                      color="plain"
                      inverted
                      onClick={handleDeleteClick}
                    />
                  )}
                </>
              }
            />
          </StyledPropLineColumn>
        </StyledGrid>
      </div>
      <Submit
        title="Delete metaprop"
        text={`This metaprop has ${countAllChildren(prop)} child propert${
          countAllChildren(prop) === 1 ? "y" : "ies"
        } which will also be deleted. Do you really want to continue?`}
        submitLabel="Delete"
        show={showDeleteSubmit}
        onSubmit={() => {
          removeProp(prop.id);
          setShowDeleteSubmit(false);
        }}
        onCancel={() => setShowDeleteSubmit(false)}
      />
    </>
  );
};
