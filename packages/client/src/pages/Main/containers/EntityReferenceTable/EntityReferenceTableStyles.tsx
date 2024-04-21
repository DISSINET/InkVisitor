import styled from "styled-components";

// references
interface StyledReferencesList {}
export const StyledReferencesList = styled.div<StyledReferencesList>`
  display: grid;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: auto auto auto auto 1fr;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[6]};
  max-width: 100%;
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

export const StyledReferencesListColumn = styled.div`
  margin: ${({ theme }) => theme.space[1]};
  display: grid;
  align-items: center;
`;

export const StyledReferencesListButtons = styled.div`
  button {
    display: inline-flex;
    margin-right: ${({ theme }) => theme.space[2]};
  }
`;

export const StyledTagWrapper = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
export const StyledReferenceValuePartLabel = styled.div`
  font-style: italic;
  display: inline;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  margin-right: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.color.black};
`;

export const StyledTable = styled.table`
  border-spacing: 0;
  border-collapse: collapse;
`;
interface StyledTr {
  opacity: number;
}
export const StyledTr = styled.tr<StyledTr>`
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  td:first-child {
    padding-left: ${({ theme }) => theme.space[1]};
    padding-right: ${({ theme }) => theme.space[2]};
  }
  td:not(:last-child):not(:first-child) {
    /* width: 1%; */
    min-width: 10rem;
  }
`;
export const StyledTd = styled.td`
  padding-top: ${({ theme }) => `${theme.space[1]}`};
  padding-right: ${({ theme }) => `${theme.space[2]}`};
  padding-bottom: ${({ theme }) => `${theme.space[1]}`};
  padding-left: 0;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledGrid = styled.div`
  display: grid;
  align-items: center;
`;
