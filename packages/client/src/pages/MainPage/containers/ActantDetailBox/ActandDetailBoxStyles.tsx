import styled from "styled-components";

export const StyledContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
`;

interface StyledSection {
  firstSection?: boolean;
  lastSection?: boolean;
}

export const StyledSection = styled.div<StyledSection>`
  padding-top: ${({ theme, firstSection = false }) =>
    firstSection ? 0 : theme.space[4]};
  padding-bottom: ${({ theme }) => theme.space[6]};
  border-bottom-width: ${({ theme, lastSection = false }) =>
    lastSection ? theme.borderWidth[0] : theme.borderWidth[2]};
  border-bottom-color: ${({ theme }) => theme.color["gray"][600]};
  border-bottom-style: solid;
  width: 100%;
`;

export const StyledSectionHeader = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  font-size: ${({ theme }) => theme.fontSize.xl};
  margin-bottom: ${({ theme }) => theme.space["4"]};
  color: ${({ theme }) => theme.color["gray"][600]};
`;

export const StyledContentRow = styled.div`
  class: row;
  display: flex;
`;
export const StyledContentRowLabel = styled.div`
  float: left;
`;
export const StyledContentRowValue = styled.div`
  float: right;
`;

export const StyledForm = styled.div`
  display: table;
  ${StyledContentRow} {
    display: table-row;
    width: 100%;
    ${StyledContentRowLabel} {
      display: table-cell;
      padding: ${({ theme }) => theme.space["1"]};
      padding-right: 0.5rem;
      vertical-align: middle;
      text-align: right;
      float: initial;
    }
    ${StyledContentRowValue} {
      display: table-cell;
      padding: ${({ theme }) => theme.space["1"]};
    }
  }
`;

export const StyledSectionUsedTable = styled.div`
  display: grid;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: auto auto auto auto;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-top: ${({ theme }) => theme.space[6]};
  padding-bottom: ${({ theme }) => theme.space[6]};
`;

interface StyledHeaderColumn {}
export const StyledHeaderColumn = styled.div<StyledHeaderColumn>`
  font-weight: ${({ theme }) => theme.fontWeight.light};
  margin-left: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  text-align: left;
  font-style: italic;
`;

export const StyledSectionUsedText = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  max-width: 20em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledSectionUsedPageManager = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  display: inline-flex;
  align-items: center;
  button {
    margin: 0 ${({ theme }) => theme.space[2]};
  }
`;

export const StyledSectionUsedTableCell = styled.div<StyledSectionMetaTableCell>`
  display: inline-flex;
  margin-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[2] : theme.space[2]};
  align-items: center;
  padding: 0 5px;
  border-right: ${({ theme, borderless }) =>
    borderless ? "none" : "1px dashed black"};
`;

export const StyledSectionMetaTable = styled.div`
  display: grid;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: auto auto auto auto auto;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-top: ${({ theme }) => theme.space[6]};
  padding-bottom: ${({ theme }) => theme.space[6]};
`;

interface StyledSectionMetaTableButtonGroup {
  leftMargin?: boolean;
}
export const StyledSectionMetaTableButtonGroup = styled.div<StyledSectionMetaTableButtonGroup>`
  margin-left: ${({ theme, leftMargin = true }) =>
    leftMargin ? theme.space[3] : theme.space[0]};
  vertical-align: middle;
  display: inline-flex;
`;

interface StyledSectionMetaTableCell {
  padded?: boolean;
  lastSecondLevel?: boolean;
  borderless?: boolean;
}
export const StyledSectionMetaTableCell = styled.div<StyledSectionMetaTableCell>`
  display: inline-flex;
  margin-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[2] : theme.space[2]};
  align-items: center;
  padding: 0 5px;
  border-right: ${({ theme, borderless }) =>
    borderless ? "none" : "1px dashed black"};
`;
