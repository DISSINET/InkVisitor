import React, { ReactNode, useRef } from "react";
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from "react-dnd";

import { ItemTypes } from "types";
import ReactTooltip from "react-tooltip";
import { TagWrapper, EntityTag, Label, ButtonWrapper } from "./TagStyles";

interface TagProps {
  label?: string;
  category: string;
  color: string;
  mode?: "selected" | "disabled" | "invalid" | false;
  borderStyle?: "solid" | "dashed" | "dotted";
  button?: ReactNode;
  marginRight?: boolean;
  invertedLabel?: boolean;
  short?: boolean;
  propId?: string;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export const Tag: React.FC<TagProps> = ({
  label = "",
  category = "T",
  color,
  mode = false,
  borderStyle = "solid",
  button,
  marginRight,
  propId,
  invertedLabel,
  short = false,
  index,
  moveFn,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: ItemTypes.TAG,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      if (!hoverIndex) {
        return;
      }
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      // Time to actually perform the action
      moveFn && moveFn(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    item: { type: ItemTypes.TAG, id: propId, index, category },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drag(drop(ref));

  return (
    <>
      <TagWrapper
        ref={ref}
        className="tag"
        data-for={"main"}
        data-tip={label ? label : "no label"}
        data-iscapture="true"
        data-tip-disable={!short}
        hasMarginRight={marginRight}
        borderStyle={borderStyle}
      >
        <EntityTag color={color}>{category}</EntityTag>
        {!short && label && (
          <Label invertedLabel={invertedLabel} logicalType={borderStyle}>
            {label}
          </Label>
        )}
        {button && <ButtonWrapper>{button}</ButtonWrapper>}
      </TagWrapper>
      <ReactTooltip
        id="main"
        place="bottom"
        type="dark"
        effect="solid"
        multiline={false}
      />
    </>
  );
};
