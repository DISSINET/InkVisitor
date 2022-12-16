import styled from "styled-components";

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: ${({ theme }) => theme.space[4]};
  column-gap: ${({ theme }) => theme.space[4]};
  padding-right: ${({ theme }) => theme.space[8]};
`;
export const StyledSemanticsWrapper = styled.div`
  display: flex;
`;
export const StyledLabel = styled.div`
  margin-bottom: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledLabelInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;
export const StyledSectionSeparator = styled.td`
  width: 100%;
  grid-column: span 2;
  border-top: 1px dashed grey;
`;
