import { IEntity, IProp } from "@shared/types";
import { AttributeIcon, Button } from "components";
import React, { useEffect, useRef, useState } from "react";
import {
  useDrop,
  DropTargetMonitor,
  XYCoord,
  useDrag,
  DragSourceMonitor,
} from "react-dnd";
import {
  FaCaretDown,
  FaCaretUp,
  FaPlus,
  FaTrashAlt,
  FaUnlink,
} from "react-icons/fa";
import { setDraggedPropRow } from "redux/features/propGroup/draggedPropRowSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  AttributeGroupDataObject,
  classesPropType,
  classesPropValue,
  DraggedPropRowItem,
  DragItem,
  ItemTypes,
} from "types";
import { EntitySuggester, EntityTag } from "../..";
import { AttributesGroupEditor } from "../../AttributesEditor/AttributesGroupEditor";
import {
  StyledFaGripVertical,
  StyledGrid,
  StyledPropButtonGroup,
  StyledPropLineColumn,
} from "../PropGroupStyles";

interface IPropGroupRow {
  prop: IProp;
  entities: { [key: string]: IEntity };
  level: "1" | "2" | "3";
  order: number;
  firstRowinGroup?: boolean;
  lastRowinGroup?: boolean;
  lastInGroup?: boolean;

  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  addProp: (originId: string) => void;
  movePropDown: (propId: string) => void;
  movePropUp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;

  userCanEdit: boolean;
  territoryActants: string[];
  openDetailOnCreate: boolean;

  parentId: string;
  id: string;
  index: number;
  moveProp: (dragIndex: number, hoverIndex: number) => void;
  itemType?: ItemTypes;
}

