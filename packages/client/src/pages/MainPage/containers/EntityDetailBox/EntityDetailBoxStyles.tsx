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
  justify-content: center;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

export const StyledTagWrap = styled.div`
  margin-right: ${({ theme }) => theme.space[2]};
  display: inline-flex;
  overflow: hidden;
`;

export const StyledDetailSectionHeader = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.regular};
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
  font-size: ${({ theme }) => theme.fontSize["sm"]};
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
      padding: ${({ theme }) => theme.space[2]};
      vertical-align: top;
      text-align: right;
      float: initial;
    }
    ${StyledDetailContentRowValue} {
      display: table-cell;
      width: 100%;
      padding: ${({ theme }) => theme.space[1]};
    }
  }
`;

export const StyledDetailSectionUsedTable = styled.div`
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
  max-width: 20em;
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
`;

// usedIn section
export const StyledDetailSectionContentUsedIn = styled(
  StyledDetailSectionContent
)``;

export const StyledDetailSectionUsedPageManager = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  display: inline-flex;
  align-items: center;
  button {
    margin: 0 ${({ theme }) => theme.space[2]};
  }
`;

export const StyledDetailSectionUsedTableCell = styled.div<StyledDetailSectionMetaTableCell>`
  display: inline-flex;
  margin-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[2] : theme.space[2]};
  align-items: center;
  padding: 0 5px;
  border-right: ${({ theme, borderless }) =>
    borderless ? "none" : "1px dashed black"};
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
  border-right: ${({ theme, borderless }) =>
    borderless ? "none" : "1px dashed black"};
`;
