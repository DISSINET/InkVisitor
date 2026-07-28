import styled from "styled-components";

/**
 * Sits over the bottom-left of the canvas, above the line-number gutter. The
 * canvas is a fixed-size element the annotator library draws into, and any
 * change to its height re-wraps the whole document — so the toolbar overlays it
 * rather than taking a row of its own.
 */
export const StyledAnnotatorToolbar = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.space[2]};
  bottom: ${({ theme }) => theme.space[2]};
  z-index: 20;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-md"]};
  background-color: ${({ theme }) => theme.color.blue[100]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  opacity: 0.9;
  transition: opacity 0.3s;

  &:hover,
  &:focus-within {
    opacity: 1;
  }
`;

/** Groups the controls a single host contributes, so gaps read as groups. */
export const StyledAnnotatorToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

/** Wraps the save button so its Loader can be absolutely positioned over it. */
export const StyledAnnotatorToolbarButtonWrap = styled.span`
  display: flex;
  position: relative;
`;

export const StyledDisplayModeButtonIconWrapper = styled.div`
  display: flex;
  align-items: center;
`;
