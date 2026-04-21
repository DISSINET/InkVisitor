import { Placement } from "@popperjs/core";
import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { ThemeColor } from "Theme/theme";
import { Button, ButtonGroup, Tag } from "components";
import { EntityTooltip } from "components/advanced";
import React, { ReactNode, useCallback, useRef, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { useAppSelector } from "redux/hooks";
import { DraggedEntityReduxItem, EntityDragItem } from "types";
import {
  getEntityLabel,
  isFirstLabelEmpty,
  isValidEntityClass,
} from "utils/utils";
import { StyledEntityTagWrap } from "./EntityTagStyles";

interface UnlinkButton {
  onClick: () => void;
  color?: keyof ThemeColor;
  tooltipLabel?: string;
  icon?: React.ReactNode;
}
interface EntityTag {
  entity: IEntity;
  parentId?: string;
  showOnly?: "tag" | "label";
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
  elvlButtonGroup?: ReactNode | false;
  flexListMargin?: boolean;

  unlinkButton?: UnlinkButton | false;
  customTooltipAttributes?: { partLabel?: string; childCount?: number };
}

const EntityTagComponent: React.FC<EntityTag> = ({
  entity,
  parentId,
  showOnly,
  fullWidth = false,
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

  elvlButtonGroup = false,
  flexListMargin = false,

  unlinkButton,
  customTooltipAttributes,
}) => {
  // Select a minimal boolean to avoid frequent re-renders on large objects
  const isDragging: boolean = useAppSelector((state) => {
    const anyState = state as unknown as {
      draggedEntity?: DraggedEntityReduxItem;
    };
    return Boolean(
      anyState.draggedEntity && Object.keys(anyState.draggedEntity).length
    );
  });
  const [buttonHovered, setButtonHovered] = useState(false);
  const [elvlHovered, setElvlHovered] = useState(false);
  const [tagHovered, setTagHovered] = useState(false);
  const referenceEl = useRef<HTMLDivElement | null>(null);

  const handleTagHovered = useCallback(() => {
    setTagHovered(true);
  }, []);

  const handleTagUnhovered = useCallback(() => {
    setTagHovered(false);
  }, []);
  const handleButtonHovered = useCallback(() => {
    setButtonHovered(true);
  }, []);

  const handleButtonUnhovered = useCallback(() => {
    setButtonHovered(false);
  }, []);

  const handleBtnClick = useCallback(() => {
    setButtonHovered(false);
    setTagHovered(false);
  }, []);

  if (entity === undefined || !entity) {
    return <></>;
  }

  const classId = entity.class;

  const renderUnlinkButton = useCallback((unlinkButton: UnlinkButton) => {
    return (
      <Button
        key="d"
        tooltipLabel={
          unlinkButton.tooltipLabel
            ? unlinkButton.tooltipLabel
            : "unlink entity"
        }
        icon={unlinkButton.icon ? unlinkButton.icon : <FaUnlink />}
        color={unlinkButton.color ? unlinkButton.color : "plain"}
        inverted
        onClick={unlinkButton.onClick}
      />
    );
  }, []);

  if (!isValidEntityClass(entity.class)) {
    // labels needs to have length and first label needs to be non-empty
    return (
      <Tag
        propId={entity.id}
        entityClass={EntityEnums.Extension.Invalid}
        label={getEntityLabel(entity)}
        labelItalic={isFirstLabelEmpty(entity.labels)}
        // button={unlinkButton && renderUnlinkButton(unlinkButton)}
        disableDrag
        disableDoubleClick
      />
    );
  }

  return (
    <StyledEntityTagWrap
      $flexListMargin={flexListMargin}
      ref={referenceEl}
      onMouseEnter={handleTagHovered}
      onMouseLeave={handleTagUnhovered}
    >
      {tagHovered && !disableTooltip && (
        <EntityTooltip
          entityId={entity.id}
          entityClass={entity.class}
          label={(entity.labels && entity.labels[0]) || <i>{"no label"}</i>}
          alternativeLabels={
            entity.labels && entity.labels.length > 1
              ? entity.labels.slice(1)
              : undefined
          }
          language={entity.language}
          detail={entity.detail}
          text={
            entity.class === EntityEnums.Class.Statement
              ? entity.data.text
              : undefined
          }
          isTemplate={entity.isTemplate}
          partOfSpeech={entity.data.pos}
          itemsCount={statementsCount}
          position={tooltipPosition}
          disabled={
            (button !== null && (buttonHovered || elvlHovered)) || isDragging
          }
          tagHovered={tagHovered}
          referenceElement={referenceEl.current}
          customTooltipAttributes={customTooltipAttributes}
        />
      )}
      <Tag
        propId={entity.id}
        label={getEntityLabel(entity)}
        labelItalic={isFirstLabelEmpty(entity.labels)}
        status={entity.status}
        ltype={entity?.data?.logicalType ?? EntityEnums.LogicalType.Definite}
        isTemplate={entity.isTemplate}
        isDiscouraged={entity.status === EntityEnums.Status.Discouraged}
        entity={entity}
        showOnly={showOnly}
        button={
          <>
            {button && button}
            {unlinkButton && renderUnlinkButton(unlinkButton)}
          </>
        }
        moveFn={moveFn}
        entityClass={classId}
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
        onButtonOver={handleButtonHovered}
        onButtonOut={handleButtonUnhovered}
        onBtnClick={handleBtnClick}
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
    </StyledEntityTagWrap>
  );
};

function areEntityTagsEqual(
  prev: Readonly<React.ComponentProps<typeof EntityTagComponent>>,
  next: Readonly<React.ComponentProps<typeof EntityTagComponent>>
) {
  // Compare minimal fields that affect rendering
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isFavorited !== next.isFavorited) return false;
  if (prev.showOnly !== next.showOnly) return false;
  if (prev.fullWidth !== next.fullWidth) return false;
  if (prev.disableTooltip !== next.disableTooltip) return false;
  if (prev.disableDoubleClick !== next.disableDoubleClick) return false;
  if (Boolean(prev.button) !== Boolean(next.button)) return false;
  if (Boolean(prev.unlinkButton) !== Boolean(next.unlinkButton)) return false;
  // Compare unlinkButton onClick function reference to ensure handlers are up-to-date
  if (
    prev.unlinkButton &&
    next.unlinkButton &&
    prev.unlinkButton.onClick !== next.unlinkButton.onClick
  )
    return false;
  // Compare function references to ensure they're up-to-date
  if (prev.moveFn !== next.moveFn) return false;
  if (prev.updateOrderFn !== next.updateOrderFn) return false;
  // Entity-based checks (fields that affect Tag/tooltip rendering)
  if (prev.entity?.id !== next.entity.id) return false;
  if (prev.entity?.class !== next.entity.class) return false;
  if (prev.entity?.status !== next.entity.status) return false;
  if (prev.entity?.data?.logicalType !== next.entity?.data?.logicalType)
    return false;
  if (prev.entity.isTemplate !== next.entity.isTemplate) return false;
  const prevLabel = getEntityLabel(prev.entity);
  const nextLabel = getEntityLabel(next.entity);
  if (prevLabel !== nextLabel) return false;
  return true;
}

export const EntityTag = React.memo(EntityTagComponent, areEntityTagsEqual);
