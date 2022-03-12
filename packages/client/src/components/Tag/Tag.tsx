import { Tooltip } from "components";
import { useSearchParams } from "hooks";
import React, { ReactNode, useEffect, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
  XYCoord,
} from "react-dnd";
import { PopupPosition } from "reactjs-popup/dist/types";
import { setDraggedTerritory } from "redux/features/territoryTree/draggedTerritorySlice";
import { useAppDispatch } from "redux/hooks";
import { DragItem, Entities, ItemTypes } from "types";
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
  tooltipDetail?: string;
  tooltipText?: string;
  category: string;
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
  enableTooltip?: boolean;
  tooltipPosition?: PopupPosition | PopupPosition[];
  updateOrderFn?: (item: DragItem) => void;
  lvl?: number;
  statementsCount?: number;
  isFavorited?: boolean;
  disabled?: boolean;
}

export const Tag: React.FC<TagProps> = ({
  propId,
  parentId,
  label = "",
  tooltipDetail,
  tooltipText,
  category = "T",
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
  enableTooltip = true,
  updateOrderFn = () => {},
  statementsCount,
  isFavorited = false,
  lvl,
}) => {
  const { setDetailId } = useSearchParams();
  const dispatch = useAppDispatch();

  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.TAG,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (moveFn) {
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
    <StyledEntityTag color={Entities[category].color}>
      {category}
    </StyledEntityTag>
  );
  const renderButton = () => (
    <ButtonWrapper status={status}>{button}</ButtonWrapper>
  );

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    setDetailId(propId);
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
                >
                  {label ? label : <i>{"no label"}</i>}
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
            disabled={!enableTooltip}
            position={tooltipPosition}
            tagTooltip
            itemsCount={statementsCount}
          >
            <StyledTooltipSeparator>
              <StyledTagWrapper
                ref={ref}
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
                >
                  {label ? label : <StyledItalic>{"no label"}</StyledItalic>}
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
