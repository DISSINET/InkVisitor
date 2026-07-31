import { Button, Input } from "components";
import React, { useRef } from "react";
import { DragSourceMonitor, DropTargetMonitor, useDrag, useDrop } from "react-dnd";
import { IcoDragHandle, IcoTrash } from "Theme/icons";
import { ButtonSize, DragItem, Identifier, ItemTypes } from "types";
import { dndHoverFnTopEdgeDown } from "utils/utils";
import { StyledDragHandle, StyledRow, StyledRowActions } from "./MultiInputStyles";

interface MultiInputRow {
  value: string;
  index: number;
  width?: number | "full";
  disabled: boolean;
  hasOrder: boolean;
  onChange: (value: string) => void;
  onDelete: () => void;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  updateOrderFn: () => void;
}
export const MultiInputRow: React.FC<MultiInputRow> = ({
  value,
  index,
  width,
  disabled,
  hasOrder,
  onChange,
  onDelete,
  moveRow,
  updateOrderFn,
}) => {
  const dropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: ItemTypes.NOTE_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFnTopEdgeDown(item, index, monitor, dropRef, moveRow);
    },
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.NOTE_ROW,
    item: { index, id: `note-${index}` },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined) => {
      if (item) {
        updateOrderFn();
      }
    },
  });

  preview(drop(dropRef));
  drag(dragRef);

  return (
    <StyledRow ref={dropRef} data-handler-id={handlerId} $isDragging={isDragging}>
      <Input
        disabled={disabled}
        type="textarea"
        onChangeFn={onChange}
        width={width}
        value={value}
        textareaRightPadding={!disabled ? 24 : undefined}
      />
      {!disabled && (
        <StyledRowActions>
          <Button
            color="danger"
            inverted
            noBorder
            noBackground
            size={ButtonSize.Small}
            icon={<IcoTrash />}
            tooltipLabel="delete note"
            onClick={onDelete}
          />
          {hasOrder && (
            <StyledDragHandle ref={dragRef}>
              <IcoDragHandle size={14} />
            </StyledDragHandle>
          )}
        </StyledRowActions>
      )}
    </StyledRow>
  );
};
