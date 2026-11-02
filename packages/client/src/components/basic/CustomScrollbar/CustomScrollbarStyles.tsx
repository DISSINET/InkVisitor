import styled from "styled-components";

interface StyledScrollbar {
  $width?: number;
  $height?: number;
  $noScrollX: boolean;
  $noScrollY: boolean;
}
/**
 * Native scrolling with a thin gray thumb on a transparent track. Styling
 * `::-webkit-scrollbar` makes Chrome and Safari draw a classic scrollbar that
 * stays visible on macOS. Chrome drops those pseudo-elements once
 * `scrollbar-color` or `scrollbar-width` is set, so the standard properties
 * apply only in Firefox, which keeps the system's overlay behavior.
 */
export const StyledScrollbar = styled.div<StyledScrollbar>`
  /* scroll targets measure offsetTop against this element */
  position: relative;
  width: ${({ $width }) => ($width !== undefined ? `${$width}px` : "100%")};
  height: ${({ $height }) => ($height !== undefined ? `${$height}px` : "100%")};
  overflow-x: ${({ $noScrollX }) => ($noScrollX ? "hidden" : "auto")};
  overflow-y: ${({ $noScrollY }) => ($noScrollY ? "hidden" : "auto")};

  @supports not selector(::-webkit-scrollbar) {
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => theme.color.gray[500]} transparent;
  }

  /* the transparent thumb border is the gap around an 8px thumb, and the track
     margin keeps the thumb clear of the box ends */
  &::-webkit-scrollbar {
    width: 12px;
    height: 12px;
    background: transparent;
  }
  &::-webkit-scrollbar-corner {
    background: transparent;
  }
  &::-webkit-scrollbar-track:vertical {
    margin: 10px 0;
  }
  &::-webkit-scrollbar-track:horizontal {
    margin: 0 10px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.color.gray[500]};
    background-clip: padding-box;
    /* on all four sides, so the clipped corners stay circular */
    border: 2px solid transparent;
    border-radius: ${({ theme }) => theme.borderRadius["full"]};
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: ${({ theme }) => theme.color.gray[700]};
  }
`;
