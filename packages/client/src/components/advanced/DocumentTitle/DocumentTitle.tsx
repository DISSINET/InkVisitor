import React, { useState } from "react";
import { TiDocumentText } from "react-icons/ti";
import { toast } from "react-toastify";
import { Tooltip } from "../../basic/Tooltip/Tooltip";
import {
  StyledDocumentTag,
  StyledDocumentTitle,
  StyledTitleHead,
  StyledTitleTail,
} from "./DocumentTitleStyles";

interface DocumentTitle {
  title?: string;
  size?: "sm" | "md" | "lg";
  width?: number | "full";
  noMargin?: boolean;
  /**
   * Characters kept visible at the END of a truncated title (middle ellipsis:
   * `Paolini_Ori…taBon_v2`). Document names often differ only in their suffix
   * — volume, year, version — which plain end truncation hides. 0 restores end
   * truncation. The full title stays on the tooltip and the copy click.
   */
  tailChars?: number;
}
export const DocumentTitle: React.FC<DocumentTitle> = ({
  title = "",
  size = "md",
  width = "full",
  noMargin = false,
  tailChars = 7,
}) => {
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);

  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);

  // A title barely longer than the tail would truncate to almost pure tail;
  // keep such short titles whole (the head span alone end-ellipsizes them).
  const splitAt = title.length > tailChars + 3 ? title.length - tailChars : title.length;
  const head = title.slice(0, splitAt);
  const tail = title.slice(splitAt);

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
        $noMargin={noMargin}
      >
        <TiDocumentText size={16} style={{ marginRight: "0.2rem", flexShrink: "0" }} />

        <StyledDocumentTitle>
          <StyledTitleHead>{head}</StyledTitleHead>
          {tail && <StyledTitleTail>{tail}</StyledTitleTail>}
        </StyledDocumentTitle>
      </StyledDocumentTag>
      <Tooltip label={title} visible={isTooltipOpen} referenceElement={referenceElement} />
    </React.Fragment>
  );
};
