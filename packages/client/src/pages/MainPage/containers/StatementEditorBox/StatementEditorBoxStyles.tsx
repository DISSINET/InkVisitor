import styled from "styled-components";

const StyledGrid = styled.div`
  display: grid;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: auto auto auto;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[6]};
`;

const StyledGridCell = styled.div`
  margin: ${({ theme }) => theme.space[1]};
`;

// Editor Section
interface StyledEditorSection {
  firstSection?: boolean;
  lastSection?: boolean;
}
export const StyledEditorSection = styled.div<StyledEditorSection>`
  padding: ${({ theme }) => theme.space[6]};
  border-bottom-width: ${({ theme, lastSection = false }) =>
    lastSection ? theme.borderWidth[0] : theme.borderWidth[1]};
  border-bottom-color: ${({ theme }) => theme.color["gray"][500]};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  border-bottom-style: solid;
`;

interface StyledEditorSectionHeader {}
export const StyledEditorSectionHeader = styled.div<StyledEditorSectionHeader>`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  font-size: ${({ theme }) => theme.fontSize.xl};
  margin-bottom: ${({ theme }) => theme.space["4"]};
  color: ${({ theme }) => theme.color["primary"]};
`;

interface StyledEditorSectionContent {}
export const StyledEditorSectionContent = styled.div<StyledEditorSectionContent>`
  padding-left: ${({ theme }) => theme.space[0]};
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
  margin-left: ${({ theme }) => theme.space[6]};
  padding-bottom: ${({ theme }) => theme.space[10]};
`;

interface StyledPropButtonGroup {
  leftMargin?: boolean;
  border?: boolean;
  round?: boolean;
}
export const StyledPropButtonGroup = styled.div<StyledPropButtonGroup>`
  margin-left: ${({ theme, leftMargin = true }) =>
    leftMargin ? theme.space[3] : theme.space[0]};
  vertical-align: middle;
  display: inline-flex;
  border-radius: ${({ round }) => (round ? "8px" : "0")};
  border: ${({ border }) => (border ? "1px" : 0)} solid
    ${({ theme }) => theme.color["gray"][600]};
`;

interface StyledPropLineColumn {
  padded?: boolean;
  lastSecondLevel?: boolean;
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
  border-right: 1px dashed black;
`;

// references
interface StyledReferencesList {}
export const StyledReferencesList = styled(StyledGrid)<StyledReferencesList>`
  grid-template-columns: auto auto auto auto;
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
  display: inline-block;
`;

export const StyledEditorActantTableWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.space[4]};
`;
