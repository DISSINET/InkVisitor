import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import React, { ReactNode, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { DraggedEntityReduxItem, EntityDragItem } from "types";
import { StyledButtonWrapper, StyledElvlWrapper, StyledTagWrapper } from "./TagStyles";
import useDragDrop from "./useDragDrop";

interface TagProps {
  propId: string;
  parentId?: string;
  // label?: string;

  // TODO: isolate entity logic to EntityTag
  entity?: IEntity;
  entityClass?: EntityEnums.ExtendedClass;
  status?: EntityEnums.Status;
  ltype?: EntityEnums.LogicalType;

  // TODO: make obligatory
  tagComponent?: ReactNode;
  labelComponent?: ReactNode;
  button?: ReactNode;
  elvlButtonGroup?: ReactNode | false;
  showOnly?: "tag" | "label";
  fullWidth?: boolean;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
  disableDrag?: boolean;
  updateOrderFn?: (item: EntityDragItem) => void;
  lvl?: number;
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
  entityClass = EntityEnums.Extension.NoClass,
  status = EntityEnums.Status.Approved,
  ltype = EntityEnums.LogicalType.Definite,
  entity,
  tagComponent,
  labelComponent,
  button,
  elvlButtonGroup,
  showOnly,
  fullWidth = false,
  index = -1,
  moveFn,
  disableDrag = false,
  updateOrderFn = () => {},
  isTemplate = false,
  isDiscouraged = false,
  lvl,

  onButtonOver,
  onButtonOut,
  onBtnClick,
}) => {
  const dispatch = useAppDispatch();
  const draggedEntity: DraggedEntityReduxItem = useAppSelector((state) => state.draggedEntity);
  const ref = useRef<HTMLDivElement>(null!);

  const [isDragging, canDrag, drag, drop] = useDragDrop({
    entity,
    isTemplate,
    isDiscouraged,
    propId,
    entityClass,
    disableDrag,
    index,
    lvl,
    updateOrderFn,
    draggedEntity,
    dispatch,
    moveFn,
    ref,
  });

  const renderTag = useMemo(() => {
    const elvlWrapper = elvlButtonGroup && <StyledElvlWrapper>{elvlButtonGroup}</StyledElvlWrapper>;

    const buttonWrap = button && (
      <StyledButtonWrapper
        $status={status}
        onMouseEnter={onButtonOver}
        onMouseLeave={onButtonOut}
        onClick={onBtnClick}
      >
        {button}
      </StyledButtonWrapper>
    );

    return showOnly ? (
      <>
        {showOnly === "tag" ? tagComponent : labelComponent}
        {buttonWrap}
      </>
    ) : (
      <>
        {tagComponent}
        {labelComponent}
        {elvlWrapper}
        {buttonWrap}
      </>
    );
  }, [
    tagComponent,
    labelComponent,
    elvlButtonGroup,
    showOnly,
    status,
    button,
    onButtonOver,
    onButtonOut,
    onBtnClick,
  ]);

  return (
    <StyledTagWrapper
      className="tag"
      ref={ref}
      $dragDisabled={!canDrag}
      $status={status}
      $ltype={ltype}
    >
      {renderTag}
    </StyledTagWrapper>
  );
};
