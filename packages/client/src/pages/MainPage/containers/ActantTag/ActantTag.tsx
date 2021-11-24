import React, { ReactNode } from "react";
import { Tag } from "components";
import { IActant, IEntity } from "@shared/types";
import { DragItem } from "types";
import { PopupPosition } from "reactjs-popup/dist/types";

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
  tooltipPosition?: PopupPosition | PopupPosition[];
  updateOrderFn?: (item: DragItem) => void;
  lvl?: number;
  statementsCount?: number;
  favorited?: boolean;
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
  tooltipPosition,
  updateOrderFn,
  lvl,
  statementsCount,
  favorited,
  disabled,
}) => {
  const classId = actant.class;

  return (
    <Tag
      propId={actant.id}
      label={actant.label}
      status={actant.status}
      ltype={actant.data.logicalType ?? "1"}
      tooltipDetail={actant.detail}
      tooltipText={tooltipText}
      short={short}
      button={button}
      moveFn={moveFn}
      category={classId}
      mode={mode}
      borderStyle="solid"
      invertedLabel={isSelected}
      index={index}
      enableTooltip={enableTooltip}
      tooltipPosition={tooltipPosition}
      updateOrderFn={updateOrderFn}
      parentId={parentId}
      lvl={lvl}
      fullWidth={fullWidth}
      favorited={favorited}
      statementsCount={statementsCount}
    />
  );
};
