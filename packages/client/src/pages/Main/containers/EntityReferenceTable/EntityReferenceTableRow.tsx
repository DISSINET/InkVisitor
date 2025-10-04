import { IEntity, IReference } from "@shared/types";
import { Button } from "components";
import { useTheme } from "hooks";
import React, { useEffect, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaExternalLinkAlt, FaGripVertical, FaTrashAlt } from "react-icons/fa";
import { DragItem, Identifier, ItemTypes } from "types";
import { dndHoverFn } from "utils/utils";
import { EntityReferenceTableResource } from "./EntityReferenceTableResource";
import {
  StyledGrid,
  StyledReferencesListButtons,
} from "./EntityReferenceTableStyles";
import { EntityReferenceTableValue } from "./EntityReferenceTableValue";

interface EntityReferenceTableRow {
  reference: IReference;
  entities: {
    [key: string]: IEntity;
  };

  handleChangeValue: (
    refId: string,
    newValueId: string,
    instantUpdate?: boolean
  ) => void;
  handleChangeResource: (
    refId: string,
    newReSourceId: string,
    instantUpdate?: boolean
  ) => void;
  handleRemove: (refId: string, instantUpdate?: boolean) => void;
  isInsideTemplate?: boolean;
  territoryParentId?: string;
  alwaysShowCreateModal?: boolean;
  openDetailOnCreate?: boolean;
  editorWidthTooNarrow: boolean;

  hasOrder: boolean;
  index: number;
  updateOrderFn: () => void;
  moveRow: (dragIndex: number, hoverIndex: number) => void;

  initResourceTyped?: string;
  initValueTyped?: string;
  onClearAfterInitTyped: () => void;

  userCanEdit: boolean;
  disabled?: boolean;
}

export const EntityReferenceTableRow: React.FC<EntityReferenceTableRow> = ({
  reference,
  entities,
  isInsideTemplate,
  handleChangeValue,
  handleChangeResource,
  handleRemove,
  territoryParentId,
  openDetailOnCreate,
  alwaysShowCreateModal,
  editorWidthTooNarrow,

  hasOrder,
  index,
  updateOrderFn,
  moveRow,

  initResourceTyped,
  initValueTyped,
  onClearAfterInitTyped,

  userCanEdit,
  disabled,
}) => {
  // clears the temporary input data after moving them from spare row to the suggester input
  useEffect(() => {
    onClearAfterInitTyped();
  }, []);

  const dropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLTableCellElement>(null);

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: ItemTypes.REFERENCE_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
    },
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.REFERENCE_ROW,
    item: { index, id: reference.id },
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

  const theme = useTheme();

  const resourceEntity = entities[reference.resource];
  const valueEntity = entities[reference.value];

  return (
    <>
      <StyledGrid ref={dropRef} data-handler-id={handlerId} style={{ opacity }}>
        {hasOrder && userCanEdit ? (
          <span ref={dragRef} style={{ cursor: "move" }}>
            <FaGripVertical color={theme.color.black} />
          </span>
        ) : (
          <span style={{ width: "1.5rem" }} />
        )}
        <EntityReferenceTableResource
          reference={reference}
          isInsideTemplate={isInsideTemplate}
          handleChangeResource={handleChangeResource}
          resourceEntity={resourceEntity}
          territoryParentId={territoryParentId}
          openDetailOnCreate={openDetailOnCreate}
          alwaysShowCreateModal={alwaysShowCreateModal}
          initResourceTyped={initResourceTyped}
          editorWidthTooNarrow={editorWidthTooNarrow}
          disabled={disabled}
        />
        <EntityReferenceTableValue
          reference={reference}
          resourceEntity={resourceEntity}
          valueEntity={valueEntity}
          handleChangeValue={handleChangeValue}
          alwaysShowCreateModal={alwaysShowCreateModal}
          isInsideTemplate={isInsideTemplate}
          openDetailOnCreate={openDetailOnCreate}
          territoryParentId={territoryParentId}
          initValueTyped={initValueTyped}
          editorWidthTooNarrow={editorWidthTooNarrow}
          disabled={disabled}
        />
        <span>
          <StyledReferencesListButtons>
            {resourceEntity &&
              valueEntity &&
              resourceEntity.data.partValueBaseURL && (
                <Button
                  key="url"
                  tooltipLabel="external link"
                  inverted
                  icon={<FaExternalLinkAlt />}
                  color="plain"
                  onClick={() => {
                    const baseUrl = resourceEntity.data.partValueBaseURL;
                    const label = valueEntity.labels[0];

                    const url = resourceEntity.data.partValueBaseURL.includes(
                      "http"
                    )
                      ? `${baseUrl}${label}`
                      : `//${baseUrl}${label}`;
                    window.open(url, "_blank");
                  }}
                />
              )}
            {!disabled && (
              <Button
                key="delete"
                tooltipLabel="remove reference row"
                inverted
                icon={<FaTrashAlt />}
                color="plain"
                onClick={() => {
                  handleRemove(reference.id);
                }}
              />
            )}
          </StyledReferencesListButtons>
        </span>
      </StyledGrid>
    </>
  );
};
