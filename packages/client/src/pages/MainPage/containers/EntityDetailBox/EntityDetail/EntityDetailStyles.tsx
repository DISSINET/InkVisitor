import styled from "styled-components";

interface StyledDetailWrapper {}
export const StyledDetailWrapper = styled.div<StyledDetailWrapper>`
  display: flex;
  flex-direction: column;
  overflow: auto;
  align-items: start;
`;

interface StyledDetailSection {
  firstSection?: boolean;
  lastSection?: boolean;
  metaSection?: boolean;
}
export const StyledDetailSection = styled.div<StyledDetailSection>`
  padding: ${({ theme }) => theme.space[6]};
  /* margin-left: ${({ theme }) => theme.space[8]}; */
  padding-right: ${({ metaSection }) => (metaSection ? 0 : "")};
  padding-top: ${({ firstSection }) => (firstSection ? 0 : "")};
  border-bottom-width: ${({ theme, lastSection = false }) =>
    lastSection ? theme.borderWidth[0] : theme.borderWidth[1]};
  border-bottom-color: ${({ theme }) => theme.color["gray"][500]};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  border-bottom-style: solid;
  width: 100%;
`;

interface StyledDetailSectionHeader {
  secondary?: boolean;
}
export const StyledDetailSectionHeader = styled.div<StyledDetailSectionHeader>`
  font-size: ${({ theme, secondary }) =>
    secondary ? theme.fontSize["base"] : theme.fontSize.lg};
  margin-top: ${({ theme, secondary }) => (secondary ? theme.space[12] : "")};
  margin-bottom: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.color["primary"]};
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

export const StyledUsedAsHeading = styled.div`
  display: flex;
  margin-right: auto;
`;
export const StyledUsedAsTitle = styled.div`
  padding-left: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["info"]};
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
export const StyledRelativePosition = styled.div`
  position: relative;
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

export const StyledTagWrap = styled.div`
  display: grid;
  overflow: hidden;
  max-width: 100%;
`;
