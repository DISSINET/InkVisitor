import styled from "styled-components";

const StyledGrid = styled.div`
  display: grid;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: auto auto auto auto auto;
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
  padding-top: ${({ theme, firstSection = false }) =>
    firstSection ? 0 : theme.space[4]};
  padding-bottom: ${({ theme }) => theme.space[6]};
  border-bottom-width: ${({ theme, lastSection = false }) =>
    lastSection ? theme.borderWidth[0] : theme.borderWidth[2]};
  border-bottom-color: ${({ theme }) => theme.color["gray"][600]};
  border-bottom-style: solid;
`;

interface StyledEditorSectionHeader {}
export const StyledEditorSectionHeader = styled.div<StyledEditorSectionHeader>`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  font-size: ${({ theme }) => theme.fontSize.xl};
  margin-bottom: ${({ theme }) => theme.space["4"]};
  color: ${({ theme }) => theme.color["gray"][600]};
  text-align: center;
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
  text-align: center;
  font-style: italic;
`;

// Actants
interface StyledActantList {}
export const StyledActantList = styled(StyledGrid)<StyledActantList>``;

interface StyledActantListItem {
  opacity?: number;
}
export const StyledActantListItem = styled(
  StyledGridCell
)<StyledActantListItem>`
  opacity: ${({ opacity }) => opacity};
`;

// Props section
interface StyledPropsActantHeader {}
export const StyledPropsActantHeader = styled.div<StyledPropsActantHeader>`
  display: inline-flex;
  padding-top: ${({ theme }) => theme.space[1]};
  padding-bottom: ${({ theme }) => theme.space[2]};
`;

interface StyledPropsActantList {}
export const StyledPropsActantList = styled(
  StyledGrid
)<StyledPropsActantList>``;

interface StyledPropButtonGroup {
  leftMargin?: boolean;
}
export const StyledPropButtonGroup = styled.div<StyledPropButtonGroup>`
  margin-left: ${({ theme, leftMargin = true }) =>
    leftMargin ? theme.space[3] : theme.space[0]};
  display: inline-flex;
`;

interface StyledPropLineColumn {
  padded?: boolean;
  lastSecondLevel?: boolean;
}
export const StyledPropLineColumn = styled(
  StyledGridCell
)<StyledPropLineColumn>`
  display: inline-flex;
  padding-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[4] : theme.space[0]};
  align-items: center;
  padding-left: ${({ theme, padded }) =>
    padded ? theme.space[6] : theme.space[0]};
`;

// references
interface StyledReferencesList {}
export const StyledReferencesList = styled(StyledGrid)<StyledReferencesList>``;

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
