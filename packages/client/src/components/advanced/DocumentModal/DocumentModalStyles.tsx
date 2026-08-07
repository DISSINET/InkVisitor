import { styled } from "styled-components";

export const StyledExportDocumentContainer = styled.div`
  display: grid;
  grid-template-columns: 1em 10em 20em;
  grid-template-rows: auto;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  align-items: center;
`;

export const StyledExportDocumentClassRow = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 1rem;
`;

interface StyledExportDocumentClassLabelProps {
  $selected: boolean;
}

export const StyledExportDocumentClassLabel = styled.div<StyledExportDocumentClassLabelProps>`
  font-weight: ${({ $selected, theme }) =>
    $selected ? theme.fontWeight["bold"] : theme.fontWeight["normal"]};
  cursor: pointer;
`;
export const StyledExportDocumentClassReference = styled.div`
  display: inline-flex;
  text-align: center;
  white-space: nowrap;
  gap: ${({ theme }) => theme.space[1]};
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledExportDocumentContainerTH = styled.div`
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

export const StyledExportDocumentClassCheckbox = styled.div`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
`;

export const StyledExportDocumentClassReferenceList = styled.div`
  display: inline-flex;
  gap: ${({ theme }) => theme.space[1]};
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledExportDocumentButton = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

export const StyledExportStatsSection = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-style: italic;
  flex: 1 1 auto;
  min-width: 0;
  margin-right: ${({ theme }) => theme.space[4]};
`;

/** Keeps the footer buttons at their natural width while the note wraps */
export const StyledExportFooterActions = styled.div`
  flex-shrink: 0;
`;

/**
 * Titles of a batch export. The tags wrap and keep their content width, so a
 * handful of short titles takes one row instead of a column of full-width bars.
 */
export const StyledExportTitleList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  max-height: 9rem;
  overflow-y: auto;
  margin-top: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

/** Single-document export: the one title next to the modal's heading */
export const StyledExportHeaderTitle = styled.div`
  display: grid;
`;

export const StyledExportDocumentsToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.color["black"]};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color["primary"]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color["primary"]};
    outline-offset: 2px;
  }
`;

export const StyledExportInfoText = styled.div`
  margin-bottom: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-style: italic;
`;

/**
 * The annotator's slot in the document modal. Fills the modal body so its
 * measured width is the space the canvas actually has, rather than the modal
 * width minus a hand-tuned allowance for the body's own chrome.
 */
export const StyledDocumentModalAnnotator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  border-bottom-left-radius: 7px;
  border-bottom-right-radius: 7px;
  overflow: hidden;
`;
