import styled from "styled-components";

interface StyledGrid {
  $columns: number;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;
  grid-template-columns: ${({ $columns }) => `repeat(${$columns}, auto)`};
  color: ${({ theme }) => theme.color["black"]};
  padding-right: 1rem;
  /* width: 50%; */
`;
export const StyledGridColumn = styled.div`
  display: grid;
  border-right: 1px solid ${({ theme }) => theme.color["black"]};
  border-bottom: 1px solid ${({ theme }) => theme.color["blue"][300]};
  padding: 0.3rem;
  padding-left: 1rem;
`;
export const StyledGridHeader = styled(StyledGridColumn)`
  background-color: ${({ theme }) => theme.color["blue"][400]};
  border: none;
`;
