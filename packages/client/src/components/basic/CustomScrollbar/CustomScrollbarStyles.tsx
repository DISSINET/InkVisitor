import styled from "styled-components";

interface StyledScrollbar {
  $width?: number;
  $height?: number;
  $noScrollX: boolean;
  $noScrollY: boolean;
}
/**
 * Native scrolling with a thin gray thumb on a transparent track. Browsers that
 * know `scrollbar-color` ignore `::-webkit-scrollbar`, so the pseudo-elements
 * only style Safari.
 */
export const StyledScrollbar = styled.div<StyledScrollbar>`
  /* scroll targets measure offsetTop against this element */
  position: relative;
  width: ${({ $width }) => ($width !== undefined ? `${$width}px` : "100%")};
  height: ${({ $height }) => ($height !== undefined ? `${$height}px` : "100%")};
  overflow-x: ${({ $noScrollX }) => ($noScrollX ? "hidden" : "auto")};
  overflow-y: ${({ $noScrollY }) => ($noScrollY ? "hidden" : "auto")};

  @supports (scrollbar-color: auto) {
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => theme.color.gray[500]} transparent;
  }

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.color.gray[500]};
    border-radius: ${({ theme }) => theme.borderRadius["full"]};
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: ${({ theme }) => theme.color.gray[700]};
  }
`;
