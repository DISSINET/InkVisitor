import styled from "styled-components";

export const StyledTableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  border-spacing: 0;
`;
export const StyledTHead = styled.thead`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledTh = styled.th`
  text-align: left;
  font-style: italic;
  font-weight: ${({ theme }) => theme.fontWeight["light"]};
  padding-bottom: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[3]};
  padding-right: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["info"]};
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
    padding-right: ${({ theme }) => theme.space[2]};
  }
  td:not(:last-child) {
    width: 1%;
  }
  td,
  th {
    padding-left: ${({ theme }) => theme.space[3]};
    padding-right: ${({ theme }) => theme.space[3]};
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

  padding-bottom: ${({ theme }) => theme.space[2]};
  padding-top: ${({ theme }) => theme.space[2]};
`;
export const StyledTerritoryListItem = styled.div`
  padding-right: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  display: inline-block;
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
  display: inline-flex;
  width: 100%;
  padding-right: ${({ theme }) => theme.space[6]};
  input {
    margin: 0 ${({ theme }) => theme.space[3]};
  }
`;
