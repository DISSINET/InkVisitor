import { EntityStatus } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Tag } from "components";
import React, { ReactNode } from "react";
import { PopupPosition } from "reactjs-popup/dist/types";
import { DragItem } from "types";

interface EntityTag {
  entity: IEntity;
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
  disableDoubleClick?: boolean;
  disableDrag?: boolean;
  tooltipPosition?: PopupPosition | PopupPosition[];
  updateOrderFn?: (item: DragItem) => void;
  lvl?: number;
  statementsCount?: number;
  isFavorited?: boolean;
}

export const EntityTag: React.FC<EntityTag> = ({
  entity,
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
  disableDrag = false,
  disableDoubleClick = false,
  tooltipPosition,
  updateOrderFn,
  lvl,
  statementsCount,
  isFavorited,
}) => {
  const classId = entity.class;

  return (
    <Tag
      propId={entity.id}
      label={entity.label || entity.data.text || "no label"}
      labelItalic={entity.label === ""}
      status={entity.status}
      ltype={entity?.data?.logicalType ?? "1"}
      tooltipDetail={entity.detail}
      isTemplate={entity.isTemplate}
      isDiscouraged={entity.status === EntityStatus.Discouraged}
      entity={entity}
      tooltipText={tooltipText}
      showOnly={showOnly}
      button={button}
      moveFn={moveFn}
      entityClass={classId}
      mode={mode}
      borderStyle="solid"
      invertedLabel={isSelected}
      index={index}
      disableTooltip={disableTooltip}
      disableDoubleClick={disableDoubleClick}
      disableDrag={disableDrag}
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
