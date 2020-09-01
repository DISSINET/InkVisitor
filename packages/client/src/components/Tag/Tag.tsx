import React, { ReactNode, MouseEventHandler } from "react";
import classNames from "classnames";

import { EntityKeys, Entities } from "types";

interface TagProps {
  label?: string;
  entity: typeof Entities[EntityKeys];
  mode?: "selected" | false;
  button?: ReactNode;
}

export const Tag: React.FC<TagProps> = ({ label, entity, mode, button }) => {
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
    `bg-${entity.color}`,
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
      <div className={entityClasses}>{entity.id}</div>
      {label && <div className={labelClasses}>{label}</div>}
      {button && <div className={buttonClasses}>{button}</div>}
    </div>
  );
};

Tag.defaultProps = {
  label: "",
  entity: Entities.T,
  mode: false,
};
