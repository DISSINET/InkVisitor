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
interface StyledEditorPreSection {}
export const StyledEditorPreSection = styled.div<StyledEditorPreSection>`
  padding: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
interface StyledEditorSection {
  firstSection?: boolean;
  lastSection?: boolean;
}
export const StyledEditorSection = styled.div<StyledEditorSection>`
  position: relative;
  padding: ${({ theme }) => theme.space[6]};
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
  :hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

interface StyledEditorSectionHeader {}
export const StyledEditorSectionHeader = styled.div<StyledEditorSectionHeader>`
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  font-size: ${({ theme }) => theme.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.space["4"]};
  color: ${({ theme }) => theme.color["primary"]};
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

interface StyledPropButtonGroup {
  leftMargin?: boolean;
  rightMargin?: boolean;
  border?: boolean;
  round?: boolean;
  width?: number;
}
export const StyledPropButtonGroup = styled.div<StyledPropButtonGroup>`
  margin-left: ${({ theme, leftMargin }) =>
    leftMargin ? theme.space[3] : theme.space[0]};
  margin-right: ${({ theme, rightMargin }) =>
    rightMargin ? theme.space[3] : theme.space[0]};
  vertical-align: middle;
  display: inline-flex;
  border-radius: ${({ round }) => (round ? "8px" : "0")};
  border: ${({ border }) => (border ? "1px" : 0)} solid
    ${({ theme }) => theme.color["gray"][600]};

  button:disabled,
  button[disabled] {
    //background-color: ${({ theme }) => theme.color["gray"][1000]};
  }
`;

interface StyledPropLineColumn {
  padded?: boolean;
  lastSecondLevel?: boolean;
  isTag?: boolean;
}
export const StyledPropLineColumn = styled(
  StyledGridCell
)<StyledPropLineColumn>`
  display: inline-flex;
  margin-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[4] : theme.space[0]};
  align-items: center;
  padding-left: ${({ theme, padded }) =>
    padded ? theme.space[6] : theme.space[0]};
  padding-right: 5px;
  overflow: ${({ isTag }) => (isTag ? "hidden" : "visible")};
`;

// references
interface StyledReferencesList {}
export const StyledReferencesList = styled(StyledGrid)<StyledReferencesList>`
  grid-template-columns: auto auto auto auto;
  /* width: 50rem; */
`;

interface StyledReferencesListColumn {}
export const StyledReferencesListColumn = styled(
  StyledGridCell
)<StyledReferencesListColumn>``;

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
`;

export const StyledSubRow = styled.div`
  display: table-row;
  width: 100%;
  padding: ${({ theme }) => theme.space[2]};
  border-left-color: ${({ theme }) => theme.color["gray"][800]};
  margin-left: ${({ theme }) => `${theme.space[10]}`};
  margin-bottom: ${({ theme }) => `${theme.space[2]}`};
`;
