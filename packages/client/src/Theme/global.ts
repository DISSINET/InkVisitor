import MuniFont from "assets/fonts/muni-bold-webfont.woff2?inline";
import { createGlobalStyle } from "styled-components";
import { SCROLLBAR_SIZE } from "./constants";
import { ThemeType } from "./theme";

interface GlobalStyle {
  theme: ThemeType;
}
const GlobalStyle = createGlobalStyle<GlobalStyle>`
  @font-face {
    font-family: "Muni";
    src: url("${MuniFont}") format("woff2");
    font-display: swap;
  }
  html {
    font-size: 62.5%;
  }
  body {
    font-family: ${({ theme }) => theme.fontFamily["body"]};
    letter-spacing: .2px;
    line-height: 1.3;
  }
  *, *::after, *::before {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .no-select {
    user-select: none;
  }
  /*
    Every scrollbar in the app: a thin gray thumb on a transparent track.
    Styling ::-webkit-scrollbar makes Chrome and Safari draw a classic
    scrollbar that stays visible on macOS. Chrome drops those pseudo-elements
    on an element with scrollbar-color or scrollbar-width set, so the standard
    properties apply only in Firefox, which keeps the system's overlay behavior.
  */
  @supports not selector(::-webkit-scrollbar) {
    * {
      scrollbar-color: ${({ theme }) => theme.color.gray[500]} transparent;
    }
  }
  /* the transparent thumb border is the gap around a 7px thumb, and the track
     margin keeps the thumb clear of the box ends */
  ::-webkit-scrollbar {
    width: ${SCROLLBAR_SIZE}px;
    height: ${SCROLLBAR_SIZE}px;
    background: transparent;
  }
  ::-webkit-scrollbar-corner {
    background: transparent;
  }
  ::-webkit-scrollbar-track:vertical {
    margin: 5px 0;
  }
  ::-webkit-scrollbar-track:horizontal {
    margin: 0 5px;
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.color.gray[500]};
    background-clip: padding-box;
    /* on all four sides, so the clipped corners stay circular */
    border: 2px solid transparent;
    border-radius: ${({ theme }) => theme.borderRadius["full"]};
  }
  ::-webkit-scrollbar-thumb:vertical {
    min-height: 40px;
  }
  ::-webkit-scrollbar-thumb:horizontal {
    min-width: 40px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: ${({ theme }) => theme.color.gray[700]};
  }
  /*
    React Query devtools. Its own sizes are multiples of --tsqd-font-size, which
    it writes inline on its root (hence the !important to outrank that), but the
    elements it leaves untokenized inherit font-size — and would land on the
    62.5% html size above, a third smaller than the panel is drawn for. Both
    declarations carry one size; raise it to enlarge the whole panel.
  */
  .tsqd-parent-container {
    font-size: 16px;
  }
  .tsqd-parent-container [style*="--tsqd-font-size"] {
    --tsqd-font-size: 16px !important;
  }
  h1 {
    font-size: ${({ theme }) => theme.fontSize["4xl"]};
    line-height: 1.3;
  }
  h2 {
    font-size: ${({ theme }) => theme.fontSize["3xl"]};
    line-height: 1.3;
  }
  h3 {
    font-size: ${({ theme }) => theme.fontSize["2xl"]};
    line-height: 1.3;
  }
  h4 {
    font-size: ${({ theme }) => theme.fontSize["xl"]};
    line-height: 1.3;
  }
  h5 {
    font-size: ${({ theme }) => theme.fontSize["lg"]};
    line-height: 1.3;
  }
  h6 {
    font-size: ${({ theme }) => theme.fontSize["base"]};
    line-height: 1.3;
  }
`;

export default GlobalStyle;
