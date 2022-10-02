import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Tooltip } from "components";
import { useSearchParams } from "hooks";
import React, { ReactNode, useEffect, useMemo, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { PopupPosition } from "reactjs-popup/dist/types";
import { setDraggedTerritory } from "redux/features/territoryTree/draggedTerritorySlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  DraggedTerritoryItem,
  EntityColors,
  EntityDragItem,
  ItemTypes,
} from "types";
import { dndHoverFn } from "utils";
import {
  ButtonWrapper,
  StyledEntityTag,
  StyledLabel,
  StyledTagWrapper,
  StyledTooltipSeparator,
} from "./TagStyles";

interface TagProps {
  propId: string;
  parentId?: string;
  label?: string;
  labelItalic?: boolean;
  tooltipDetail?: string;
  tooltipText?: string;
  entityClass?: EntityEnums.ExtendedClass;
  status?: string;
  ltype?: string;
  entity?: IEntity;

  mode?: "selected" | "disabled" | "invalid" | false;
  borderStyle?: "solid" | "dashed" | "dotted";
  button?: ReactNode;
  invertedLabel?: boolean;
  showOnly?: "entity" | "label";
  fullWidth?: boolean;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
  disableTooltip?: boolean;
  disableDoubleClick?: boolean;
  disableDrag?: boolean;
  tooltipPosition?: PopupPosition | PopupPosition[];
  updateOrderFn?: (item: EntityDragItem) => void;
  lvl?: number;
  statementsCount?: number;
  isFavorited?: boolean;
  isTemplate?: boolean;
  isDiscouraged?: boolean;
  disabled?: boolean;
}

export const Tag: React.FC<TagProps> = ({
  propId,
  parentId,
  label = "",
  labelItalic = false,
  tooltipDetail,
  tooltipText,
  entityClass = EntityEnums.Extension.Empty,
  status = "1",
  ltype = "1",
  entity,
  mode = false,
  borderStyle = "solid",
  button,
  invertedLabel,
  showOnly,
  fullWidth = false,
  index = -1,
  moveFn,
  tooltipPosition = "right top",
  // TODO: move tooltip to EntityTag
  disableTooltip = false,
  disableDoubleClick = false,
  disableDrag = false,
  updateOrderFn = () => {},
  statementsCount,
  isFavorited = false,
  isTemplate = false,
  isDiscouraged = false,
  lvl,
}) => {
  const { appendDetailId } = useSearchParams();
  const dispatch = useAppDispatch();
  const draggedTerritory: DraggedTerritoryItem = useAppSelector(
    (state) => state.territoryTree.draggedTerritory
  );

  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.TAG,
    hover(item: EntityDragItem, monitor: DropTargetMonitor) {
      if (moveFn && draggedTerritory && draggedTerritory.lvl === lvl) {
        dndHoverFn(item, index, monitor, ref, moveFn);
      }
    },
  });

  const canDrag = useMemo(
    () => entityClass !== EntityEnums.Extension.Empty && !disableDrag,
    [entityClass, disableDrag]
  );

  const [{ isDragging }, drag] = useDrag({
    item: {
      type: ItemTypes.TAG,
      id: propId,
      index,
      entityClass,
      isTemplate,
      isDiscouraged,
      entity: entity || false,
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: EntityDragItem | undefined, monitor: DragSourceMonitor) => {
      if (item && item.index !== index) updateOrderFn(item);
    },
    canDrag: canDrag,
  });

  useEffect(() => {
    if (isDragging) {
      dispatch(setDraggedTerritory({ id: propId, parentId, index, lvl }));
    } else {
      dispatch(setDraggedTerritory({}));
    }
  }, [isDragging]);

  drag(drop(ref));

  const renderEntityTag = () => (
    <StyledEntityTag
      color={EntityColors[entityClass].color}
      isTemplate={isTemplate}
    >
      {entityClass}
    </StyledEntityTag>
  );
  const renderButton = () => (
    <ButtonWrapper status={status}>{button}</ButtonWrapper>
  );

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    !disableDoubleClick && appendDetailId(propId);
  };

  const getShortTag = () => {
    return (
      <Tooltip
        position={tooltipPosition}
        label={label}
        detail={tooltipDetail}
        text={tooltipText}
        tagTooltip
        itemsCount={statementsCount}
      >
        <StyledTooltipSeparator>
          <StyledTagWrapper
            ref={ref}
            dragDisabled={!canDrag}
            status={status}
            ltype={ltype}
            borderStyle={borderStyle}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            onDoubleClick={(e: React.MouseEvent) => onDoubleClick(e)}
          >
            {showOnly === "entity" ? (
              <>{renderEntityTag()}</>
            ) : (
              <>
                <StyledLabel
                  invertedLabel={invertedLabel}
                  status={status}
                  borderStyle={borderStyle}
                  fullWidth={fullWidth}
                  isFavorited={isFavorited}
                  labelOnly
                  isItalic={labelItalic}
                >
                  {label}
                </StyledLabel>
              </>
            )}
            {button && renderButton()}
          </StyledTagWrapper>
        </StyledTooltipSeparator>
      </Tooltip>
    );
  };

  return (
    <>
      {showOnly ? (
        <>{getShortTag()}</>
      ) : (
        <>
          <Tooltip
            label={label}
            detail={tooltipDetail}
            text={tooltipText}
            disabled={disableTooltip}
            position={tooltipPosition}
            tagTooltip
            itemsCount={statementsCount}
          >
            <StyledTooltipSeparator>
              <StyledTagWrapper
                ref={ref}
                dragDisabled={!canDrag}
                borderStyle={borderStyle}
                status={status}
                ltype={ltype}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                onDoubleClick={(e: React.MouseEvent) => onDoubleClick(e)}
              >
                {renderEntityTag()}

                <StyledLabel
                  invertedLabel={invertedLabel}
                  status={status}
                  borderStyle={borderStyle}
                  fullWidth={fullWidth}
                  isFavorited={isFavorited}
                  isItalic={labelItalic}
                >
                  {label}
                </StyledLabel>

                {button && renderButton()}
              </StyledTagWrapper>
            </StyledTooltipSeparator>
          </Tooltip>
        </>
      )}
    </>
  );
};
