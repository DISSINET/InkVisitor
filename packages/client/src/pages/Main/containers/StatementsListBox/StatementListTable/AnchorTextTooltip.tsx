import { Tooltip } from "components";
import React, { useState } from "react";
import { TbAnchor } from "react-icons/tb";
import { getShortLabelByLetterCount } from "utils/utils";
import { StyledAnchor } from "./StatementListTableStyles";

interface AnchorTextTooltip {
  anchorText: string;
}
// Cap the tooltip body so a very long anchor span cannot fill the screen; the
// Tooltip container also constrains width and wraps the remainder.
const MAX_TOOLTIP_LETTERS = 1000;

export const AnchorTextTooltip: React.FC<AnchorTextTooltip> = ({
  anchorText,
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <StyledAnchor
        ref={setReferenceElement}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <TbAnchor size={12} strokeWidth={2} />
      </StyledAnchor>
      <Tooltip
        content={
          <div>{getShortLabelByLetterCount(anchorText, MAX_TOOLTIP_LETTERS)}</div>
        }
        visible={showTooltip}
        referenceElement={referenceElement}
      />
    </>
  );
};
