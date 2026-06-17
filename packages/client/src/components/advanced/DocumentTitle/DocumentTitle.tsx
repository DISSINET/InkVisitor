import React, { useState } from "react";
import { TiDocumentText } from "react-icons/ti";
import { toast } from "react-toastify";
import { Tooltip } from "../../basic/Tooltip/Tooltip";
import { StyledDocumentTag, StyledDocumentTitle } from "./DocumentTitleStyles";

interface DocumentTitle {
  title?: string;
  size?: "sm" | "md" | "lg";
  width?: number | "full";
}
export const DocumentTitle: React.FC<DocumentTitle> = ({
  title = "",
  size = "md",
  width = "full",
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);

  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
  return (
    <React.Fragment>
      <StyledDocumentTag
        $size={size}
        $width={width}
        ref={setReferenceElement}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        onClick={() => {
          navigator.clipboard.writeText(title);
          toast.info(`document title [${title}] copied to clipboard`);
        }}
      >
        <TiDocumentText
          size={16}
          style={{ marginRight: "0.2rem", flexShrink: "0" }}
        />

        <StyledDocumentTitle>{title}</StyledDocumentTitle>
      </StyledDocumentTag>
      <Tooltip
        label={title}
        visible={isTooltipOpen}
        referenceElement={referenceElement}
      />
    </React.Fragment>
  );
};
