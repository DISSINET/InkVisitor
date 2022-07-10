import { Tooltip } from "components";
import { useSearchParams } from "hooks";
import React, { ReactNode, useEffect, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { PopupPosition } from "reactjs-popup/dist/types";
import { setDraggedTerritory } from "redux/features/territoryTree/draggedTerritorySlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { DraggedTerritoryItem, DragItem, Entities, ItemTypes } from "types";
import { dndHoverFn } from "utils";
import {
  ButtonWrapper,
  StyledEntityTag,
  StyledItalic,
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
  category?: string;
  status?: string;
  ltype?: string;
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
  tooltipPosition?: PopupPosition | PopupPosition[];
  updateOrderFn?: (item: DragItem) => void;
  lvl?: number;
  statementsCount?: number;
  isFavorited?: boolean;
  isTemplate?: boolean;
  disabled?: boolean;
}

export const Tag: React.FC<TagProps> = ({
  propId,
  parentId,
  label = "",
  labelItalic = false,
  tooltipDetail,
  tooltipText,
  category = "X",
  status = "1",
  ltype = "1",
  mode = false,
  borderStyle = "solid",
  button,
  invertedLabel,
  showOnly,
  fullWidth = false,
  index = -1,
  moveFn,
  tooltipPosition = "right top",
  disableTooltip = false,
  disableDoubleClick = false,
  updateOrderFn = () => {},
  statementsCount,
  isFavorited = false,
  isTemplate = false,
  lvl,
}) => {
  const { setDetailId } = useSearchParams();
  const dispatch = useAppDispatch();
  const draggedTerritory: DraggedTerritoryItem = useAppSelector(
    (state) => state.territoryTree.draggedTerritory
  );

  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.TAG,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (moveFn && draggedTerritory && draggedTerritory.lvl === lvl) {
        dndHoverFn(item, index, monitor, ref, moveFn);
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    item: { type: ItemTypes.TAG, id: propId, index, category },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      if (item && item.index !== index) updateOrderFn(item);
    },
    canDrag: category !== "X",
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
    <StyledEntityTag color={Entities[category].color} isTemplate={isTemplate}>
      {category}
    </StyledEntityTag>
  );
  const renderButton = () => (
    <ButtonWrapper status={status}>{button}</ButtonWrapper>
  );

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    !disableDoubleClick && setDetailId(propId);
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
            isEmpty={category === "X"}
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
                isEmpty={category === "X"}
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
