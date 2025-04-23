import React from "react";
import { TiDocumentText } from "react-icons/ti";
import { StyledDocumentTag, StyledDocumentTitle } from "./DocumentTitleStyles";

interface DocumentTitle {
  title?: string;
  size?: "sm" | "md" | "lg";
}
export const DocumentTitle: React.FC<DocumentTitle> = ({
  title = "",
  size = "md",
}) => {
  return (
    <>
      <StyledDocumentTag $size={size}>
        <TiDocumentText style={{ marginRight: "0.2rem", flexShrink: "0" }} />
        <div style={{ display: "grid" }}>
          <StyledDocumentTitle>{title}</StyledDocumentTitle>
        </div>
      </StyledDocumentTag>
    </>
  );
};
