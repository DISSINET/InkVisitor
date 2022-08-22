import styled from "styled-components";

interface StyledGrid {
  tempDisabled?: boolean;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;

  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: 2rem auto auto auto;
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
  margin-left: 2rem;
`;
export const StyledCIHeading = styled.p`
  font-weight: ${({ theme }) => theme.fontWeight.light};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["info"]};
  text-align: left;
`;
export const StyledCIGrid = styled.div`
  margin-bottom: 0.5rem;
  display: grid;
  grid-template-columns: auto 4rem;
  width: fit-content;
  max-width: 100%;
`;
