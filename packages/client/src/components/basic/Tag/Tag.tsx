import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { useSearchParams } from "hooks";
import React, { ReactNode, useEffect, useMemo, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { setDraggedEntity } from "redux/features/territoryTree/draggedEntitySlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  DraggedEntityReduxItem,
  EntityColors,
  EntityDragItem,
  ItemTypes,
} from "types";
import { dndHoverFn, isValidEntityClass } from "utils";
import {
  StyledButtonWrapper,
  StyledElvlWrapper,
  StyledEntityTag,
  StyledLabel,
  StyledTagWrapper,
} from "./TagStyles";

interface TagProps {
  propId: string;
  parentId?: string;
  label?: string;
  labelItalic?: boolean;

  entityClass?: EntityEnums.ExtendedClass;
  status?: string;
  ltype?: string;
  entity?: IEntity;

  mode?: "selected" | "disabled" | "invalid" | false;
  borderStyle?: "solid" | "dashed" | "dotted";
  button?: ReactNode;
  elvlButtonGroup?: ReactNode | false;
  invertedLabel?: boolean;
  showOnly?: "entity" | "label";
  fullWidth?: boolean;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
  disableDoubleClick?: boolean;
  disableDrag?: boolean;
  updateOrderFn?: (item: EntityDragItem) => void;
  lvl?: number;
  isFavorited?: boolean;
  isTemplate?: boolean;
  isDiscouraged?: boolean;
  disabled?: boolean;

  onButtonOver?: () => void;
  onButtonOut?: () => void;
  onBtnClick?: () => void;
}

export const Tag: React.FC<TagProps> = ({
  propId,
  parentId,
  label = "",
  labelItalic = false,
  entityClass = EntityEnums.Extension.NoClass,
  status = "1",
  ltype = "1",
  entity,
  mode = false,
  borderStyle = "solid",
  button,
  elvlButtonGroup,
  invertedLabel,
  showOnly,
  fullWidth = false,
  index = -1,
  moveFn,
  disableDoubleClick = false,
  disableDrag = false,
  updateOrderFn = () => {},
  isFavorited = false,
  isTemplate = false,
  isDiscouraged = false,
  lvl,

  onButtonOver,
  onButtonOut,
  onBtnClick,
}) => {
  const { appendDetailId } = useSearchParams();
  const dispatch = useAppDispatch();
  const draggedEntity: DraggedEntityReduxItem = useAppSelector(
    (state) => state.draggedEntity
  );

  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.TAG,
    hover(item: EntityDragItem, monitor: DropTargetMonitor) {
      // TODO: debounce?
      if (moveFn && draggedEntity && draggedEntity.lvl === lvl) {
        dndHoverFn(item, index, monitor, ref, moveFn);
      }
    },
  });

  const canDrag = useMemo(
    () => entityClass !== EntityEnums.Extension.Empty && !disableDrag,
    [entityClass, disableDrag]
  );

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TAG,
    item: {
      type: ItemTypes.TAG,
      id: propId,
      index,
      entityClass: entityClass as EntityEnums.Class,
      isTemplate,
      isDiscouraged,
      entity: entity || false,
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (
      item: EntityDragItem | false | undefined,
      monitor: DragSourceMonitor
    ) => {
      if (item && item.index !== index) updateOrderFn(item);
    },
    canDrag: canDrag,
  });

  useEffect(() => {
    if (isDragging) {
      dispatch(setDraggedEntity({ id: propId, parentId, index, lvl }));
    } else {
      dispatch(setDraggedEntity({}));
    }
  }, [isDragging]);

  drag(drop(ref));

  const renderEntityTag = () => (
    <StyledEntityTag
      color={
        entityClass !== EntityEnums.Extension.Invalid
          ? EntityColors[entityClass].color
          : "white"
      }
      isTemplate={isTemplate}
    >
      {entityClass}
    </StyledEntityTag>
  );

  const renderElvl = () => (
    <StyledElvlWrapper>{elvlButtonGroup}</StyledElvlWrapper>
  );

  const renderButton = () => (
    <StyledButtonWrapper
      status={status}
      onMouseEnter={onButtonOver}
      onMouseLeave={onButtonOut}
      onClick={onBtnClick}
    >
      {button}
    </StyledButtonWrapper>
  );

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    !disableDoubleClick && appendDetailId(propId);
  };

  const getShortTag = () => {
    return (
      <>
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
      </>
    );
  };

  const getFullTag = () => {
    return (
      <>
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
        {elvlButtonGroup && renderElvl()}
        {button && renderButton()}
      </>
    );
  };

  return (
    <>
      <StyledTagWrapper
        className="tag"
        ref={ref}
        dragDisabled={!canDrag}
        status={status}
        ltype={ltype}
        borderStyle={borderStyle}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        onDoubleClick={(e: React.MouseEvent) => onDoubleClick(e)}
      >
        {showOnly ? <>{getShortTag()}</> : <>{getFullTag()}</>}
      </StyledTagWrapper>
    </>
  );
};
