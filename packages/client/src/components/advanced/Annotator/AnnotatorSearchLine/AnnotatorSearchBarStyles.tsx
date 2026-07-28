import styled from "styled-components";
import { TOOLBAR_GUTTER_PX } from "../AnnotatorToolbar/AnnotatorToolbarStyles";

/**
 * Sits over the top-right of the canvas. The canvas is a fixed-size element the
 * annotator library draws into, and any change to its height re-wraps the whole
 * document, so the bar overlays it rather than taking a row of its own. The
 * viewport can scroll one row above the first line (VIEWPORT_START_BUFFER_ROWS),
 * which is what lets the user move line 1 out from under it.
 */
/**
 * Spans the canvas but paints nothing, so the bar can sit against the right
 * edge while still being bounded on the left: once the bar would grow past this
 * box it has to shrink instead of running off the canvas.
 *
 * Held as close to the top as the canvas allows — the viewport can scroll only
 * one row above the first line (VIEWPORT_START_BUFFER_ROWS), so every pixel the
 * bar sits lower is a pixel of line 1 that cannot be uncovered.
 */
export const StyledAnnotatorSearchBarWrap = styled.div`
  position: absolute;
  top: 2px;
  left: ${TOOLBAR_GUTTER_PX}px;
  /* the scroller viewport sits in the last 10px of the wrapper's width */
  right: ${TOOLBAR_GUTTER_PX + 12}px;
  z-index: 20;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
`;

export const StyledAnnotatorSearchBar = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  gap: ${({ theme }) => theme.space[1]};
  padding: 0 ${({ theme }) => theme.space[1]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-md"]};
  background-color: ${({ theme }) => theme.color.blue[100]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  pointer-events: auto;
`;

/** Yields first when the bar runs out of room; the buttons keep their size. */
export const StyledSearchBarInput = styled.div`
  display: flex;
  min-width: 0;
  flex-shrink: 1;
`;

/** The flag toggles, sized to sit inside the input's right edge. */
export const StyledSearchBarFlags = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding-right: ${({ theme }) => theme.space[1]};
`;

export const StyledSearchBarResults = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  white-space: nowrap;
  min-width: 4rem;
  justify-content: flex-end;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
`;

export const StyledSearchBarNav = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.space[1]};
`;
