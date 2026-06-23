import styled from "styled-components";

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
  gap: 0.3rem;
  position: relative;
  padding: 0 0.25rem;
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

export const StyledHighlightTooltipDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const StyledInfoText = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["info"]};
  margin-left: 0.3rem;
`;
