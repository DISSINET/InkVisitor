import styled from "styled-components";

/**
 * Gap between a floating cluster and the edge of the canvas it sits over. One
 * value for all sides so the clusters read as equally inset.
 */
export const TOOLBAR_GUTTER_PX = 4;

/**
 * Icons in the action cluster are sized here rather than per call site: a
 * button's height follows its content, so mixed glyph sizes give mismatched
 * buttons even at one ButtonSize.
 */
export const TOOLBAR_ICON_SIZE = 13;

/**
 * Spans the canvas so its two clusters can sit at opposite ends, but paints
 * nothing itself and takes no pointer events — the text between the clusters
 * stays visible and clickable. The canvas is a fixed-size element the annotator
 * library draws into, and any change to its height re-wraps the whole document,
 * so the toolbar overlays it rather than taking a row of its own.
 */
export const StyledAnnotatorToolbar = styled.div`
  position: absolute;
  left: ${TOOLBAR_GUTTER_PX}px;
  right: ${TOOLBAR_GUTTER_PX + 12}px;
  bottom: ${TOOLBAR_GUTTER_PX}px;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]};
  pointer-events: none;
`;

/**
 * One cluster of the toolbar. Changing what the canvas shows (the edit modes)
 * and acting on what it shows are different jobs, so they get separate pills at
 * opposite ends rather than one undifferentiated strip.
 */
export const StyledAnnotatorToolbarCluster = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-md"]};
  background-color: ${({ theme }) => theme.color.blue[100]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  pointer-events: auto;
  opacity: 0.8;
  transition: opacity 0.3s;

  &:hover,
  &:focus-within {
    opacity: 1;
  }
`;

/**
 * Keeps a host's controls together in source without introducing a nesting level
 * that would space them differently: display:contents drops the wrapper from
 * layout, so every control in the cluster sits on the cluster's one gap.
 */
export const StyledAnnotatorToolbarGroup = styled.div`
  display: contents;
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
