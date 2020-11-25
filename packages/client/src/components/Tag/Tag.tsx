import React, { ReactNode } from "react";
import classNames from "classnames";
import { useDrag } from "react-dnd";

import { ItemTypes } from "types";
import "./tag.css";
import ReactTooltip from "react-tooltip";

interface TagProps {
  label?: string;
  category: string;
  color: string;
  mode?: "selected" | false;
  button?: ReactNode;
  marginRight?: boolean;
  propId?: string;
  invertedLabel?: boolean;
  showLabel?: boolean;
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
    `bg-${color}`,
    "tag-entity",
    "inline",
    "w-6",
    "py-1",
    "px-2",
    "text-center",
    "text-xs",
    "font-bold",
    {
      "border-r-2": !!label && !!showLabel,
      "border-primary": !!label && !!showLabel,
    }
  );
  const labelClasses = classNames(
    "tag-label",
    "text-xs",
    "inline",
    "align-middle",
    "py-1",
    "px-2",
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

  const [{ opacity }, dragRef] = useDrag({
    item: { id: propId, type: ItemTypes.TAG, category },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1,
    }),
  });
  return (
    <>
      <div
        className={tagClasses}
        ref={dragRef}
        data-for={"main"}
        data-tip={label ? label : "no label"}
        data-iscapture="true"
        data-tip-disable={showLabel}
      >
        <div className={entityClasses}>{category}</div>
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
