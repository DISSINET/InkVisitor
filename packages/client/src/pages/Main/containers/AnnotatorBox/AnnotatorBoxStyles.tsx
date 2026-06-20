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
