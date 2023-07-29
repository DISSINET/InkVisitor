import { Placement } from "@popperjs/core";
import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { ThemeColor } from "Theme/theme";
import { Button, Tag } from "components";
import { EntityTooltip } from "components/advanced";
import React, { ReactNode, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { useAppSelector } from "redux/hooks";
import { DraggedEntityReduxItem, EntityDragItem } from "types";
import { getEntityLabel, isValidEntityClass } from "utils";

interface UnlinkButton {
  onClick: () => void;
  color?: keyof ThemeColor;
  tooltipLabel?: string;
  icon?: JSX.Element;
}
interface EntityTag {
  entity: IEntity;
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
  disableTooltipFetch?: boolean;
  tooltipPosition?: Placement;
  updateOrderFn?: (item: EntityDragItem) => void;
  lvl?: number;
  statementsCount?: number;
  isFavorited?: boolean;
  elvlButtonGroup?: ReactNode | false;

  unlinkButton?: UnlinkButton | false;
}

export const EntityTag: React.FC<EntityTag> = ({
  entity,
  parentId,
  showOnly,
  fullWidth = false,
  mode,
  button = false,
  index,
  moveFn,
  isSelected,
  disableTooltip = false,
  disableDrag = false,
  disableDoubleClick = false,
  disableTooltipFetch,
  tooltipPosition,
  updateOrderFn,
  lvl,
  statementsCount,
  isFavorited,

  elvlButtonGroup = false,

  unlinkButton,
}) => {
  const draggedEntity: DraggedEntityReduxItem = useAppSelector(
    (state) => state.draggedEntity
  );

  const classId = entity.class;
  const [buttonHovered, setButtonHovered] = useState(false);
  const [elvlHovered, setElvlHovered] = useState(false);

  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [tagHovered, setTagHovered] = useState(false);

  const renderUnlinkButton = (unlinkButton: UnlinkButton) => (
    <Button
      key="d"
      tooltipLabel={
        unlinkButton.tooltipLabel ? unlinkButton.tooltipLabel : "unlink entity"
      }
      icon={unlinkButton.icon ? unlinkButton.icon : <FaUnlink />}
      color={unlinkButton.color ? unlinkButton.color : "plain"}
      inverted
      onClick={unlinkButton.onClick}
    />
  );

  if (!isValidEntityClass(entity.class)) {
    return (
      <Tag
        propId={entity.id}
        entityClass={EntityEnums.Extension.Invalid}
        label={getEntityLabel(entity)}
        labelItalic={entity.label === ""}
        button={unlinkButton && renderUnlinkButton(unlinkButton)}
        disableDrag
        disableDoubleClick
      />
    );
  }

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
            label={entity.label || ""}
            language={entity.language}
            detail={entity.detail}
            text={entity.data.text ? entity.data.text : undefined}
            itemsCount={statementsCount}
            position={tooltipPosition}
            disabled={
              (button !== null && (buttonHovered || elvlHovered)) ||
              Object.keys(draggedEntity).length !== 0
            }
            tagHovered={tagHovered}
            referenceElement={referenceElement}
            disableTooltipFetch={disableTooltipFetch}
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
          button={
            button ? button : unlinkButton && renderUnlinkButton(unlinkButton)
          }
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
          elvlButtonGroup={
            elvlButtonGroup ? (
              <div
                onMouseOver={() => setElvlHovered(true)}
                onMouseOut={() => setElvlHovered(false)}
              >
                {elvlButtonGroup}
              </div>
            ) : (
              false
            )
          }
        />
      </div>
    </>
  );
};
