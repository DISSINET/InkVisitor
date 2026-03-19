import styled from "styled-components";

/** Defined before viewport so the parent can target it on hover. */
export const StyledScrollerCursor = styled.div`
  cursor: move;
  position: absolute;
  width: 10px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  background-color: ${({ theme }) => theme.color.gray[600]};

  transition: background-color 0.5s ease;
`;

export const StyledScrollerViewport = styled.div`
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  position: relative;
  width: 10px;
  margin-left: 0.6rem;
  background-color: ${({ theme }) => theme.color.gray[200]};

  /* transition: background-color 0.3s ease; */
  /* &:hover {
    background-color: ${({ theme }) => theme.color.gray[300]};
  } */
  /* Thumb highlights when hovering anywhere on the scroller track */
  &:hover ${StyledScrollerCursor}, &:active ${StyledScrollerCursor} {
    background-color: ${({ theme }) => theme.color.gray[700]};
  }
`;

export const StyledCanvasWrapper = styled.div`
  background-color: ${({ theme }) => theme.color.white};
  padding: 2px;
  border-radius: 7px;
  display: flex;
  flex-direction: row;
`;

export const StyledMainCanvas = styled.canvas`
  outline: none;
  cursor: text;
`;

export const StyledLinesCanvas = styled.canvas`
  outline: none;
`;

interface StyledAnnotatorMenuProps {}
export const StyledAnnotatorMenu = styled.div<StyledAnnotatorMenuProps>`
  position: absolute;
  width: 40rem;
  background: ${({ theme }) => theme.color.blue["100"]};
  padding: ${({ theme }) => theme.space[2]};
  z-index: 100;
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  opacity: 0.95;
  &:hover {
    opacity: 1;
  }
  transition: opacity 0.5s, box-shadow 0.3s;
`;

export const StyledAnnotatorItem = styled.div`
  padding: ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.borderRadius.xs};
  margin-bottom: ${({ theme }) => theme.space[2]};

  &:hover {
    background: ${({ theme }) => theme.color.blue["150"]};
  }
`;

export const StyledAnnotatorItemContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  margin-top: ${({ theme }) => theme.space[2]};
  margin-left: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
  position: relative;
`;

export const StyledAnnotatorItemContentLine = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

export const StyledAnnotatorAnchorListWrap = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  max-height: 13rem;
  border-radius: ${({ theme }) => theme.borderRadius.xs};
  background-color: ${({ theme }) => theme.color.gray["500"]};
  padding: ${({ theme }) => theme.space[3]};
  padding-bottom: ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-left: ${({ theme }) => theme.space["-2"]};
`;

export const StyledAnnotatorItemTitle = styled.div`
  position: relative;
  color: ${({ theme }) => theme.color.gray["700"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  font-variant-caps: small-caps;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledAnnotatorAnchorList = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
  padding: ${({ theme }) => theme.space[1]};
`;

export const StyledTerritorySubsection = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.color.blue["200"]};
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-left: ${({ theme }) => theme.space["-2"]};
  margin-top: ${({ theme }) => theme.space[1]};
`;

export const StyledTerritorySubsectionTitle = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme }) => theme.color.gray["800"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-variant-caps: small-caps;
`;

export const StyledAnnotatorNoAnchors = styled.div`
  color: ${({ theme }) => theme.color.white};
  align-self: center;
  display: flex;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-style: italic;
`;

export const StyledInfoText = styled.div`
  color: ${({ theme }) => theme.color.black};
  font-size: ${({ theme }) => theme.fontSize.sm};
  margin: ${({ theme }) => theme.space[4]};
`;

interface StyledDisplayModeButtonIconWrapper {
  $annotatorWidthTooNarrow?: boolean;
}
export const StyledDisplayModeButtonIconWrapper = styled.div<StyledDisplayModeButtonIconWrapper>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ $annotatorWidthTooNarrow }) =>
    $annotatorWidthTooNarrow ? "0 0.5rem" : ""};
`;

export const StyledAnnotatorButtons = styled.div`
  display: flex;
  justify-content: space-between;
  padding-left: ${({ theme }) => theme.space[1]};
`;
