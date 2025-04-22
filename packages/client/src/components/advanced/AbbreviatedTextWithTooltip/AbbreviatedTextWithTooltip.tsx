import React, { useState } from "react";
import { Tooltip } from "../../basic/Tooltip/Tooltip";
import {
  StyledText,
  StyledTextWrapper,
} from "./AbbreviatedTextWithTooltipStyles";

interface AbbreviatedTextWithTooltip {
  text?: string;
}
export const AbbreviatedTextWithTooltip: React.FC<
  AbbreviatedTextWithTooltip
> = ({ text = "" }) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);

  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
  return (
    <React.Fragment>
      <StyledTextWrapper
        ref={setReferenceElement}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
      >
        <div style={{ display: "grid" }}>
          <StyledText>{text}</StyledText>
        </div>
      </StyledTextWrapper>
      <Tooltip
        label={text}
        visible={isTooltipOpen}
        referenceElement={referenceElement}
      />
    </React.Fragment>
  );
};
