import { Explore } from "@inkvisitor/shared/types/query";
import { Button } from "components";
import { useTheme } from "hooks";
import React, { useRef } from "react";
import { DragSourceMonitor, DropTargetMonitor, useDrag, useDrop } from "react-dnd";
import { CgClose } from "react-icons/cg";
import { MdChevronLeft, MdChevronRight, MdDragIndicator, MdOutlineEdit } from "react-icons/md";
import { DragItem, Identifier, ItemTypes } from "types";
import { getColumnWidth } from "../utils";
import {
  StyledHeaderColumnCell,
  StyledHeaderColumnContent,
  StyledHeaderColumnControls,
  StyledHeaderColumnLabel,
  StyledHeaderDragHandle,
  StyledHeaderEditIcon,
} from "../ExplorerTableStyles";
import { ExploreTableHeaderTooltip } from "./ExploreTableHeaderTooltip";

interface ExploreTableHeaderColumn {
  column: Explore.IExploreColumn;
  /** Content-estimated width; falls back to the static width per type. */
  width?: number;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onRemoveColumn: (id: string) => void;
  onMoveColumn: (fromIndex: number, toIndex: number) => void;
}

const ExploreTableHeaderColumn: React.FC<ExploreTableHeaderColumn> = ({
  column,
  width: dynamicWidth,
  index,
  isFirst,
  isLast,
  onRemoveColumn,
  onMoveColumn,
}) => {
  const theme = useTheme();
  const dropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLSpanElement>(null);
  const width = dynamicWidth ?? getColumnWidth(column.type);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: ItemTypes.EXPLORER_COLUMN,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!dropRef.current) {
        return;
      }
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }

      const rect = dropRef.current.getBoundingClientRect();
      const hoverClientX = clientOffset.x - rect.left;
      // Single trigger line, shifted toward the left of the column so the swap
      // happens early. Both directions use the same line, which preserves the
      // hysteresis that stops flicker between different-width columns.
      const hoverThresholdX = rect.width * 0.15;

      if (dragIndex < hoverIndex && hoverClientX < hoverThresholdX) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientX > hoverThresholdX) {
        return;
      }
      onMoveColumn(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.EXPLORER_COLUMN,
    item: { index, id: column.id },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  preview(drop(dropRef));
  drag(dragRef);

  return (
    <StyledHeaderColumnCell
      ref={dropRef}
      data-handler-id={handlerId}
      className="qt-col qt-col-header"
      $width={width}
    >
      <StyledHeaderColumnContent $isDragging={isDragging}>
        <StyledHeaderDragHandle ref={dragRef} title="drag to reorder">
          <MdDragIndicator size={16} color={theme.color.headerTextColor} />
        </StyledHeaderDragHandle>
        {column.editable && (
          <StyledHeaderEditIcon title="editable column">
            <MdOutlineEdit size={14} color={theme.color.headerTextColor} />
          </StyledHeaderEditIcon>
        )}
        <StyledHeaderColumnLabel>
          <ExploreTableHeaderTooltip column={column}>{column.name}</ExploreTableHeaderTooltip>
        </StyledHeaderColumnLabel>
        <StyledHeaderColumnControls>
          <Button
            noBorder
            noBackground
            inverted
            disabled={isFirst}
            icon={<MdChevronLeft size={15} color={theme.color.headerTextColor} />}
            onClick={() => onMoveColumn(index, index - 1)}
            tooltipLabel="move column left"
          />
          <Button
            noBorder
            noBackground
            inverted
            disabled={isLast}
            icon={<MdChevronRight size={15} color={theme.color.headerTextColor} />}
            onClick={() => onMoveColumn(index, index + 1)}
            tooltipLabel="move column right"
          />
          <Button
            noBorder
            noBackground
            inverted
            icon={<CgClose color={theme.color.headerTextColor} />}
            onClick={() => onRemoveColumn(column.id)}
            tooltipLabel="remove column"
          />
        </StyledHeaderColumnControls>
      </StyledHeaderColumnContent>
    </StyledHeaderColumnCell>
  );
};

export default ExploreTableHeaderColumn;
