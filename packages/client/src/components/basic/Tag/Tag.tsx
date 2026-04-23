import { EntityEnums } from "@shared/enums";
import React, { ReactNode, useMemo } from "react";
import { StyledButtonWrapper, StyledElvlWrapper, StyledTagWrapper } from "./TagStyles";

interface TagProps {
  status?: EntityEnums.Status;
  ltype?: EntityEnums.LogicalType;

  // TODO: make obligatory
  tagComponent?: ReactNode;
  labelComponent?: ReactNode;
  button?: ReactNode;
  elvlButtonGroup?: ReactNode | false;
  showOnly?: "tag" | "label";

  onButtonOver?: () => void;
  onButtonOut?: () => void;
  onBtnClick?: () => void;
}

export const Tag: React.FC<TagProps> = ({
  status = EntityEnums.Status.Approved,
  ltype = EntityEnums.LogicalType.Definite,
  tagComponent,
  labelComponent,
  button,
  elvlButtonGroup,
  showOnly,

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
    <StyledTagWrapper className="tag" $status={status} $ltype={ltype}>
      {renderTag}
    </StyledTagWrapper>
  );
};
