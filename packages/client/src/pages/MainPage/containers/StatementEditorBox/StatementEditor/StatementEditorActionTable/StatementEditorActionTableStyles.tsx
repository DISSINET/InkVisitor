import styled from "styled-components";

export const StyledEditorActionTableWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.space[4]};
  min-width: 56rem;
`;

interface StyledGrid {
  tempDisabled?: boolean;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: repeat(5, auto);
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[1]};
  max-width: 100%;

  opacity: ${({ tempDisabled }) => (tempDisabled ? 0.2 : 1)};
`;

interface StyledGridColumn {}
export const StyledGridColumn = styled.div<StyledGridColumn>`
  margin: ${({ theme }) => theme.space[1]};
  display: grid;
  align-items: center;
`;

export const StyledExpandedRow = styled.div`
  display: grid;
  align-items: center;
  margin-left: 3rem;
  grid-template-columns: repeat(3, auto) 1fr;
  grid-column-gap: 1rem;
  font-size: 1.4rem;
`;
export const StyledBorderLeft = styled.div`
  border-left: 3px solid ${({ theme }) => theme.color.elementType.action};
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

export const StyledFlexStart = styled.div`
  display: flex;
  align-items: flex-start;
`;
