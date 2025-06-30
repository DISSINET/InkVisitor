import styled from "styled-components";

export const StyledDots = styled.p`
  display: flex;
  align-items: flex-end;
  margin-left: ${({ theme }) => theme.space[1]};
  cursor: default;
`;

export const StyledLoaderWrap = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const StyledSelectorCell = styled.div`
  cursor: pointer;
  margin: -0.5em 0em;
`;

export const StyledActionLabel = styled.div`
  font-size: 90%;
  max-width: 12em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface StyledTableWrapper {
  $isListMode?: boolean;
}
export const StyledTableWrapper = styled.div<StyledTableWrapper>`
  display: flex;
  flex-direction: column;
  overflow: auto;
  overflow-x: ${({ $isListMode }) => ($isListMode ? "auto" : "hidden")};
  flex-shrink: 0;
  padding-right: 0.1rem;
  padding-bottom: 0.5rem;
`;

export const StyledEmptyState = styled.div`
  padding: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  display: flex;
  align-self: center;
  align-items: center;
  text-align: center;
`;

export const StyledDocumentSearchLine = styled.div`
  display: flex;
  gap: 0.2rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.2rem 0.5rem;
  padding-right: 0.5rem;
  overflow: hidden;
  white-space: nowrap;
`;

export const StyledSearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  margin-left: ${({ theme }) => theme.space[2]};
  flex-shrink: 1;
  min-width: 0;
`;

export const StyledSearchIcon = styled.div`
  display: flex;
  flex-shrink: 0;
`;

interface StyledSearchResults {
  $annotatorWidthTooSmall?: boolean;
}
export const StyledSearchResults = styled.div<StyledSearchResults>`
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color.info};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  white-space: nowrap;
  flex-wrap: ${({ $annotatorWidthTooSmall }) =>
    $annotatorWidthTooSmall ? "wrap" : "nowrap"};
  /* flex-wrap: wrap; */
`;

export const StyledSearchNavigation = styled.div`
  display: flex;
  gap: 0.4rem;
  color: ${({ theme }) => theme.color.black};
  font-size: ${({ theme }) => theme.fontSize.sm};
  flex-shrink: 0;
`;

export const StyledAnnotatorMenuBar = styled.div`
  display: flex;
  gap: 0.2rem;
  flex-shrink: 0;
`;

export const StyledNoDocumentMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-style: italic;
  flex-shrink: 0;
`;

export const StyledEntityContainer = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 1;
  min-width: 0;
  max-width: 20rem;
`;

export const StyledDocumentTitleContainer = styled.div`
  display: flex;
  align-items: center;
  /* max-width: 100px; */
`;
