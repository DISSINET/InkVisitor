import styled from "styled-components";

export const StyledGrid = styled.div`
  display: grid;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: auto auto auto;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[6]};
`;

export const StyledGridCell = styled.div`
  margin: ${({ theme }) => theme.space[1]};
  display: grid;
`;

// references
interface StyledReferencesList {}
export const StyledReferencesList = styled(StyledGrid)<StyledReferencesList>`
  grid-template-columns: auto auto auto;
  /* width: 50rem; */
`;

interface StyledListHeaderColumn {}
export const StyledListHeaderColumn = styled.div<StyledListHeaderColumn>`
  font-weight: ${({ theme }) => theme.fontWeight.light};
  margin-left: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["info"]};
  text-align: left;
  font-style: italic;
`;

interface StyledReferencesListColumn {}
export const StyledReferencesListColumn = styled(
  StyledGridCell
)<StyledReferencesListColumn>``;

export const StyledTagWrapper = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
