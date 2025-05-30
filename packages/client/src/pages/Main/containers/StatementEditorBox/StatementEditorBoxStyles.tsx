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

interface StyledSectionLabel {}
export const StyledSectionLabel = styled.div<StyledSectionLabel>`
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  margin-bottom: ${({ theme }) => theme.space[2]};
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

export const StyledEditorPreBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  padding-left: ${({ theme }) => theme.space[6]};
  padding-right: ${({ theme }) => theme.space[6]};
`;

interface StyledEditorPreSection {
  $inline?: boolean;
}
export const StyledEditorPreSection = styled.div<StyledEditorPreSection>`
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  ${({ $inline }) => $inline && `display: flex;`}
  ${({ $inline }) => $inline && `flex-direction: row;`}
  ${({ $inline }) => $inline && `align-items: center;`}
  ${({ theme, $inline }) => $inline && `gap: ${theme.space[2]};`}
`;

interface StyledEditorSection {
  $lastSection?: boolean;
  $metaSection?: boolean;
  $marginRight?: boolean;
}
export const StyledEditorSection = styled.div<StyledEditorSection>`
  padding: ${({ theme }) => theme.space[6]};
  padding-right: ${({ $metaSection }) => ($metaSection ? 0 : "")};
  padding-right: ${({ $marginRight }) => ($marginRight ? "0.5rem" : "")};
  margin: 0.2rem 0 0 2rem;
  border-bottom-width: ${({ theme }) => theme.borderWidth[1]};
  border-bottom-color: ${({ theme }) => theme.color["gray"][500]};
  border-bottom-style: solid;
  background-color: ${({ theme }) => theme.color["gray"][200]};
  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

export const StyledEditorSectionText = styled.div`
  box-shadow: ${({ theme }) => theme.boxShadow["subtle"]};
  border-left: ${({ theme }) => "3px solid " + theme.color["success"]};
  background-color: ${({ theme }) => theme.color["white"]};
  padding: ${({ theme }) => theme.space[3]};
  margin-top: ${({ theme }) => theme.space[3]};
`;

export const StyledDetailWarnings = styled.div`
  display: grid;
  grid-gap: ${({ theme }) => theme.space["1"]};
  grid-auto-flow: row;
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
  align-items: center;
  display: flex;
  white-space: nowrap;
`;

interface StyledEditorSectionContent {}
export const StyledEditorSectionContent = styled.div<StyledEditorSectionContent>`
  padding-left: ${({ theme }) => theme.space[6]};
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
interface StyledTagsList {
  $paddingBottom?: boolean;
}
export const StyledTagsList = styled.div<StyledTagsList>`
  display: block;
  padding-bottom: ${({ theme, $paddingBottom }) =>
    $paddingBottom ? theme.space[6] : ""};
`;

interface StyledTagsListItem {}
export const StyledTagsListItem = styled.div<StyledTagsListItem>`
  padding-right: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
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
  max-width: 100%;
  display: inline-flex;
  overflow: hidden;
  align-items: center;
  margin-right: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

export const StyledEditorHeaderInputWrap = styled.div`
  display: flex;
  flex-shrink: 1;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

export const StyledEditorContentRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  box-sizing: border-box;
`;

export const StyledEditorContentLabel = styled(StyledSectionLabel)`
  margin-bottom: 0;
  white-space: nowrap;
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.space[3]};
`;

export const StyledEditorContentRowValue = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
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

export const StyledMissingTerritory = styled.p`
  color: ${({ theme }) => theme.color["warning"]};
  margin-left: 0.5rem;
  margin-bottom: 0.1rem;
`;

// Anchor Section
export const StyledEditorAnchorSectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  width: 100%;
`;

interface StyledEditorAnchorSectionAnchor {}
export const StyledEditorAnchorSectionAnchor = styled.div<StyledEditorAnchorSectionAnchor>`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.space[3]};
`;

interface StyledAnchorText {}
export const StyledAnchorText = styled.div<StyledAnchorText>`
  color: ${({ theme }) => theme.color["gray"][800]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  font-family: mono;
`;

interface StyledAnchorMeta {}
export const StyledAnchorMeta = styled.div<StyledAnchorMeta>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["gray"][600]};
`;

interface StyledAnchorTag {}
export const StyledAnchorTag = styled.span<StyledAnchorTag>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color["gray"][100]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

interface StyledAnchorEmptyState {}
export const StyledAnchorEmptyState = styled.div<StyledAnchorEmptyState>`
  padding: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-style: italic;
  text-align: center;
`;
