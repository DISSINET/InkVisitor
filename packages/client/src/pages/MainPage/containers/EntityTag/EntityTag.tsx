import { IEntity } from "@shared/types";
import { Tag } from "components";
import React, { ReactNode } from "react";
import { PopupPosition } from "reactjs-popup/dist/types";
import { DragItem } from "types";

interface EntityTag {
  actant: IEntity;
  tooltipText?: string;
  parentId?: string;
  mode?: "selected" | "disabled" | "invalid" | false;
  showOnly?: "entity" | "label";
  fullWidth?: boolean;
  button?: ReactNode;
  propId?: string;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
  isSelected?: boolean;
  disableTooltip?: boolean;
  tooltipPosition?: PopupPosition | PopupPosition[];
  updateOrderFn?: (item: DragItem) => void;
  lvl?: number;
  statementsCount?: number;
  isFavorited?: boolean;
}

export const EntityTag: React.FC<EntityTag> = ({
  actant,
  tooltipText,
  parentId,
  showOnly,
  fullWidth,
  mode,
  button,
  index,
  moveFn,
  isSelected,
  disableTooltip = false,
  tooltipPosition,
  updateOrderFn,
  lvl,
  statementsCount,
  isFavorited,
}) => {
  const classId = actant.class;

  return (
    <Tag
      propId={actant.id}
      label={actant.label || actant.data.text || "no label"}
      labelItalic={actant.label === ""}
      status={actant.status}
      ltype={actant?.data?.logicalType ?? "1"}
      tooltipDetail={actant.detail}
      isTemplate={actant.isTemplate}
      tooltipText={tooltipText}
      showOnly={showOnly}
      button={button}
      moveFn={moveFn}
      category={classId}
      mode={mode}
      borderStyle="solid"
      invertedLabel={isSelected}
      index={index}
      disableTooltip={disableTooltip}
      tooltipPosition={tooltipPosition}
      updateOrderFn={updateOrderFn}
      parentId={parentId}
      lvl={lvl}
      fullWidth={fullWidth}
      isFavorited={isFavorited}
      statementsCount={statementsCount}
    />
  );
};
