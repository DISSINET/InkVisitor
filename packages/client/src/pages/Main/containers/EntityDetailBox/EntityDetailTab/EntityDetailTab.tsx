import { FloatingPortal, autoUpdate, offset, useFloating } from "@floating-ui/react";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IResponseEntity } from "@inkvisitor/shared/types";
import { Tooltip, TypeBar } from "components";
import { EntityTag } from "components/advanced";
import React, { MouseEventHandler, useLayoutEffect, useRef, useState } from "react";
import { DragSourceMonitor, DropTargetMonitor, useDrag, useDrop } from "react-dnd";
import { FiMove } from "react-icons/fi";
import { DragItem, ItemTypes } from "types";
import { dndHoverFnHorizontal, getEntityLabel } from "utils/utils";
import { StyledCgClose, StyledIconWrap, StyledLabel, StyledTab } from "./EntityDetailTabStyles";

/** Minimum tab width (px) to show the drag handle without crowding the close button. */
const MIN_TAB_WIDTH_FOR_MOVE_ICON = 40;

interface EntityDetailTab {
  entity: IResponseEntity;
  onClick?: MouseEventHandler<HTMLElement>;
  onClose?: () => void;
  isSelected?: boolean;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  onDragEnd?: () => void;
}
export const EntityDetailTab: React.FC<EntityDetailTab> = ({
  entity,
  onClick,
  onClose,
  isSelected = false,
  index,
  moveRow,
  onDragEnd,
}) => {
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTag, setShowTag] = useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: "left",
    whileElementsMounted: autoUpdate,
    middleware: [offset({ mainAxis: -14 })],
  });

  const ref = useRef<HTMLDivElement>(null);
  const [tabWidth, setTabWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      setTabWidth(Math.round(element.getBoundingClientRect().width));
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  const showMoveIcon = isHovered && tabWidth >= MIN_TAB_WIDTH_FOR_MOVE_ICON;

  const [, drop] = useDrop<DragItem>({
    accept: ItemTypes.DETAIL_TAB,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFnHorizontal(item, index, monitor, ref, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.DETAIL_TAB,
    item: { index, id: entity.id },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      if (item) onDragEnd && onDragEnd();
    },
  });

  drag(drop(ref));

  return (
    <>
      <StyledTab
        ref={ref}
        $isSelected={isSelected}
        onMouseEnter={() => {
          setShowTooltip(true);
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setShowTooltip(false);
          setIsHovered(false);
          setShowTag(false);
        }}
      >
        <StyledLabel
          ref={setReferenceElement}
          $isSelected={isSelected}
          $isItalic={entity?.class === EntityEnums.Class.Statement && !entity?.labels[0]}
          onClick={onClick}
        >
          {entity?.class && (
            <TypeBar
              entityLetter={entity?.class}
              isTemplate={entity.isTemplate}
              noMargin
              dimColor={!isSelected}
            />
          )}
          {!entity ? "..." : getEntityLabel(entity)}
        </StyledLabel>

        {showMoveIcon && (
          <StyledIconWrap
            onMouseDown={() => {
              setShowTag(true);
              setShowTooltip(false);
            }}
            ref={refs.setReference}
          >
            <FiMove size={13} style={{ cursor: "move" }} />
          </StyledIconWrap>
        )}

        {showTag && (
          <FloatingPortal id="page-content">
            <div
              ref={refs.setFloating}
              style={{
                zIndex: 200,
                ...floatingStyles,
              }}
            >
              <EntityTag entity={entity} />
            </div>
          </FloatingPortal>
        )}

        <StyledIconWrap onClick={onClose}>
          <StyledCgClose size={13} strokeWidth={0.5} />
        </StyledIconWrap>
      </StyledTab>

      <Tooltip
        visible={showTooltip}
        referenceElement={referenceElement}
        label={getEntityLabel(entity)}
        position="top"
      />
    </>
  );
};
