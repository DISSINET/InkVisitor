import styled from "styled-components";

interface StyledActantHeaderRow {
  type: string;
}
export const StyledActantHeaderRow = styled.div<StyledActantHeaderRow>`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  padding-bottom: ${({ theme }) => theme.space[4]};
  padding-right: ${({ theme }) => theme.space[6]};
  padding-left: ${({ theme }) => theme.space[8]};
  background: ${({ theme }) => theme.color["gray"][200]};
  border-left: 3px solid;
  border-left-color: ${({ theme, type }) => theme.color["entity" + type]};
`;

interface StyledDetailWrapper {
  type: string;
}
export const StyledDetailWrapper = styled.div<StyledDetailWrapper>`
  display: flex;
  flex-direction: column;
  overflow: auto;
  align-items: start;
  border-left: 3px solid;
  border-left-color: ${({ theme, type }) => theme.color["entity" + type]};
`;

interface StyledDetailSection {
  firstSection?: boolean;
  lastSection?: boolean;
  metaSection?: boolean;
}
export const StyledDetailSection = styled.div<StyledDetailSection>`
  padding: ${({ theme }) => theme.space[6]};
  padding-right: ${({ metaSection }) => (metaSection ? 0 : "")};
  padding-top: ${({ firstSection }) => (firstSection ? 0 : "")};
  border-bottom-width: ${({ theme, lastSection = false }) =>
    lastSection ? theme.borderWidth[0] : theme.borderWidth[1]};
  border-bottom-color: ${({ theme }) => theme.color["gray"][500]};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  border-bottom-style: solid;
  width: 100%;
`;

export const StyledTagWrap = styled.div`
  margin-right: ${({ theme }) => theme.space[2]};
  margin-top: ${({ theme }) => theme.space[4]};
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
`;

export const StyledDetailSectionHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.space["4"]};
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledDetailContentRow = styled.div``;

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

export const StyledFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow: visible;
`;

export const StyledDetailForm = styled.div`
  display: table;
  width: 100%;
  overflow-y: auto;
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

interface StyledDetailHeaderColumn {}
export const StyledDetailHeaderColumn = styled.div<StyledDetailHeaderColumn>`
  font-weight: ${({ theme }) => theme.fontWeight.light};
  margin-left: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  text-align: left;
  font-style: italic;
`;

interface StyledDetailSectionContent {
  firstSection?: boolean;
}
interface StyledDetailSectionContent {
  firstSection?: boolean;
}
export const StyledDetailSectionContent = styled.div<StyledDetailSectionContent>`
  padding-left: ${({ theme, firstSection = false }) =>
    firstSection ? "" : theme.space[4]};
  padding-top: ${({ theme, firstSection }) =>
    firstSection ? 0 : theme.space[4]};
`;

// usedIn section
export const StyledDetailSectionContentUsedIn = styled(
  StyledDetailSectionContent
)``;

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

export const StyledDetailSectionEntityList = styled.div`
  > div {
    padding: 0.25rem;
  }
`;
