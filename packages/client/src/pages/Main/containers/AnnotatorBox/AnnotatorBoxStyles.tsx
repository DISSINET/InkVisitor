import styled from "styled-components";
import { EntityColors } from "types";

/** Everything the annotator box holds: the document line, then the annotator. */
export const StyledAnnotatorContent = styled.div`
  width: 100%;
`;

export const StyledWarningsListHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color.blue[400]};
  margin-bottom: ${({ theme }) => theme.space[3]};
`;

export const StyledDocumentContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

export const StyledWarningWrapper = styled.div`
  display: inline-flex;
  flex-shrink: 0;
`;

export const StyledLoadingDocument = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0.25rem 1rem;
  border-radius: 2rem;
  overflow: hidden;
  width: 100%;
`;

export const StyledHighlightTooltipTitle = styled.div`
  margin-bottom: ${({ theme }) => theme.space[2]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;

export const StyledHighlightTooltipRow = styled.span`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

export const StyledHighlightTooltipDot = styled.span<{ $entityClass: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ theme, $entityClass }) =>
    EntityColors[$entityClass]
      ? (theme.color[EntityColors[$entityClass].color] as string)
      : "transparent"};
  flex-shrink: 0;
`;

export const StyledInfoText = styled.div`
  display: flex;
  font-size: 1.3rem;
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  color: ${({ theme }) => theme.color["info"]};
`;
