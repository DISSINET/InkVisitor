import styled from "styled-components";

export const StyledTabsContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

export const StyledStatsTabGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

export const StyledStatsTab = styled.button<{ $isSelected: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xs};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  background-color: ${({ theme, $isSelected }) =>
    $isSelected ? "transparent" : theme.color["gray"][100]};
  color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.color["black"] : theme.color["gray"][700]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-bottom: ${({ theme, $isSelected }) =>
    $isSelected ? "none" : `1px solid ${theme.color["gray"][500]}`};
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  margin-right: 1px;
  width: 100%;
  max-width: 20rem;

  &:hover {
    color: ${({ theme }) => theme.color["black"]};
  }
`;

export const StyledStatsContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0.5rem 1rem;
  padding-bottom: 0;
`;
export const StyledDocumentsLayout = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 1rem;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;
export const StyledEntitiesLayout = styled.div`
  display: grid;
  grid-template-rows: auto auto 1fr 1fr;
  gap: 1rem;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

export const StyledFieldGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  column-gap: 2.5rem;
  row-gap: 0.5rem;
  position: relative;

  @media (max-width: 1200px) {
    column-gap: 2.5rem;
  }
`;

export const StyledField = styled.div`
  display: grid;
  gap: 0.3rem;
  grid-template-columns: auto;
  grid-template-rows: auto minmax(2.5rem, auto);
  justify-content: start;
  align-items: center;
`;

export const StyledFieldLabel = styled.div`
  display: flex;
  color: ${({ theme }) => theme.color["primary"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  white-space: nowrap;
`;
export const StyledFieldInput = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const StyledDocumentResourceWrap = styled.div`
  min-width: 0;
  max-width: 17.4rem;
  flex: 1;
`;
export const StyledEventTypeGroups = styled.div`
  display: flex;
  align-items: stretch;
  gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
`;
export const StyledEventTypeGroup = styled.fieldset`
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.15rem 0.25rem 0.25rem;
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-md"]};
  min-width: 0;
`;
interface StyledEventTypeGroupLegend {
  $active: boolean;
}
export const StyledEventTypeGroupLegend = styled.legend<StyledEventTypeGroupLegend>`
  margin: 0 auto;
  padding: 0 0.4rem;
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme, $active }) => ($active ? theme.color["primary"] : theme.color["gray"][500])};
  cursor: pointer;
  user-select: none;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.color["primary"]};
    text-decoration: underline;
  }
`;
interface StyledEventTypeSubLabel {
  $active: boolean;
}
export const StyledEventTypeSubLabel = styled.span<StyledEventTypeSubLabel>`
  margin: 0 0.1rem 0 0.3rem;
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme, $active }) => ($active ? theme.color["primary"] : theme.color["gray"][500])};
  white-space: nowrap;
  cursor: pointer;
  user-select: none;

  &:first-of-type {
    margin-left: 0.1rem;
  }

  &:hover {
    color: ${({ theme }) => theme.color["primary"]};
    text-decoration: underline;
  }
`;
export const StyledDateInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
`;

export const StyledResultsChart = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  /* Allow shrinking inside CSS Grid */
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

export const StyledResultsTable = styled.div`
  color: ${({ theme }) => theme.color["primary"]};
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${(props) => props.theme.space[5]};
  width: 100%;
  height: 100%;
  /* Allow shrinking inside CSS Grid */
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

export const StyledHeading = styled.h1`
  color: ${({ theme }) => theme.color["primary"]};
`;
export const StyledDocumentRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;
export const StyledDocumentInfoText = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color.plain};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
export const StyledDocumentEmptyState = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color.plain};
  font-style: italic;
`;
export const StyledDocumentChangesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;
export const StyledDocumentChangesRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;
export const StyledDocumentChangesLabel = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  margin-right: 0.3rem;
  color: ${({ theme }) => theme.color.primary};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  min-width: 6rem;
`;
export const StyledDocumentChangesTags = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  flex: 1;
  overflow: hidden;
  /* one row only — the row height is fixed. tags give up their natural width
     down to a readable floor, and the row clips rather than growing taller */
  > * {
    min-width: 5rem;
    max-width: 20rem;
  }
`;
export const StyledDocumentChangesOverflow = styled.span`
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 0;
  padding-left: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color.gray[600]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-style: italic;
`;
export const StyledDocumentChangeFallback = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: ${({ theme }) => `1px solid ${theme.color.gray[400]}`};
  color: ${({ theme }) => theme.color.plain};
  background: ${({ theme }) => theme.color.gray[100]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
`;
