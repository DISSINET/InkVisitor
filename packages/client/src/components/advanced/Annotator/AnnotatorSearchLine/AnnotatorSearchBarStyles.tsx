import styled from "styled-components";
import { TOOLBAR_GUTTER_PX } from "../AnnotatorToolbar/AnnotatorToolbarStyles";

/**
 * Sits over the top-right of the canvas. The canvas is a fixed-size element the
 * annotator library draws into, and any change to its height re-wraps the whole
 * document, so the bar overlays it rather than taking a row of its own. The
 * viewport can scroll one row above the first line (VIEWPORT_START_BUFFER_ROWS),
 * which is what lets the user move line 1 out from under it.
 */
export const StyledAnnotatorSearchBar = styled.div`
  position: absolute;
  top: ${TOOLBAR_GUTTER_PX}px;
  /* the scroller viewport sits in the last 10px of the wrapper's width */
  right: ${TOOLBAR_GUTTER_PX + 10}px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[1]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-md"]};
  background-color: ${({ theme }) => theme.color.blue[100]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  opacity: 0.8;
  transition: opacity 0.3s;

  &:hover,
  &:focus-within {
    opacity: 1;
  }
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
  white-space: nowrap;
  min-width: 4rem;
  justify-content: flex-end;
  color: ${({ theme }) => theme.color.gray["600"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

export const StyledSearchBarNav = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;
