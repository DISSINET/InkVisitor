import React from "react";
import { TiDocumentText } from "react-icons/ti";
import { StyledDocumentTag, StyledDocumentTitle } from "./DocumentTitleStyles";

interface DocumentTitle {
  title?: string;
}
export const DocumentTitle: React.FC<DocumentTitle> = ({ title = "" }) => {
  return (
    <>
      <StyledDocumentTag>
        <TiDocumentText style={{ marginRight: "0.2rem", flexShrink: "0" }} />
        <div style={{ display: "grid" }}>
          <StyledDocumentTitle>{title}</StyledDocumentTitle>
        </div>
      </StyledDocumentTag>
    </>
  );
};
