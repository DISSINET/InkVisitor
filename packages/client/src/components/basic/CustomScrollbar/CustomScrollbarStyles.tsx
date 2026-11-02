import styled from "styled-components";

interface StyledScrollbar {
  $width?: number;
  $height?: number;
  $noScrollX: boolean;
  $noScrollY: boolean;
}
/** Native scrolling; the scrollbar look comes from the global style. */
export const StyledScrollbar = styled.div<StyledScrollbar>`
  /* scroll targets measure offsetTop against this element */
  position: relative;
  width: ${({ $width }) => ($width !== undefined ? `${$width}px` : "100%")};
  height: ${({ $height }) => ($height !== undefined ? `${$height}px` : "100%")};
  overflow-x: ${({ $noScrollX }) => ($noScrollX ? "hidden" : "auto")};
  overflow-y: ${({ $noScrollY }) => ($noScrollY ? "hidden" : "auto")};
`;
