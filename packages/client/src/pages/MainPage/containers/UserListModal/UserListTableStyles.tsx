import styled from "styled-components";

export const StyledTable = styled.table`
  border-spacing: 0;
  border-collapse: collapse;
`;
export const StyledTHead = styled.thead`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledTh = styled.th`
  text-align: left;
  font-style: italic;
  font-weight: ${({ theme }) => theme.fontWeight["light"]};
  padding-bottom: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["info"]};
`;

interface StyledTr {
  isOdd?: boolean;
  isSelected?: boolean;
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  td:first-child {
    padding-left: ${({ theme }) => theme.space[2]};
    padding-right: ${({ theme }) => theme.space[2]};
  }
  td:not(:last-child) {
    width: 1%;
  }
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
export const StyledUserEditor = styled.div``;
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
  display: table;
  width: 100%;
  padding-right: ${({ theme }) => theme.space[6]};
  ${StyledUserEditorRow} {
    display: table-row;
    width: 100%;
    ${StyledUserEditorRowLabel} {
      width: 1%;
      white-space: nowrap;
      display: table-cell;
      padding: ${({ theme }) => theme.space[2]};
      vertical-align: top;
      text-align: right;
      float: initial;
    }
    ${StyledUserEditorRowValue} {
      display: table-cell;
      width: 100%;
      padding: ${({ theme }) => theme.space[1]};
    }
  }
`;
