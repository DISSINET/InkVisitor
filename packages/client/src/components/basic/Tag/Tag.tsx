import { EntityEnums, InterfaceEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { useSearchParams } from "hooks";
import React, {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaStar } from "react-icons/fa";
import { toast } from "react-toastify";
import { setDraggedEntity } from "redux/features/territoryTree/draggedEntitySlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { ThemeContext } from "styled-components";
import {
  DraggedEntityReduxItem,
  EntityColors,
  EntityDragItem,
  ItemTypes,
} from "types";
import { dndHoverFn, getShortLabelByLetterCount } from "utils/utils";
import {
  StyledButtonWrapper,
  StyledElvlWrapper,
  StyledEntityTag,
  StyledLabel,
  StyledLabelWrap,
  StyledStarWrap,
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

  borderStyle?: "solid" | "dashed" | "dotted";
  button?: ReactNode;
  elvlButtonGroup?: ReactNode | false;
  invertedLabel?: boolean;
  showOnly?: "entity" | "label";
  fullWidth?: boolean;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
  disableCopyLabel?: boolean;
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
  borderStyle = "solid",
  button,
  elvlButtonGroup,
  invertedLabel = false,
  showOnly,
  fullWidth = false,
  index = -1,
  moveFn,
  disableCopyLabel = false,
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
  const selectedThemeId: InterfaceEnums.Theme = useAppSelector(
    (state) => state.theme
  );

  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop<EntityDragItem>({
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

  const [{ isDragging }, drag] = useDrag<
    EntityDragItem,
    unknown,
    { isDragging: boolean }
  >({
    type: ItemTypes.TAG,
    item: {
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
    end: (item: EntityDragItem | undefined, monitor: DragSourceMonitor) => {
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

  const [clickedOnce, setClickedOnce] = useState(false);

  useEffect(() => {
    if (clickedOnce) {
      const timeout = setTimeout(() => {
        navigator.clipboard.writeText(label);
        toast.info(
          `label [${getShortLabelByLetterCount(
            label,
            200
          )}] copied to clipboard`
        );
        setClickedOnce(false);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [clickedOnce]);

  const renderEntityTag = () => (
    <StyledEntityTag
      $color={
        entityClass !== EntityEnums.Extension.Invalid
          ? EntityColors[entityClass].color
          : "white"
      }
      isTemplate={isTemplate}
      darkTheme={selectedThemeId === InterfaceEnums.Theme.Dark}
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
    setClickedOnce(false);

    !disableDoubleClick && appendDetailId(propId);
  };

  const themeContext = useContext(ThemeContext);

  const renderLabel = (labelOnly: boolean = false) => {
    return (
      <StyledLabelWrap invertedLabel={invertedLabel}>
        {isFavorited && (
          <StyledStarWrap>
            <FaStar
              color={themeContext.color.warning}
              style={{ marginBottom: "0.1rem" }}
            />
          </StyledStarWrap>
        )}
        <StyledLabel
          invertedLabel={invertedLabel}
          status={status}
          borderStyle={borderStyle}
          fullWidth={fullWidth}
          isFavorited={isFavorited}
          labelOnly={labelOnly}
          isItalic={labelItalic}
        >
          {label}
        </StyledLabel>
      </StyledLabelWrap>
    );
  };

  const renderShortTag = () => {
    return (
      <>
        {showOnly === "entity" ? (
          <>{renderEntityTag()}</>
        ) : (
          <>{renderLabel(true)}</>
        )}
        {button && renderButton()}
      </>
    );
  };

  const renderFullTag = () => {
    return (
      <>
        {renderEntityTag()}
        {renderLabel()}
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
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          if (!disableCopyLabel) {
            setClickedOnce(true);
          }
        }}
        onDoubleClick={(e: React.MouseEvent) => onDoubleClick(e)}
      >
        {showOnly ? <>{renderShortTag()}</> : <>{renderFullTag()}</>}
      </StyledTagWrapper>
    </>
  );
};
