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

// css doesn't load on the canvas element, so we use inline styles
export const StyledLinesCanvas = styled.canvas``;

interface StyledAnnotatorMenuProps {}
export const StyledAnnotatorDoneButton = styled.div`
  position: absolute;
  top: 0rem;
  right: 0.5em;
  transform: translate(0, -50%);
  z-index: 101;
  color: ${({ theme }) => theme.color.primary};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-xl"]};
  background-color: ${({ theme }) => theme.color.blue[100]};
`;

export const StyledAnnotatorMenu = styled.div<StyledAnnotatorMenuProps>`
  width: 40rem;
  z-index: 100;
  pointer-events: none;
`;

/** Inner drag layer only — keep transform off the Floating UI root */
export const StyledAnnotatorMenuDraggable = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: ${({ theme }) => theme.color.blue[100]};
  padding: ${({ theme }) => theme.space[2]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  border-radius: 1rem;

  opacity: 0.95;

  &:hover {
    opacity: 1;
  }
  transition:
    opacity 0.5s,
    box-shadow 0.3s;
`;

export const StyledAnnotatorMenuDragHandle = styled.div`
  cursor: grab;
  touch-action: none;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[1]} 0 ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  color: ${({ theme }) => theme.color.gray["600"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  flex-shrink: 0;

  &:active {
    cursor: grabbing;
  }

  &:hover {
    background: ${({ theme }) => theme.color.blue["150"]};
  }
`;

export const StyledAnnotatorItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.borderRadius.default};

  &:hover {
    background: ${({ theme }) => theme.color.blue["150"]};
  }
`;

export const StyledAnnotatorItemContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  margin: ${({ theme }) => theme.space[2]};
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
  overflow: hidden;
  min-height: 0;
  max-height: 13rem;
  border: ${({ theme }) => `1px solid ${theme.color.blue["200"]}`};
  background-color: ${({ theme }) => theme.color.blue["100"]};
  padding: 0 0.23rem;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

export const StyledAnnotatorItemTitle = styled.div`
  position: relative;
  color: ${({ theme }) => theme.color.gray["700"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  font-variant-caps: small-caps;
  display: flex;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[3]};
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledTerritorySubsection = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.color.blue["200"]};
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  width: 100%;
`;

export const StyledTerritorySubsectionTitle = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme }) => theme.color.gray["800"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-variant-caps: small-caps;
`;

/** Stacks the Sibling / Child Territory create buttons, right-aligned. */
export const StyledTerritoryButtonColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space[2]};
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

export const StyledStatementSubsection = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.color.blue["200"]};
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  max-width: 100%;
`;

export const StyledStatementTargetSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledStatementTargetTitle = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme }) => theme.color.gray["700"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-variant-caps: small-caps;
`;

export const StyledStatementTargetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledStatementTargetOption = styled.div<{
  $isSelected: boolean;
  $depth?: number;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  cursor: pointer;
  padding: ${({ theme }) => theme.space[1]};
  margin-left: ${({ theme, $depth }) => ($depth ? `calc(${theme.space[4]} * ${$depth})` : 0)};
  border-radius: ${({ theme }) => theme.borderRadius.xs};
  border: ${({ theme, $isSelected }) =>
    `1px solid ${$isSelected ? theme.color.primary : "transparent"}`};
  background-color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.color.blue["200"] : "transparent"};
`;

export const StyledStatementTargetNote = styled.span`
  color: ${({ theme }) => theme.color.gray["600"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-style: italic;
  white-space: nowrap;
`;

export const StyledStatementTargetCurrent = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

export const StyledStatementTargetArrow = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.color.gray["600"]};
`;

export const StyledStatementTargetPopover = styled.div`
  z-index: 1000;
  background-color: ${({ theme }) => theme.color.blue["50"]};
  border: ${({ theme }) => `1px solid ${theme.color.blue["200"]}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
  padding: ${({ theme }) => theme.space[3]};
  max-width: 26rem;
`;

export const StyledStatementTargetInfo = styled.div`
  color: ${({ theme }) => theme.color.gray["600"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-style: italic;
  white-space: nowrap;
`;

interface StyledDisplayModeButtonIconWrapper {
  $annotatorWidthTooNarrow?: boolean;
}
export const StyledDisplayModeButtonIconWrapper = styled.div<StyledDisplayModeButtonIconWrapper>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ $annotatorWidthTooNarrow }) => ($annotatorWidthTooNarrow ? "0 0.5rem" : "")};
`;

export const StyledAnnotatorButtons = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const StyledWarningsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  width: 100%;
`;

export const StyledWarningsListHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color.blue[400]};
  margin-bottom: ${({ theme }) => theme.space[3]};
`;

export const StyledWarningRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  padding: 0.5rem 1rem;
  padding-right: 1.25rem;
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  background-color: ${({ theme }) => theme.color.blue[50]};
`;

export const StyledWarningInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  flex: 1;
  min-width: 0;
`;

export const StyledWarningKind = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-variant-caps: small-caps;
  color: ${({ theme }) => theme.color.warningText};
  white-space: nowrap;
`;

export const StyledCaretButtonWrapper = styled.span`
  display: flex;
`;

// #2885 — move-anchor mode: compact panel that replaces the menu body while
// an anchor span is being nudged with the arrow buttons.
export const StyledMoveAnchorPanel = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space[3]};
  margin-top: ${({ theme }) => theme.space[2]};
`;

export const StyledMoveAnchorControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[2]};
  width: 100%;
  gap: ${({ theme }) => theme.space[10]};
`;

export const StyledMoveAnchorGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const StyledMoveAnchorGroupLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color.gray["600"]};
  margin-bottom: ${({ theme }) => theme.space[1]};
`;

export const StyledMoveAnchorEntityTag = styled.div`
  display: grid;
  align-items: center;
  width: 100%;
  padding-left: ${({ theme }) => theme.space[1]};
`;

export const StyledMoveAnchorFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: ${({ theme }) => theme.space[2]};
`;
