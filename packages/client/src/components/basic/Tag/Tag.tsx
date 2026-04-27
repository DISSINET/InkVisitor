import { EntityEnums } from "@shared/enums";
import React, { ReactNode, useMemo } from "react";
import { StyledButtonWrapper, StyledElvlWrapper, StyledTagWrapper } from "./TagStyles";

interface TagProps {
  ref?: React.RefObject<HTMLDivElement>;
  // for cursor style
  dragDisabled?: boolean;
  // TODO: make move to parent
  status?: EntityEnums.Status;
  ltype?: EntityEnums.LogicalType;
  // TODO: make obligatory
  tagComponent?: ReactNode;
  labelComponent?: ReactNode;
  button?: ReactNode;
  elvlButtonGroup?: ReactNode | false;
  showOnly?: "tag" | "label";

  onClick?: () => void;
  onDoubleClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onButtonOver?: () => void;
  onButtonOut?: () => void;
  onBtnClick?: () => void;
}

export const Tag: React.FC<TagProps> = ({
  ref,
  status = EntityEnums.Status.Approved,
  ltype = EntityEnums.LogicalType.Definite,
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
      ref={ref}
      className="tag"
      // TODO: move to EntityTagStyles
      $status={status}
      $ltype={ltype}
      $dragDisabled={dragDisabled}
      onClick={(e) => {
        e.preventDefault();
        onClick && onClick();
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        onDoubleClick && onDoubleClick();
      }}
      onMouseEnter={onMouseEnter && onMouseEnter}
      onMouseLeave={onMouseLeave && onMouseLeave}
    >
      {renderTag}
    </StyledTagWrapper>
  );
};
