import { Placement } from "@popperjs/core";
import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Tag } from "components";
import { EntityTooltip } from "components/advanced";
import React, { ReactNode, useEffect, useState } from "react";
import { EntityDragItem } from "types";
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
  tooltipPosition?: Placement;
  updateOrderFn?: (item: EntityDragItem) => void;
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
  button = false,
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
  const [buttonHovered, setButtonHovered] = useState(false);

  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [tagHovered, setTagHovered] = useState(false);

  return (
    <>
      <div
        style={{ display: "inline-flex", overflow: "hidden" }}
        ref={setReferenceElement}
        onMouseEnter={() => setTagHovered(true)}
        onMouseLeave={() => setTagHovered(false)}
      >
        {tagHovered && !disableTooltip && (
          <EntityTooltip
            entityId={entity.id}
            entityClass={entity.class}
            label={getEntityLabel(entity)}
            detail={entity.detail}
            text={tooltipText}
            itemsCount={statementsCount}
            position={tooltipPosition}
            disabled={button ? buttonHovered : false}
            tagHovered={tagHovered}
            referenceElement={referenceElement}
          />
        )}
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
          onButtonOver={() => setButtonHovered(true)}
          onButtonOut={() => setButtonHovered(false)}
          onBtnClick={() => {
            setButtonHovered(false);
            setTagHovered(false);
          }}
        />
      </div>
    </>
  );
};
