import React, { useState } from "react";
import { TiDocumentText } from "react-icons/ti";
import { Tooltip } from "../Tooltip/Tooltip";
import { StyledDocumentTag, StyledDocumentTitle } from "./DocumentTitleStyles";

interface DocumentTitle {
  title?: string;
}
export const DocumentTitle: React.FC<DocumentTitle> = ({ title = "" }) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);

  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
  return (
    <React.Fragment>
      <StyledDocumentTag
        ref={setReferenceElement}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
      >
        <TiDocumentText style={{ marginRight: "0.2rem", flexShrink: "0" }} />
        <div style={{ display: "grid" }}>
          <StyledDocumentTitle>{title}</StyledDocumentTitle>
        </div>
      </StyledDocumentTag>
      <Tooltip
        label={title}
        visible={isTooltipOpen}
        referenceElement={referenceElement}
      />
    </React.Fragment>
  );
};
