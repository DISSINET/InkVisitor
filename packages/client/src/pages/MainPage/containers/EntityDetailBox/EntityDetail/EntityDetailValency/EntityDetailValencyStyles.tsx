import styled from "styled-components";

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: ${({ theme }) => theme.space[4]};
  column-gap: ${({ theme }) => theme.space[4]};
  padding-right: ${({ theme }) => theme.space[8]};
`;

export const StyledSectionSeparator = styled.div`
  width: 100%;
  grid-column: span 2;
  border-top: 1px dashed grey;
`;
