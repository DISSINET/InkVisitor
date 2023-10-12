import { IEntity, IProp } from "@shared/types";
import { AttributeIcon, Button, ButtonGroup } from "components";
import React, { useEffect, useRef, useState } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { TbSettingsAutomation, TbSettingsFilled } from "react-icons/tb";
import { setDraggedPropRow } from "redux/features/rowDnd/draggedPropRowSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  DragItem,
  DraggedPropRowCategory,
  DraggedPropRowItem,
  ItemTypes,
  PropAttributeFilter,
} from "types";
import { dndHoverFn } from "utils";
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

export declare type Identifier = string | symbol;

interface PropGroupRow {
  prop: IProp;
  entities: { [key: string]: IEntity };
  level: 1 | 2 | 3;
  hasOrder: boolean;

  updateProp: (propId: string, changes: any, instantUpdate?: boolean) => void;
  removeProp: (propId: string) => void;
  addProp: (originId: string) => void;
  moveProp: (dragIndex: number, hoverIndex: number) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;

  userCanEdit: boolean;
  territoryActants: string[];
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
}

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
  territoryActants = [],
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
}) => {
  const propTypeEntity: IEntity = entities[prop.type.entityId];
  const propValueEntity: IEntity = entities[prop.value.entityId];

  const draggedPropRow: DraggedPropRowItem = useAppSelector(
    (state) => state.rowDnd.draggedPropRow
  );

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
  }, [draggedPropRow]);

  const dispatch = useAppDispatch();
  const dropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
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
      if (
        item &&
        draggedPropRow.index !== undefined &&
        item.index !== draggedPropRow.index
      )
        movePropToIndex(id, draggedPropRow.index, item.index);
    },
  });

  preview(drop(dropRef));
  drag(dragRef);

  useEffect(() => {
    if (isDragging) {
      dispatch(
        setDraggedPropRow({ id, index, lvl: level, parentId, category })
      );
    } else {
      dispatch(setDraggedPropRow({}));
    }
  }, [isDragging]);

  const [isExpanded, setIsExpanded] = useState(false);

  const opacity = isDragging ? 0.5 : 1;

  return (
    <>
      <div
        ref={dropRef}
        data-handler-id={handlerId}
        style={{ opacity: opacity }}
      >
        <StyledGrid
          key={level + "|" + index + "|" + id}
          tempDisabled={tempDisabled && category === draggedPropRow.category}
        >
          <StyledPropLineColumn level={level} lowIdent={lowIdent}>
            {userCanEdit && hasOrder ? (
              <div ref={dragRef} style={{ width: "2rem" }}>
                <StyledFaGripVertical style={{ marginTop: "0.3rem" }} />
              </div>
            ) : (
              <div style={{ width: "2rem" }} />
            )}
          </StyledPropLineColumn>
          <StyledPropLineColumn level={level} lowIdent={lowIdent}>
            <StyledBorderLeft>
              <PropGroupRowType
                propTypeEntity={propTypeEntity}
                prop={prop}
                isExpanded={isExpanded}
                disabledAttributes={disabledAttributes}
                isInsideTemplate={isInsideTemplate}
                openDetailOnCreate={openDetailOnCreate}
                territoryActants={territoryActants}
                territoryParentId={territoryParentId}
                updateProp={updateProp}
                userCanEdit={userCanEdit}
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
              territoryActants={territoryActants}
              territoryParentId={territoryParentId}
              updateProp={updateProp}
              userCanEdit={userCanEdit}
            />
          </StyledPropLineColumn>
          <StyledPropLineColumn>
            <PropGroupRowStatementAttributes
              prop={prop}
              updateProp={updateProp}
              isExpanded={isExpanded}
              disabledAttributes={disabledAttributes}
              userCanEdit={userCanEdit}
              buttons={
                <>
                  <ButtonGroup height={19} noMarginRight>
                    {userCanEdit && (
                      <Button
                        key="delete"
                        icon={<FaTrashAlt />}
                        tooltipLabel="remove prop row"
                        color="plain"
                        inverted
                        onClick={() => {
                          removeProp(prop.id);
                        }}
                      />
                    )}
                    {(level === 1 || level === 2) && userCanEdit && (
                      <Button
                        key="add"
                        icon={<FaPlus />}
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
                    {prop.logic == "2" ? (
                      <Button
                        key="neg"
                        tooltipLabel="Negative logic"
                        color="danger"
                        inverted
                        noBorder
                        icon={<AttributeIcon attributeName={"negation"} />}
                      />
                    ) : (
                      <div />
                    )}
                    {prop.bundleOperator ? (
                      <Button
                        key="oper"
                        tooltipLabel="Logical operator type"
                        color="success"
                        inverted
                        noBorder
                        icon={prop.bundleOperator}
                      />
                    ) : (
                      <div />
                    )}
                  </ButtonGroup>
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
                </>
              }
            />
          </StyledPropLineColumn>
        </StyledGrid>
      </div>
    </>
  );
};
