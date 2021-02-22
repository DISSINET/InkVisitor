import React, { ReactNode, useRef } from "react";
import classNames from "classnames";
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from "react-dnd";

import { ItemTypes } from "types";
import "./tag.css";
import ReactTooltip from "react-tooltip";
import styled from "styled-components";
import { space1 } from "Theme/constants";

interface IEntityStyle {
  color: string;
}
const Entity = styled.div<IEntityStyle>`
  background-color: ${({ color, theme }) => theme.colors[color]};
  display: inline;
  padding-top: ${space1};
  padding-bottom: ${space1};
  text-align: center;
  font-weight: ${({ theme }) => theme.fontWeights["extrabold"]};
`;

interface TagProps {
  label?: string;
  category: string;
  color: string;
  mode?: "selected" | false;
  button?: ReactNode;
  marginRight?: boolean;
  invertedLabel?: boolean;
  showLabel?: boolean;
  propId?: string;
  index?: number;
  moveTagFn?: (dragIndex: number, hoverIndex: number) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export const Tag: React.FC<TagProps> = ({
  label,
  category,
  color,
  mode,
  button,
  marginRight,
  propId,
  invertedLabel,
  showLabel,
  index,
  moveTagFn,
}) => {
  const tagClasses = classNames(
    "component",
    "tag",
    "border-black",
    "border-2",
    "inline-flex",
    "rounded-md",
    "overflow-hidden",
    "max-w-xs",
    marginRight && "mr-1",
    "cursor-move",
    "text-black"
  );

  const entityClasses = classNames(
    // `bg-${color}`,
    "tag-entity",
    // "inline",
    "w-6",
    // "py-1",
    // "text-center",
    // "font-extrabold",
    {
      "border-r-2": !!label && !!showLabel,
      "border-primary": !!label && !!showLabel,
    }
  );
  const labelClasses = classNames(
    "tag-label",
    "inline",
    "align-middle",
    "py-1",
    "px-1",
    "truncate",
    invertedLabel ? "bg-primary text-white" : "bg-white",
    { "bg-primary text-white": mode === "selected" }
  );
  const buttonClasses = classNames(
    "tag-button",
    "flex",
    "-mt-2",
    "-mb-2",
    "align-middle"
  );

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
      moveTagFn && moveTagFn(dragIndex, hoverIndex);

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
      <div
        ref={ref}
        className={tagClasses}
        data-for={"main"}
        data-tip={label ? label : "no label"}
        data-iscapture="true"
        data-tip-disable={showLabel}
      >
        <Entity className={entityClasses} color={color}>
          {category}
        </Entity>
        {showLabel && label && <div className={labelClasses}>{label}</div>}
        {button && <div className={buttonClasses}>{button}</div>}
      </div>
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

Tag.defaultProps = {
  label: "",
  category: "T",
  color: "black",
  mode: false,
  showLabel: true,
};
