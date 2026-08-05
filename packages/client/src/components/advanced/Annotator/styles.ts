import { EntityEnums } from "@inkvisitor/shared/enums";
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

/**
 * The annotator's own column: canvases and the footer under them.
 *
 * Sized by its content rather than by the box, so the footer sits directly
 * under the canvas and the two move together when a resize settles. Stretching
 * it to the box instead would leave the difference between the canvas height
 * and the box height as dead space, and hand a drag's shrink to the rows of
 * plain DOM before the canvas knows about it.
 */
export const StyledAnnotatorColumn = styled.div`
  position: relative;
`;

/** Inset of the canvases inside their wrapper; the height budget must pay for it. */
export const CANVAS_WRAPPER_PADDING_PX = 2;

interface StyledCanvasWrapperProps {
  $noBorderRadius?: boolean;
}
export const StyledCanvasWrapper = styled.div<StyledCanvasWrapperProps>`
  position: relative;
  background-color: ${({ theme }) => theme.color.white};
  padding: ${CANVAS_WRAPPER_PADDING_PX}px;
  border-radius: ${({ $noBorderRadius }) => ($noBorderRadius ? 0 : "7px")};
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
  right: -0.2rem;
  transform: translate(0, -48%);
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
  border: ${({ theme }) => `1px solid ${theme.color.blue["100"]}`};
  background-color: ${({ theme }) => theme.color.blue["50"]};
  padding: 0 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.default};
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

/** Wraps a create button so hovering it can ring its related elvl group. */
export const StyledElvlWarningTrigger = styled.span`
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

export const StyledMoveAnchorFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: ${({ theme }) => theme.space[2]};
`;

/** One anchor grid cell — sizes the tag to the column. */
export const StyledAnchorCell = styled.div`
  width: 100%;
  display: flex;
`;

/**
 * Wraps the open-Statement-in-editor button inside the tag's button slot;
 * visible only while the pointer is over the anchor cell, so the extra action
 * does not crowd every Statement tag at rest. Visibility is CSS-driven from
 * the cell because EntityTag memoizes on the button slot's presence, not its
 * content — React state in the cell would never reach a mounted slot.
 */
export const StyledAnchorOpenStatementButton = styled.div`
  display: none;
  ${StyledAnchorCell}:hover & {
    display: flex;
  }
`;

/**
 * Outer wrapper for a row's anchor controls (view mode). Lays out the
 * collapsed static elvl icon next to the hover zone below; itself carries no
 * hover behavior.
 */
export const StyledAnchorControlsCluster = styled.div`
  display: flex;
`;

/**
 * Hover target for the kebab + expanded controls only (not the collapsed
 * static elvl icon, which sits outside it in StyledAnchorControlsCluster).
 * Holds a kebab hint at rest and expands to the inline resize / elvl / unlink
 * controls on hover, so only the kebab — not the disabled elvl icon or the
 * label — opens it, and the controls stay put while the pointer moves across
 * them (the wrapper is the same element before and after expanding).
 */
export const StyledAnchorClusterHoverZone = styled.div`
  display: flex;
`;

/** Wraps the move-anchor button with a right border divider. */
export const StyledAnchorClusterMoveButton = styled.div`
  display: flex;
  border-right: ${({ theme }) => `${theme.borderWidth[1]} solid ${theme.color["black"]}`};
  && button {
    border-right-width: 0;
  }
`;

/**
 * Wraps the interactive elvl group inside the cluster. EntityTag's button-slot
 * wrapper forces a thick 2px divider onto every descendant button; that is the
 * tag-action divider and is wrong between the elvl options. Restore the elvl
 * group's own look: a single thin divider on its left (as in the tag's native
 * elvl slot) and no divider between the option buttons.
 */
interface StyledAnchorClusterElvl {
  $tagBorderColorKey: EntityEnums.Status;
}
export const StyledAnchorClusterElvl = styled.div<StyledAnchorClusterElvl>`
  display: flex;
  border-left: ${({ theme, $tagBorderColorKey }) =>
    `2px solid ${theme.color.tagBorderColor[$tagBorderColorKey]}`};
  && button {
    border-left-width: 0;
  }
`;

/** Wraps the unlink button with a left border divider. */
export const StyledAnchorClusterUnlinkButton = styled.div`
  display: flex;
  border-left: ${({ theme }) => `${theme.borderWidth[1]} solid ${theme.color["black"]}`};
  && button {
    border-left-width: 0;
  }
`;

/** Pushes the anchors view/edit switch to the right edge of the title row. */
export const StyledAnchorModeSwitch = styled.div`
  margin-left: auto;
  margin-right: ${({ theme }) => theme.space[2]};
  display: flex;
  align-items: center;
`;
