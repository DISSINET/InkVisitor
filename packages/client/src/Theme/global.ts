import MuniFont from "assets/fonts/muni-bold-webfont.woff2?inline";
import { createGlobalStyle } from "styled-components";
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
    font-family: "Roboto", sans-serif;
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

  /* react-select portal */
  .react-select__menu-portal {
    font-size: ${({ theme }) => theme.fontSize["xs"]};
    .react-select__menu {
      border-radius: ${({ theme }) => theme.borderRadius["input"]};
      box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
      width: 100%;
      transform: translate(0, -6px);
      overflow: hidden;

      color: ${({ theme }) => theme.color["black"]};
      background-color: ${({ theme }) => theme.color["white"]};
    }
    .react-select__menu-list {
      max-height: 18rem;
      border-radius: ${({ theme }) => theme.borderRadius["input"]};
      padding-top: 0;
      padding-bottom: 0;
    }
    .react-select__option {
      margin: 0;
      min-height: 3rem;
    }
    .react-select__option--is-selected {
      font-weight: bold;
      color: ${({ theme }) => theme.color["black"]};
      background-color: ${({ theme }) => theme.color["white"]};
      &:hover {
        background-color: ${({ theme }) => theme.color["invertedBg"]["primary"]};
      }
    }
    .react-select__option--is-focused {
      background-color: ${({ theme }) => theme.color["invertedBg"]["primary"]};
    }
    .react-select__option--is-disabled {
      color: ${({ theme }) => theme.color["gray"][500]};
    }
  }

  .react-select__entity-dropdown {
    .react-select__option {
      padding: 2px;
      padding-left: 0;
    }
    .react-select__option--is-selected {
    }
  }

  .react-select__user-dropdown {
    .react-select__option {
      min-height: unset;
      padding: 2px 6px;
    }
  }
`;

export default GlobalStyle;
