import React, { ReactNode } from "react";
import { Tag } from "components";
import { IActant, IEntity } from "@shared/types";
import { DragItem } from "types";

interface IActantTag {
  actant: IActant | IEntity;
  tooltipText?: string;
  parentId?: string;
  mode?: "selected" | "disabled" | "invalid" | false;
  short?: boolean;
  fullWidth?: boolean;
  button?: ReactNode;
  propId?: string;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
  isSelected?: boolean;
  enableTooltip?: boolean;
  updateOrderFn?: (item: DragItem) => void;
  lvl?: number;
  disabled?: boolean;
}

export const ActantTag: React.FC<IActantTag> = ({
  actant,
  tooltipText,
  parentId,
  short = false,
  fullWidth,
  mode,
  button,
  index,
  moveFn,
  isSelected,
  enableTooltip = true,
  updateOrderFn,
  lvl,
  disabled,
}) => {
  const classId = actant.class;

  return (
    <Tag
      propId={actant.id}
      label={actant.label}
      detail={tooltipText ? tooltipText : actant.detail}
      short={short}
      button={button}
      moveFn={moveFn}
      category={classId}
      mode={mode}
      borderStyle="solid"
      invertedLabel={isSelected}
      index={index}
      enableTooltip={enableTooltip}
      updateOrderFn={updateOrderFn}
      parentId={parentId}
      lvl={lvl}
      fullWidth={fullWidth}
    />
  );
};
