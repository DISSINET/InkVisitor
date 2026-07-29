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
  wrap: nowrap;
  gap: ${({ theme }) => theme.space[1]};
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledExportDocumentContainerTH = styled.div`
  display: inline-flex;
  align-items: center;
  text-wrap: nowrap;
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
  padding: 1rem;
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
`;
