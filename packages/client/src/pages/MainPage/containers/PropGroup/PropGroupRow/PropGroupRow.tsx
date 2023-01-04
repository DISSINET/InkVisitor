import { IEntity, IProp } from "@shared/types";
import { AttributeIcon, Button, ButtonGroup } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import { StyledPropButtonGroup } from "components/advanced/AttributeButtonGroup/AttributeButtonGroupStyles";
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
  classesPropType,
  classesPropValue,
  DraggedPropRowCategory,
  DraggedPropRowItem,
  DragItem,
  ItemTypes,
  PropAttributeFilter,
  PropAttributeGroupDataObject,
} from "types";
import { dndHoverFn } from "utils";
import { AttributesGroupEditor } from "../../AttributesEditor/AttributesGroupEditor";
import {
  StyledFaGripVertical,
  StyledGrid,
  StyledNoEntity,
  StyledPropLineColumn,
} from "../PropGroupStyles";

interface PropGroupRow {
  prop: IProp;
  entities: { [key: string]: IEntity };
  level: 1 | 2 | 3;
  hasOrder: boolean;

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
  isInsideTemplate: boolean;
  territoryParentId?: string;
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
  // const ref = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

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
      dndHoverFn(item, index, monitor, dropRef, moveProp);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
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

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const renderPropRow = () => {
    return (
      <StyledGrid
        key={level + "|" + index + "|" + id}
        tempDisabled={tempDisabled && category === draggedPropRow.category}
      >
        <StyledPropLineColumn level={level} isTag={false}>
          {userCanEdit && hasOrder ? (
            <div ref={dragRef} style={{ width: "2rem" }}>
              <StyledFaGripVertical />
            </div>
          ) : (
            <div style={{ width: "2rem" }} />
          )}
        </StyledPropLineColumn>
        <StyledPropLineColumn
          level={level}
          isTag={propTypeEntity ? true : false}
        >
          {propTypeEntity ? (
            <>
              <EntityTag
                entity={propTypeEntity}
                fullWidth
                tooltipPosition="right"
                button={
                  userCanEdit && (
                    <Button
                      key="d"
                      icon={<FaUnlink />}
                      color="plain"
                      inverted
                      tooltipLabel="unlink entity"
                      onClick={() => {
                        updateProp(prop.id, {
                          type: {
                            ...prop.type,
                            ...{ entityId: "" },
                          },
                        });
                      }}
                    />
                  )
                }
              />
              <StyledPropButtonGroup>
                {prop.type.logic == "2" && (
                  <Button
                    key="neg"
                    tooltipLabel="Negative logic"
                    color="success"
                    inverted
                    noBorder
                    onClick={() => setModalOpen(true)}
                    icon={<AttributeIcon attributeName={"negation"} />}
                  />
                )}
              </StyledPropButtonGroup>
            </>
          ) : userCanEdit ? (
            <EntitySuggester
              territoryActants={territoryActants}
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  type: {
                    ...prop.type,
                    ...{ entityId: newSelectedId },
                  },
                });
              }}
              placeholder="type"
              openDetailOnCreate={openDetailOnCreate}
              categoryTypes={classesPropType}
              inputWidth={90}
              excludedEntities={excludedSuggesterEntities}
              isInsideTemplate={isInsideTemplate}
              territoryParentId={territoryParentId}
            />
          ) : (
            <StyledNoEntity>-</StyledNoEntity>
          )}
        </StyledPropLineColumn>
        <StyledPropLineColumn isTag={propValueEntity ? true : false}>
          {propValueEntity ? (
            <>
              <EntityTag
                entity={propValueEntity}
                fullWidth
                tooltipPosition="right"
                button={
                  userCanEdit && (
                    <Button
                      key="d"
                      icon={<FaUnlink />}
                      tooltipLabel="unlink entity"
                      color="plain"
                      inverted
                      onClick={() => {
                        updateProp(prop.id, {
                          value: {
                            ...prop.value,
                            ...{ entityId: "" },
                          },
                        });
                      }}
                    />
                  )
                }
              />

              <StyledPropButtonGroup>
                {prop.value.logic == "2" && (
                  <Button
                    key="neg"
                    tooltipLabel="Negative logic"
                    color="success"
                    inverted
                    noBorder
                    onClick={() => setModalOpen(true)}
                    icon={<AttributeIcon attributeName={"negation"} />}
                  />
                )}
              </StyledPropButtonGroup>
            </>
          ) : userCanEdit ? (
            <EntitySuggester
              territoryActants={territoryActants}
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  value: {
                    ...prop.type,
                    ...{ entityId: newSelectedId },
                  },
                });
              }}
              placeholder="value"
              openDetailOnCreate={openDetailOnCreate}
              categoryTypes={classesPropValue}
              inputWidth={90}
              excludedEntities={excludedSuggesterEntities}
              isInsideTemplate={isInsideTemplate}
              territoryParentId={territoryParentId}
            />
          ) : (
            <StyledNoEntity>-</StyledNoEntity>
          )}
        </StyledPropLineColumn>

        <StyledPropLineColumn>
          <ButtonGroup height={19} noMarginRight>
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
              isInsideTemplate={isInsideTemplate}
              territoryParentId={territoryParentId}
            />

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
                tooltipLabel="Logical operator type"
                color="success"
                inverted
                noBorder
                onClick={() => setModalOpen(true)}
                icon={prop.bundleOperator}
              />
            ) : (
              <div />
            )}
          </ButtonGroup>
        </StyledPropLineColumn>
      </StyledGrid>
    );
  };

  const opacity = isDragging ? 0.5 : 1;

  return (
    <>
      <div
        ref={dropRef}
        data-handler-id={handlerId}
        style={{ opacity: opacity }}
      >
        {renderPropRow()}
      </div>
    </>
  );
};
