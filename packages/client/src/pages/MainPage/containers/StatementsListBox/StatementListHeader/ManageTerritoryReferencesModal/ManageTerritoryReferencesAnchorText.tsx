import React, { useState } from "react";
import { StyledAnchorText } from "./ManageTerritoryReferencesModalStyles";
import { Tooltip } from "components";

interface ManageTerritoryReferencesAnchorText {
  extractedText: string[];
}
export const ManageTerritoryReferencesAnchorText: React.FC<
  ManageTerritoryReferencesAnchorText
> = ({ extractedText }) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <StyledAnchorText
        ref={setReferenceElement}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {extractedText}
      </StyledAnchorText>
      <Tooltip
        visible={showTooltip}
        referenceElement={referenceElement}
        label={extractedText[0]}
      />
    </>
  );
};
