import styled from "styled-components";

export const StyledTableWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  overflow-x: auto;
  overflow-y: auto;
`;

export const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  border-spacing: 0;
  border: 1px solid transparent;
`;
export const StyledTHead = styled.thead`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][400]};
  background-color: ${({ theme }) => theme.color["gray"][100]};
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledTh = styled.th`
  text-align: left;
  font-style: italic;
  font-weight: ${({ theme }) => theme.fontWeight["light"]};
  padding-bottom: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["info"]};
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[4]}`};
`;

interface StyledTr {
  isOdd?: boolean;
  isSelected?: boolean;
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["invertedBg"]["info"] : theme.color["white"]};
  color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["primary"] : theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  padding: ${({ theme }) => theme.space[1]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};

  td:first-child {
    padding-left: ${({ theme }) => theme.space[2]};
    padding-right: ${({ theme }) => theme.space[2]};π
  }
  td:not(:last-child) {
    /* width: 1%; */
    padding-right: ${({ theme }) => theme.space[8]};
  }
  td,
  th {
    padding-left: ${({ theme }) => theme.space[3]};
    padding-right: ${({ theme }) => theme.space[3]};
  }
  :hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

export const StyledTd = styled.td`
  padding-top: ${({ theme }) => `${theme.space[1]}`};
  padding-right: ${({ theme }) => `${theme.space[2]}`};
  padding-bottom: ${({ theme }) => `${theme.space[1]}`};
  padding-left: 0;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;

export const StyledTerritoryColumn = styled.div`
  display: block;
`;

export const StyledTerritoryColumnAllLabel = styled.div``;

export const StyledTerritoryList = styled.div`
  display: block;

  padding-top: ${({ theme }) => theme.space[2]};
`;
export const StyledTerritoryListItem = styled.div`
  padding-right: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  display: inline-block;
`;
export const StyledTerritoryListItemMissing = styled.div`
  padding: ${({ theme }) => theme.space[1]};
  display: inline-flex;
  align-items: center;
  background-color: ${({ theme }) => theme.color.danger};
  color: ${({ theme }) => theme.color.white};
  font-size: ${({ theme }) => theme.fontSize.xxs};
`;

export const StyledUserNameColumn = styled.div`
  display: inline-flex;
`;
export const StyledUserNameColumnIcon = styled.div`
  font-size: 1.5em;
  margin: auto;
  margin-right: 0.5em;
`;
export const StyledUserNameColumnText = styled.div`
  * {
    display: block;
  }
`;
export const StyledUserEditor = styled.div`
  columns: auto auto;
`;

export const StyledUserEditorSection = styled.div``;

export const StyledUserEditorTitle = styled.div``;
export const StyledUserEditorBody = styled.div``;
export const StyledUserEditorFoot = styled.div``;

export const StyledUserEditorRow = styled.div`
  /* class: row; */
  /* display: flex; */
`;
export const StyledUserEditorRowLabel = styled.div`
  float: left;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledUserEditorRowValue = styled.div`
  float: right;
`;

export const StyledUserEditorForm = styled.div`
  display: flex;
  padding: 1rem;

  input {
    margin-right: ${({ theme }) => theme.space[3]};
  }
`;

export const StyledUtils = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.color["blue"][50]};
  width: 100%;
`;
