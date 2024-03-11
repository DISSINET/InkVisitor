import {
  FloatingPortal,
  autoUpdate,
  offset,
  useFloating,
} from "@floating-ui/react";
import { EntityEnums } from "@shared/enums";
import { IResponseEntity } from "@shared/types";
import { Tooltip, TypeBar } from "components";
import { EntityTag } from "components/advanced";
import React, { MouseEventHandler, useRef, useState } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FiMove } from "react-icons/fi";
import { DragItem, ItemTypes } from "types";
import { dndHoverFnHorizontal, getEntityLabel } from "utils/utils";
import {
  StyledCgClose,
  StyledIconWrap,
  StyledLabel,
  StyledTab,
} from "./EntityDetailTabStyles";

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
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTag, setShowTag] = useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: "left",
    whileElementsMounted: autoUpdate,
    middleware: [offset({ mainAxis: -14 })],
  });

  const ref = useRef<HTMLDivElement>(null);

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
        // ref={setReferenceElement}
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
          // ref={ref}
          $isSelected={isSelected}
          $isItalic={
            entity?.class === EntityEnums.Class.Statement && !entity?.label
          }
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

        {isHovered && (
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
          <FloatingPortal id="page">
            <div
              ref={refs.setFloating}
              style={{
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
      />
    </>
  );
};
