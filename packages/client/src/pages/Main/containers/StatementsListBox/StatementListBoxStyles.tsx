import styled from "styled-components";

export const StyledStatementListBox = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
`;

export const StyledContentWrapper = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;
export const StyledInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
`;
export const StyledDots = styled.p`
  display: flex;
  align-items: flex-end;
  margin-left: ${({ theme }) => theme.space[1]};
  cursor: default;
`;

interface StyledLoaderWrap {
  $width: number;
  $height: number;
}
export const StyledLoaderWrap = styled.div<StyledLoaderWrap>`
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
  width: ${({ $width }) => `${$width / 10}rem`};
  height: ${({ $height }) => `${$height / 10}rem`};
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

export const StyledTableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  overflow-x: auto;
  flex-shrink: 0;
  padding-right: 0.1rem;
  padding-bottom: 0.5rem;
`;

export const StyledDocumentLine = styled.div`
  display: flex;
  gap: 0.2rem;
  align-items: center;
  justify-content: space-between;
  height: 3rem;
  padding: 0rem 0.5rem;
  margin-bottom: 0.2rem;
  padding-right: 0.5rem;
  overflow: hidden;
  white-space: nowrap;
`;

export const StyledSearchLine = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  justify-content: center;
  height: 3rem;
`;
export const StyledHighlightContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;
export const StyledSearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  margin-left: ${({ theme }) => theme.space[2]};
  flex-shrink: 1;
  min-width: 0;
  user-select: none;
`;

export const StyledSearchIcon = styled.div`
  display: flex;
  flex-shrink: 0;
`;

interface StyledSearchResults {
  $annotatorWidthTooNarrow?: boolean;
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
  flex-wrap: ${({ $annotatorWidthTooNarrow }) =>
    $annotatorWidthTooNarrow ? "wrap" : "nowrap"};
  margin: 0 0.2rem;
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
  position: relative;
  display: flex;
  align-items: center;
  min-width: 1rem;
`;
