import React, { ReactNode, useEffect, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
  XYCoord,
} from "react-dnd";

import { DragItem, ItemTypes, Entities } from "types";
import {
  StyledTagWrapper,
  StyledEntityTag,
  StyledLabel,
  ButtonWrapper,
  StyledTooltipSeparator,
} from "./TagStyles";
import { useAppDispatch } from "redux/hooks";
import { setDraggedTerritory } from "redux/features/territoryTree/draggedTerritorySlice";
import { useSearchParams } from "hooks";
import { TagTooltip } from "./TagTooltip";
import { PopupPosition } from "reactjs-popup/dist/types";

interface TagProps {
  propId: string;
  parentId?: string;
  label?: string;
  tooltipDetail?: string;
  tooltipText?: string;
  category: string;
  mode?: "selected" | "disabled" | "invalid" | false;
  borderStyle?: "solid" | "dashed" | "dotted";
  button?: ReactNode;
  invertedLabel?: boolean;
  short?: boolean;
  fullWidth?: boolean;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
  enableTooltip?: boolean;
  tooltipPosition?: PopupPosition | PopupPosition[];
  updateOrderFn?: (item: DragItem) => void;
  lvl?: number;
  disabled?: boolean;
}

export const Tag: React.FC<TagProps> = ({
  propId,
  parentId,
  label = "",
  tooltipDetail,
  tooltipText,
  category = "T",
  mode = false,
  borderStyle = "solid",
  button,
  invertedLabel,
  short = false,
  fullWidth = false,
  index = -1,
  moveFn,
  tooltipPosition = "right top",
  enableTooltip = true,
  updateOrderFn = () => {},
  lvl,
}) => {
  const { setActantId } = useSearchParams();
  const dispatch = useAppDispatch();

  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.TAG,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex: number = item.index;
      const hoverIndex: number | undefined = index;

      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (hoverIndex === undefined) {
        return;
      }
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveFn && moveFn(dragIndex, hoverIndex);
      item.index = hoverIndex;
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
  const renderButton = () => <ButtonWrapper>{button}</ButtonWrapper>;

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    setActantId(propId);
  };

  return (
    <>
      {short ? (
        <TagTooltip
          position={tooltipPosition}
          label={label}
          detail={tooltipDetail}
          text={tooltipText}
        >
          <div>
            <StyledTagWrapper
              ref={ref}
              borderStyle={borderStyle}
              onDoubleClick={(e: React.MouseEvent) => onDoubleClick(e)}
              onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
                e.stopPropagation()
              }
            >
              {renderEntityTag()}
              {button && renderButton()}
            </StyledTagWrapper>
          </div>
        </TagTooltip>
      ) : (
        <>
          <TagTooltip
            label={label}
            detail={tooltipDetail}
            text={tooltipText}
            disabled={!enableTooltip}
            position={tooltipPosition}
          >
            <StyledTooltipSeparator>
              <StyledTagWrapper
                ref={ref}
                borderStyle={borderStyle}
                onDoubleClick={(e: React.MouseEvent) => onDoubleClick(e)}
                onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
                  e.stopPropagation()
                }
              >
                {renderEntityTag()}
                {label && (
                  <StyledLabel
                    invertedLabel={invertedLabel}
                    borderStyle={borderStyle}
                    fullWidth={fullWidth}
                  >
                    {label}
                  </StyledLabel>
                )}
                {button && renderButton()}
              </StyledTagWrapper>
            </StyledTooltipSeparator>
          </TagTooltip>
        </>
      )}
    </>
  );
};
