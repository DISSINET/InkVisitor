import { css } from "styled-components";

/* A narrower take on the global scrollbar, a 4px thumb in a 6px strip, for a scroller
   short of room. Chrome ignores the pseudo-elements once scrollbar-width is set, so that
   applies only in Firefox. */
export const thinScrollbar = css`
  @supports not selector(::-webkit-scrollbar) {
    scrollbar-width: thin;
  }
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    border-width: 1px;
  }
`;
