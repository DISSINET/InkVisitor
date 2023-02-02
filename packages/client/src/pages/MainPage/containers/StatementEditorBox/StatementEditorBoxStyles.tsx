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

// Editor Section
interface StyledEditorEmptyState {}
export const StyledEditorEmptyState = styled.div<StyledEditorEmptyState>`
  padding: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  display: flex;
  align-self: center;
  align-items: center;
  text-align: center;
`;
interface StyledEditorPreSection {}
export const StyledEditorPreSection = styled.div<StyledEditorPreSection>`
  padding: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
interface StyledEditorSection {
  firstSection?: boolean;
  lastSection?: boolean;
  metaSection?: boolean;
  marginRight?: boolean;
}
export const StyledEditorSection = styled.div<StyledEditorSection>`
  position: relative;
  padding: ${({ theme }) => theme.space[6]};
  padding-right: ${({ metaSection }) => (metaSection ? 0 : "")};
  border-bottom-width: ${({ theme }) => theme.borderWidth[1]};
  border-bottom-color: ${({ theme }) => theme.color["gray"][500]};
  background-color: ${({ theme }) => theme.color["white"]};
  box-shadow: ${({ theme, firstSection = false }) =>
    firstSection ? theme.boxShadow["subtle"] : ""};
  border-left: ${({ theme, firstSection = false }) =>
    firstSection ? "3px solid " + theme.color["success"] : ""};
  background-color: ${({ theme, firstSection = false }) =>
    firstSection ? theme.color["white"] : theme.color["gray"][200]};
  border-bottom-style: solid;
  margin: ${({ theme, firstSection = false }) =>
    firstSection ? "0 0 0 0.7rem" : "0.2rem 0 0 2rem"};
  margin-right: ${({ marginRight }) => (marginRight ? "0.5rem" : "")};
  :hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

interface StyledEditorSectionHeader {}
export const StyledEditorSectionHeader = styled.div<StyledEditorSectionHeader>`
  display: flex;
  align-items: center;
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  font-size: ${({ theme }) => theme.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.space["4"]};
  color: ${({ theme }) => theme.color["primary"]};
`;
export const StyledEditorSectionHeading = styled.div`
  margin-right: ${({ theme }) => theme.space[2]};
`;
interface StyledEditorSectionContent {
  firstSection?: boolean;
}
interface StyledEditorSectionContent {}
export const StyledEditorSectionContent = styled.div<StyledEditorSectionContent>`
  padding-left: ${({ theme, firstSection = false }) =>
    firstSection ? "" : theme.space[6]};
`;

// Grids
interface StyledListHeaderColumn {}
export const StyledListHeaderColumn = styled.div<StyledListHeaderColumn>`
  font-weight: ${({ theme }) => theme.fontWeight.light};
  margin-left: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["info"]};
  text-align: left;
  font-style: italic;
`;

// Props section
interface StyledPropsActantHeader {}
export const StyledPropsActantHeader = styled.div<StyledPropsActantHeader>`
  display: block;
  padding-top: ${({ theme }) => theme.space[1]};
  padding-bottom: ${({ theme }) => theme.space[2]};
`;

interface StyledPropsActantList {}
export const StyledPropsActantList = styled(StyledGrid)<StyledPropsActantList>`
  padding-left: ${({ theme }) => theme.space[10]};
  padding-bottom: ${({ theme }) => theme.space[10]};
  width: 100%;
`;

// tags
interface StyledTagsList {}
export const StyledTagsList = styled.div<StyledTagsList>`
  display: block;
  padding-bottom: ${({ theme }) => theme.space[6]};
`;

interface StyledTagsListItem {}
export const StyledTagsListItem = styled.div<StyledTagsListItem>`
  padding-right: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
`;

export const StyledEditorActantTableWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.space[4]};
`;
export const StyledTagWrapper = styled.div`
  display: inline-flex;
  overflow: hidden;
`;

export const StyledBreadcrumbWrap = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  min-height: 2rem;
  position: relative;
  margin-top: ${({ theme }) => theme.space[2]};
`;

export const StyledEditorStatementInfo = styled.div`
  display: block;
  flex-wrap: wrap;
  align-items: center;
  overflow: hidden;
  max-width: 100%;
`;

export const StyledHeaderTagWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
  margin-right: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
export const StyledEditorStatementInfoLabel = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.space[1]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
export const StyledEditorHeaderInputWrap = styled.div`
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

export const StyledEditorContentRow = styled.div``;
export const StyledEditorContentRowLabel = styled.div`
  float: left;
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledEditorContentRowValue = styled.div`
  float: right;
`;
export const StyledEditorContentRowValueID = styled.div`
  display: inline-flex;
  font-style: italic;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  align-items: baseline;

  button {
    margin-left: ${({ theme }) => theme.space["2"]};
  }
`;

export const StyledEditorTemplateSection = styled.div`
  display: table;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.space[1]};
  ${StyledEditorContentRow} {
    display: table-row;
    width: 100%;
    ${StyledEditorContentRowLabel} {
      width: 1%;
      white-space: nowrap;
      display: table-cell;
      padding: ${({ theme }) => theme.space[3]};
      vertical-align: top;
      text-align: right;
      float: initial;
    }
    ${StyledEditorContentRowValue} {
      display: table-cell;
      width: 100%;
      padding: ${({ theme }) => theme.space[2]};
    }
  }
`;

export const StyledReferencesButtons = styled.div`
  margin-bottom: ${({ theme }) => theme.space[4]};
`;
