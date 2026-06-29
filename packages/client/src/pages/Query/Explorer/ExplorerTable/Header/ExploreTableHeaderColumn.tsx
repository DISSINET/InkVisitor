import { Explore } from "@inkvisitor/shared/types/query";
import { Button } from "components";
import { useTheme } from "hooks";
import React, { useRef } from "react";
import { DragSourceMonitor, DropTargetMonitor, useDrag, useDrop } from "react-dnd";
import { CgClose } from "react-icons/cg";
import {
  MdChevronLeft,
  MdChevronRight,
  MdDragIndicator,
  MdOutlineEdit,
} from "react-icons/md";
import { DragItem, Identifier, ItemTypes } from "types";
import { getColumnWidth } from "../utils";
import {
  StyledHeaderColumnContent,
  StyledHeaderColumnControls,
  StyledHeaderColumnLabel,
  StyledHeaderDragHandle,
} from "../ExplorerTableStyles";
import { ExploreTableHeaderTooltip } from "./ExploreTableHeaderTooltip";

interface ExploreTableHeaderColumn {
  column: Explore.IExploreColumn;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onRemoveColumn: (id: string) => void;
  onMoveColumn: (fromIndex: number, toIndex: number) => void;
}

const ExploreTableHeaderColumn: React.FC<ExploreTableHeaderColumn> = ({
  column,
  index,
  isFirst,
  isLast,
  onRemoveColumn,
  onMoveColumn,
}) => {
  const theme = useTheme();
  const dropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLSpanElement>(null);
  const width = getColumnWidth(column.type);

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: ItemTypes.EXPLORER_COLUMN,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!dropRef.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      // Swap as soon as the pointer crosses into this column (its leading edge),
      // not at its midpoint - columns have different widths.
      const rect = dropRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const hoverClientX = clientOffset.x - rect.left;
      // Moving right: trigger once past the start (left edge) of the next column.
      if (dragIndex < hoverIndex && hoverClientX < 0) {
        return;
      }
      // Moving left: trigger once past the middle of the previous column.
      if (dragIndex > hoverIndex && hoverClientX > rect.width / 2) {
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
    <div
      ref={dropRef}
      data-handler-id={handlerId}
      className="qt-col qt-col-header"
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        display: "flex",
        alignItems: "center",
      }}
    >
      <StyledHeaderColumnContent $isDragging={isDragging}>
        <StyledHeaderDragHandle ref={dragRef} title="drag to reorder">
          <MdDragIndicator size={14} color={theme.color.headerTextColor} />
        </StyledHeaderDragHandle>
        {column.editable && (
          <MdOutlineEdit size={14} style={{ marginRight: "0.3rem" }} />
        )}
        <StyledHeaderColumnLabel>
          <ExploreTableHeaderTooltip column={column}>
            {column.name}
          </ExploreTableHeaderTooltip>
        </StyledHeaderColumnLabel>
        <StyledHeaderColumnControls>
          <Button
            noBorder
            noBackground
            inverted
            disabled={isFirst}
            icon={<MdChevronLeft color={theme.color.headerTextColor} />}
            onClick={() => onMoveColumn(index, index - 1)}
            tooltipLabel="move column left"
          />
          <Button
            noBorder
            noBackground
            inverted
            disabled={isLast}
            icon={<MdChevronRight color={theme.color.headerTextColor} />}
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
    </div>
  );
};

export default ExploreTableHeaderColumn;
