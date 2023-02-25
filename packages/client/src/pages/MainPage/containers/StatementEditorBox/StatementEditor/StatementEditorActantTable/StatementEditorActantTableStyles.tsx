import styled from "styled-components";

interface StyledRow {
  marginBottom?: boolean;
}
export const StyledRow = styled.div<StyledRow>`
  margin-bottom: ${({ marginBottom }) => (marginBottom ? "1rem" : "")};
`;
interface StyledGrid {
  tempDisabled?: boolean;
  hasOrder?: boolean;
  hasActant?: boolean;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;

  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: ${({ theme, hasOrder, hasActant }) =>
    `${hasOrder ? theme.space[8] : theme.space[2]} minmax(${
      hasActant ? "7rem" : "14.5rem"
    }, auto) auto auto`};
  width: fit-content;
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

export const StyledTagWrapper = styled.div`
  display: inline-flex;
  overflow: hidden;
`;

export const StyledMarkerWrap = styled.div`
  margin-left: ${({ theme }) => `${theme.space[1]}`};
  color: ${({ theme }) => theme.color["success"]};
`;

export const StyledCI = styled.div`
  margin-left: 2.5rem;
  margin-right: ${({ theme }) => theme.space[1]};
`;
export const StyledCIHeading = styled.p`
  font-weight: ${({ theme }) => theme.fontWeight.light};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["success"]};
  text-align: left;
  font-style: italic;
  padding-left: ${({ theme }) => theme.space[2]};
`;
export const StyledCIGrid = styled.div`
  margin-bottom: 0.5rem;
  display: grid;
  grid-template-columns: auto auto;
  width: fit-content;
  max-width: 100%;
  align-items: center;
`;