export const PropGroupRow: React.FC<IPropGroupRow> = ({
  prop,
  entities,
  level,
  order,
  firstRowinGroup = false,
  lastRowinGroup = false,
  updateProp,
  removeProp,
  addProp,
  movePropDown,
  movePropUp,
  moveProp,
  movePropToIndex,
  userCanEdit,
  territoryActants = [],
  openDetailOnCreate = false,
  parentId,
  id,
  index,
  itemType,
}) => {
  const propTypeEntity: IEntity = entities[prop.type.id];
  const propValueEntity = entities[prop.value.id];

  const draggePropRow: DraggedPropRowItem = useAppSelector(
    (state) => state.propGroup.draggedPropRow
  );

  const [tempDisabled, setTempDisabled] = useState(false);

  useEffect(() => {
    if (draggePropRow.parentId && draggePropRow.parentId !== parentId) {
      setTempDisabled(true);
    } else {
      setTempDisabled(false);
    }
  }, [draggePropRow]);

  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
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
      if (!ref.current) {
        return;
      }
      const dragIndex: number = item.index;
      const hoverIndex: number | undefined = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (hoverIndex === undefined) {
        return;
      }
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveProp(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    // drop: (item: DragItem, monitor: DropTargetMonitor) => {
    //   console.log("item", item.index);
    //   console.log("index", index);
    // },
  });

  const [{ isDragging }, drag] = useDrag({
    item: { type: itemType ? itemType : ItemTypes.PROP_ROW, id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      // console.log("item", item?.index);
      // console.log("index", draggePropRow.index);
      if (
        item &&
        draggePropRow.index !== undefined &&
        item.index !== draggePropRow.index
      )
        movePropToIndex(id, draggePropRow.index, item.index);
    },
  });

  drag(drop(ref));

  useEffect(() => {
    if (isDragging) {
      dispatch(setDraggedPropRow({ id, parentId, index }));
    } else {
      dispatch(setDraggedPropRow({}));
    }
  }, [isDragging]);

  const renderPropRow = () => {
    return (
      <StyledGrid
        key={level + "|" + order + "|" + id}
        tempDisabled={tempDisabled}
      >
        <StyledPropLineColumn
          level={level}
          isTag={propTypeEntity ? true : false}
        >
          <StyledFaGripVertical />
          {propTypeEntity ? (
            <EntityTag
              actant={propTypeEntity}
              fullWidth
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  color="plain"
                  inverted={true}
                  tooltip="unlink actant"
                  onClick={() => {
                    updateProp(prop.id, {
                      type: {
                        ...prop.type,
                        ...{ id: "" },
                      },
                    });
                  }}
                />
              }
            />
          ) : (
            <EntitySuggester
              territoryActants={territoryActants}
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  type: {
                    ...prop.type,
                    ...{ id: newSelectedId },
                  },
                });
              }}
              openDetailOnCreate={openDetailOnCreate}
              categoryTypes={classesPropType}
              inputWidth={90}
              excludedEntities={excludedSuggesterEntities}
            />
          )}
          <StyledPropButtonGroup>
            {prop.type.logic == "2" ? (
              <Button
                key="neg"
                tooltip="Negative logic"
                color="success"
                inverted={true}
                noBorder
                icon={<AttributeIcon attributeName={"negation"} />}
              />
            ) : (
              <div />
            )}
          </StyledPropButtonGroup>
        </StyledPropLineColumn>
        <StyledPropLineColumn isTag={propValueEntity ? true : false}>
          {propValueEntity ? (
            <EntityTag
              actant={propValueEntity}
              fullWidth
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  tooltip="unlink actant"
                  color="plain"
                  inverted={true}
                  onClick={() => {
                    updateProp(prop.id, {
                      value: {
                        ...prop.value,
                        ...{ id: "" },
                      },
                    });
                  }}
                />
              }
            />
          ) : (
            <EntitySuggester
              territoryActants={[]}
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  value: {
                    ...prop.type,
                    ...{ id: newSelectedId },
                  },
                });
              }}
              openDetailOnCreate={openDetailOnCreate}
              categoryTypes={classesPropValue}
              inputWidth={90}
              excludedEntities={excludedSuggesterEntities}
            />
          )}
          <StyledPropButtonGroup>
            {prop.value.logic == "2" ? (
              <Button
                key="neg"
                tooltip="Negative logic"
                color="success"
                inverted={true}
                noBorder
                icon={<AttributeIcon attributeName={"negation"} />}
              />
            ) : (
              <div />
            )}
          </StyledPropButtonGroup>
        </StyledPropLineColumn>

        <StyledPropLineColumn>
          <StyledPropButtonGroup>
            <AttributesGroupEditor
              modalTitle={`Property attributes`}
              disabledAllAttributes={!userCanEdit}
              propTypeActant={propTypeEntity}
              propValueActant={propValueEntity}
              excludedSuggesterEntities={excludedSuggesterEntities}
              classesPropType={classesPropType}
              classesPropValue={classesPropValue}
              updateProp={updateProp}
              statementId={prop.id}
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
              handleUpdate={(newData: AttributeGroupDataObject) => {
                const newDataObject = {
                  ...newData.statement,
                  ...newData,
                };
                const { statement, ...statementPropObject } = newDataObject;
                updateProp(prop.id, statementPropObject);
              }}
              userCanEdit={userCanEdit}
            />

            {(level === "1" || level === "2") && (
              <Button
                key="add"
                icon={<FaPlus />}
                tooltip="add child prop"
                color="plain"
                inverted={true}
                onClick={() => {
                  addProp(prop.id);
                }}
              />
            )}
            <Button
              key="delete"
              icon={<FaTrashAlt />}
              tooltip="remove prop row"
              color="plain"
              inverted={true}
              onClick={() => {
                removeProp(prop.id);
              }}
            />
            <Button
              key="up"
              inverted
              disabled={firstRowinGroup}
              icon={<FaCaretUp />}
              tooltip="move prop up"
              color="plain"
              onClick={() => {
                movePropUp(prop.id);
              }}
            />
            <Button
              key="down"
              inverted
              disabled={lastRowinGroup}
              icon={<FaCaretDown />}
              tooltip="move prop down"
              color="plain"
              onClick={() => {
                movePropDown(prop.id);
              }}
            />
            {prop.logic == "2" ? (
              <Button
                key="neg"
                tooltip="Negative logic"
                color="success"
                inverted={true}
                noBorder
                icon={<AttributeIcon attributeName={"negation"} />}
              />
            ) : (
              <div />
            )}
            {prop.bundleOperator ? (
              <Button
                key="oper"
                tooltip="Logical operator type"
                color="success"
                inverted={true}
                noBorder
                icon={prop.bundleOperator}
              />
            ) : (
              <div />
            )}
          </StyledPropButtonGroup>
        </StyledPropLineColumn>
      </StyledGrid>
    );
  };

  const opacity = isDragging ? 0.5 : 1;

  return (
    <>
      <div ref={ref} data-handler-id={handlerId} style={{ opacity: opacity }}>
        {renderPropRow()}
      </div>
    </>
  );
};
