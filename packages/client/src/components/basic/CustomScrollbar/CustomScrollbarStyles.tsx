import styled from "styled-components";

interface StyledScrollbar {
  $width?: number;
}
/** Native scrolling; the scrollbar look comes from the global style. */
export const StyledScrollbar = styled.div<StyledScrollbar>`
  /* scroll targets measure offsetTop against this element */
  position: relative;
  width: ${({ $width }) => ($width !== undefined ? `${$width}px` : "100%")};
  height: 100%;
  overflow: auto;
`;
