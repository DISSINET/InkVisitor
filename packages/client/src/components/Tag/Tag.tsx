import React, { ReactNode, MouseEventHandler } from "react";
import classNames from "classnames";

interface TagProps {
  label?: string;
  category: string;
  color: string;
  mode?: "selected" | false;
  button?: ReactNode;
}

export const Tag: React.FC<TagProps> = ({
  label,
  category,
  color,
  mode,
  button,
}) => {
  const tagClasses = classNames(
    "component",
    "tag",
    "border-black",
    "border-2",
    "inline-flex",
    "rounded-md",
    "overflow-hidden",
    "max-w-xs"
  );

  const entityClasses = classNames(
    `bg-${color}`,
    "tag-entity",
    "inline",
    "w-6",
    "p-1",
    "text-center",
    "font-bold"
  );
  const labelClasses = classNames(
    "tag-label",
    "inline",
    "align-middle",
    "p-1",
    "truncate",
    "bg-white",
    { "bg-primary text-white": mode === "selected" }
  );
  const buttonClasses = classNames(
    "tag-button",
    "flex",
    "-mt-2",
    "-mb-2",
    "align-middle"
  );

  return (
    <div className={tagClasses}>
      <div className={entityClasses}>{category}</div>
      {label && <div className={labelClasses}>{label}</div>}
      {button && <div className={buttonClasses}>{button}</div>}
    </div>
  );
};

Tag.defaultProps = {
  label: "",
  category: "T",
  color: "black",
  mode: false,
};
