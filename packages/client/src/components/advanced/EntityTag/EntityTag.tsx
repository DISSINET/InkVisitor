import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Tag } from "components";
import { EntityTooltip } from "components/advanced";
import React, { ReactNode, useState } from "react";
import { PopupPosition } from "reactjs-popup/dist/types";
import { DragItem } from "types";
import { getEntityLabel } from "utils";

interface EntityTag {
  entity: IEntity;
  tooltipText?: string;
  parentId?: string;
  mode?: "selected" | "disabled" | "invalid" | false;
  showOnly?: "entity" | "label";
  fullWidth?: boolean;
  button?: ReactNode;
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
  const [tagHovered, setTagHovered] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  return (
    <EntityTooltip
      entityId={entity.id}
      label={getEntityLabel(entity)}
      detail={entity.detail}
      text={tooltipText}
      itemsCount={statementsCount}
      position={tooltipPosition}
      disabled={disableTooltip || buttonHovered}
      tagHovered={tagHovered}
    >
      <Tag
        propId={entity.id}
        label={getEntityLabel(entity)}
        labelItalic={entity.label === ""}
        status={entity.status}
        ltype={entity?.data?.logicalType ?? "1"}
        isTemplate={entity.isTemplate}
        isDiscouraged={entity.status === EntityEnums.Status.Discouraged}
        entity={entity}
        showOnly={showOnly}
        button={button}
        moveFn={moveFn}
        entityClass={classId}
        mode={mode}
        borderStyle="solid"
        invertedLabel={isSelected}
        index={index}
        disableDoubleClick={disableDoubleClick}
        disableDrag={disableDrag}
        updateOrderFn={updateOrderFn}
        parentId={parentId}
        lvl={lvl}
        fullWidth={fullWidth}
        isFavorited={isFavorited}
        onMouseOver={() => setTagHovered(true)}
        onMouseOut={() => setTagHovered(false)}
        onButtonOver={() => setButtonHovered(true)}
        onButtonOut={() => setButtonHovered(false)}
      />
    </EntityTooltip>
  );
};
