import React, { ReactNode } from "react";
import classNames from "classnames";

interface TagProps {
  label?: string;
  category: string;
  color: string;
  mode?: "selected" | false;
  button?: ReactNode;
  marginRight?: boolean;
}

export const Tag: React.FC<TagProps> = ({
  label,
  category,
  color,
  mode,
  button,
  marginRight,
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
    marginRight && "mr-1"
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
      "border-r-2": !!label,
      "border-primary": !!label,
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
