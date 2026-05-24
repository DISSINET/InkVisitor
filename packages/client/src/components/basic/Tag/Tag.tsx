import { EntityEnums } from "@shared/enums";
import React, { ReactNode, useMemo } from "react";
import { StyledButtonWrapper, StyledElvlWrapper, StyledTagWrapper } from "./TagStyles";

interface TagProps {
  ref?: React.RefObject<HTMLDivElement>;
  // for cursor style
  dragDisabled?: boolean;
  // key in theme.color.tagBorderColor to set color of border (e.g. EntityTag status)
  tagBorderColorKey?: EntityEnums.Status;
  // key in theme.borderStyle to set style of left border (e.g. EntityTag logical type)
  borderStyleKey?: EntityEnums.LogicalType;
  // components to render inside tag
  tagComponent?: ReactNode;
  labelComponent?: ReactNode;
  // TODO: elvl button group is entity specific and should be moved to EntityTag
  elvlButtonGroup?: ReactNode | false;
  button?: ReactNode;

  showOnly?: "tag" | "label";

  onClick?: () => void;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onButtonOver?: () => void;
  onButtonOut?: () => void;
  onBtnClick?: () => void;
}

export const Tag: React.FC<TagProps> = ({
  ref,
  // TODO: consider sending border color as a prop as key of theme.color instead of tagBorderColorKey
  // status = EntityEnums.Status.Approved,
  tagBorderColorKey = EntityEnums.Status.Approved,
  // ltype = EntityEnums.LogicalType.Definite,
  borderStyleKey = EntityEnums.LogicalType.Definite,
  dragDisabled = false,
  tagComponent,
  labelComponent,
  button,
  elvlButtonGroup,
  showOnly,

  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
  onButtonOver,
  onButtonOut,
  onBtnClick,
}) => {
  const renderTag = useMemo(() => {
    const elvlWrapper = elvlButtonGroup && <StyledElvlWrapper>{elvlButtonGroup}</StyledElvlWrapper>;

    const buttonWrap = button && (
      <StyledButtonWrapper
        $tagBorderColorKey={tagBorderColorKey}
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
    tagBorderColorKey,
    button,
    onButtonOver,
    onButtonOut,
    onBtnClick,
  ]);

  return (
    <StyledTagWrapper
      ref={ref}
      className="tag"
      $tagBorderColorKey={tagBorderColorKey}
      $borderStyleKey={borderStyleKey}
      $dragDisabled={dragDisabled}
      onClick={(e) => {
        e.preventDefault();
        onClick && onClick();
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        onDoubleClick?.(e);
      }}
      onMouseEnter={onMouseEnter && onMouseEnter}
      onMouseLeave={onMouseLeave && onMouseLeave}
    >
      {renderTag}
    </StyledTagWrapper>
  );
};
