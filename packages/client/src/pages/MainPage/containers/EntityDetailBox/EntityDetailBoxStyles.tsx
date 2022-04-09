import styled from "styled-components";
import { EntityTag } from "..";

interface StyledDetailWrapper {
  type: string;
}
export const StyledDetailWrapper = styled.div<StyledDetailWrapper>`
  display: flex;
  flex-direction: column;
  align-items: start;
  border-left: 3px solid;
  border-left-color: ${({ theme, type }) => theme.color["entity" + type]};
`;

interface StyledDetailSection {
  firstSection?: boolean;
  lastSection?: boolean;
}

export const StyledDetailSection = styled.div<StyledDetailSection>`
  padding: ${({ theme }) => theme.space[6]};
  border-bottom-width: ${({ theme, lastSection = false }) =>
    lastSection ? theme.borderWidth[0] : theme.borderWidth[1]};
  border-bottom-color: ${({ theme }) => theme.color["gray"][500]};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  border-bottom-style: solid;
  width: 100%;
`;

export const StyledActantPreviewRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  align-items: center;
`;

export const StyledTagWrap = styled.div`
  margin-right: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[4]};
  display: inline-flex;
  overflow: hidden;
`;

export const StyledDetailSectionHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.space["4"]};
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledDetailContentRow = styled.div`
  /* class: row; */
  /* display: flex; */
`;
export const StyledDetailContentRowLabel = styled.div`
  float: left;
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledDetailContentRowValue = styled.div`
  float: right;
`;
export const StyledDetailContentRowValueID = styled.div`
  display: inline-flex;
  font-style: italic;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  align-items: baseline;

  button {
    margin-left: ${({ theme }) => theme.space["2"]};
  }
`;

export const StyledDetailForm = styled.div`
  display: table;
  width: 100%;
  padding-right: ${({ theme }) => theme.space[6]};
  ${StyledDetailContentRow} {
    display: table-row;
    width: 100%;
    ${StyledDetailContentRowLabel} {
      width: 1%;
      white-space: nowrap;
      display: table-cell;
      padding: ${({ theme }) => theme.space[3]};
      vertical-align: top;
      text-align: right;
      float: initial;
    }
    ${StyledDetailContentRowValue} {
      display: table-cell;
      width: 100%;
      padding: ${({ theme }) => theme.space[2]};
    }
  }
`;

export const StyledDetailSectionContentUsedInTitle = styled.div`
  margin-top: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["info"]};
`;

export const StyledDetailSectionUsedTable = styled.div`
  display: grid;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  width: 100%;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-top: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
`;

export const StyledDetailSectionUsedTableRow = styled.div`
  display: grid;
  grid-template-columns: 10% auto 10% 8%;
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
  padding-top: ${({ theme }) => theme.space[2]};
  background: white;
`;

interface StyledDetailHeaderColumn {}
export const StyledDetailHeaderColumn = styled.div<StyledDetailHeaderColumn>`
  font-weight: ${({ theme }) => theme.fontWeight.light};
  margin-left: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  text-align: left;
  font-style: italic;
`;

export const StyledDetailSectionUsedText = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  max-width: 30em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface StyledDetailSectionContent {
  firstSection?: boolean;
}
interface StyledDetailSectionContent {}
export const StyledDetailSectionContent = styled.div<StyledDetailSectionContent>`
  padding-left: ${({ theme, firstSection = false }) =>
    firstSection ? "" : theme.space[4]};
  padding-top: ${({ theme }) => theme.space[4]};
`;

// usedIn section
export const StyledDetailSectionContentUsedIn = styled(
  StyledDetailSectionContent
)``;

export const StyledDetailSectionUsedPageManager = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  display: inline-flex;
  align-items: center;
  padding-bottom: ${({ theme }) => theme.space[3]};
  button {
    margin: 0 ${({ theme }) => theme.space[1]};
  }
`;

export const StyledDetailSectionUsedTableCell = styled.div<StyledDetailSectionMetaTableCell>`
  display: inline-flex;
  margin-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[2] : theme.space[2]};
  align-items: center;
  padding: 0 5px;
`;

export const StyledDetailSectionMetaTable = styled.div`
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

interface StyledDetailSectionMetaTableButtonGroup {
  leftMargin?: boolean;
}
export const StyledDetailSectionMetaTableButtonGroup = styled.div<StyledDetailSectionMetaTableButtonGroup>`
  margin-left: ${({ theme, leftMargin = true }) =>
    leftMargin ? theme.space[3] : theme.space[0]};
  vertical-align: middle;
  display: inline-flex;
`;

interface StyledDetailSectionMetaTableCell {
  padded?: boolean;
  lastSecondLevel?: boolean;
  borderless?: boolean;
}
export const StyledDetailSectionMetaTableCell = styled.div<StyledDetailSectionMetaTableCell>`
  display: inline-flex;
  margin-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[2] : theme.space[2]};
  align-items: center;
  padding: 0 5px;
`;
