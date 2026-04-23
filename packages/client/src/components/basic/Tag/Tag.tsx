import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { useSearchParams, useTheme } from "hooks";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { setDetailBoxState } from "redux/features/layout/mainPage/detailBoxStateSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { DetailBoxState, DraggedEntityReduxItem, EntityDragItem } from "types";
import { getShortLabelByLetterCount } from "utils/utils";
import { StyledButtonWrapper, StyledElvlWrapper, StyledTagWrapper } from "./TagStyles";
import useDragDrop from "./useDragDrop";

interface TagProps {
  propId: string;
  parentId?: string;
  label?: string;

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
  disableCopyLabel?: boolean;
  disableDoubleClick?: boolean;
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
  label = "",
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
  disableCopyLabel = false,
  disableDoubleClick = false,
  disableDrag = false,
  updateOrderFn = () => {},
  isTemplate = false,
  isDiscouraged = false,
  lvl,

  onButtonOver,
  onButtonOut,
  onBtnClick,
}) => {
  const theme = useTheme();
  const { appendDetailId } = useSearchParams();
  const dispatch = useAppDispatch();
  const draggedEntity: DraggedEntityReduxItem = useAppSelector((state) => state.draggedEntity);
  const detailBoxState: DetailBoxState = useAppSelector(
    (state) => state.layout.mainPage.detailBoxState
  );

  const [clickedOnce, setClickedOnce] = useState(false);
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

  useEffect(() => {
    if (!clickedOnce) return;

    const timeout = setTimeout(() => {
      navigator.clipboard.writeText(label);
      toast.info(`label [${getShortLabelByLetterCount(label, 200)}] copied to clipboard`);
      setClickedOnce(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [clickedOnce]);

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
    entityClass,
    tagComponent,
    elvlButtonGroup,
    labelComponent,
    fullWidth,
    showOnly,
    status,
    button,
    isTemplate,
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
      onClick={(e) => {
        e.stopPropagation();
        if (!disableCopyLabel) setClickedOnce(true);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setClickedOnce(false);
        if (!disableDoubleClick) {
          appendDetailId(propId);
          if (detailBoxState === DetailBoxState.Minimized) {
            dispatch(setDetailBoxState(DetailBoxState.Normal));
          }
        }
      }}
    >
      {renderTag}
    </StyledTagWrapper>
  );
};
