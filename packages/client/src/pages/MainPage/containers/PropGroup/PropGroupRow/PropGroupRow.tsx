import { IEntity, IProp } from "@shared/types";
import { AttributeIcon, Button } from "components";
import React, { useEffect, useRef, useState } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { setDraggedPropRow } from "redux/features/rowDnd/draggedPropRowSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  PropAttributeFilter,
  PropAttributeGroupDataObject,
  classesPropType,
  classesPropValue,
  DraggedPropRowCategory,
  DraggedPropRowItem,
  DragItem,
  ItemTypes,
} from "types";
import { dndHoverFn } from "utils";
import { EntitySuggester, EntityTag } from "../..";
import { AttributesGroupEditor } from "../../AttributesEditor/AttributesGroupEditor";
import {
  StyledFaGripVertical,
  StyledGrid,
  StyledPropButtonGroup,
  StyledPropLineColumn,
} from "../PropGroupStyles";

interface PropGroupRow {
  prop: IProp;
  entities: { [key: string]: IEntity };
  level: 1 | 2 | 3;

  updateProp: (propId: string, changes: any) => void;
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
}

export const PropGroupRow: React.FC<PropGroupRow> = ({
  prop,
  entities,
  level,
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
}) => {
  const propTypeEntity: IEntity = entities[prop.type.id];
  const propValueEntity: IEntity = entities[prop.value.id];

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
      dndHoverFn(item, index, monitor, ref, moveProp);
    },
  });

  const [{ isDragging }, drag] = useDrag({
    item: { type: itemType ? itemType : ItemTypes.PROP_ROW, id, index },
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

  drag(drop(ref));

  useEffect(() => {
    if (isDragging) {
      dispatch(
        setDraggedPropRow({ id, index, lvl: level, parentId, category })
      );
    } else {
      dispatch(setDraggedPropRow({}));
    }
  }, [isDragging]);

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const renderPropRow = () => {
    return (
      <StyledGrid
        key={level + "|" + index + "|" + id}
        tempDisabled={tempDisabled && category === draggedPropRow.category}
      >
        <StyledPropLineColumn
          level={level}
          isTag={propTypeEntity ? true : false}
        >
          <div>
            <StyledFaGripVertical />
          </div>
          {propTypeEntity ? (
            <EntityTag
              actant={propTypeEntity}
              fullWidth
              tooltipPosition="right center"
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  color="plain"
                  inverted
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
                inverted
                noBorder
                onClick={() => setModalOpen(true)}
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
              tooltipPosition="right center"
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  tooltip="unlink actant"
                  color="plain"
                  inverted
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
                inverted
                noBorder
                onClick={() => setModalOpen(true)}
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
              modalOpen={modalOpen}
              setModalOpen={setModalOpen}
              disabledAllAttributes={!userCanEdit}
              disabledAttributes={disabledAttributes}
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
              handleUpdate={(newData: PropAttributeGroupDataObject) => {
                const newDataObject = {
                  ...newData.statement,
                  ...newData,
                };
                const { statement, ...statementPropObject } = newDataObject;
                updateProp(prop.id, statementPropObject);
              }}
              userCanEdit={userCanEdit}
            />

            {(level === 1 || level === 2) && (
              <Button
                key="add"
                icon={<FaPlus />}
                tooltip="add child prop"
                color="plain"
                inverted
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
              inverted
              onClick={() => {
                removeProp(prop.id);
              }}
            />
            {prop.logic == "2" ? (
              <Button
                key="neg"
                tooltip="Negative logic"
                color="success"
                inverted
                noBorder
                onClick={() => setModalOpen(true)}
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
                inverted
                noBorder
                onClick={() => setModalOpen(true)}
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
