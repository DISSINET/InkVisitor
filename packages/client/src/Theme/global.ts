import MuniArial from "assets/fonts/academicons.woff2";
import MuniFont from "assets/fonts/muni-bold-webfont.woff2";
import { createGlobalStyle } from "styled-components";
import { ThemeType } from "./theme";

interface GlobalStyle {
  theme: ThemeType;
  disableUserSelect?: boolean;
  zoom: number;
}
const getFontSize = (zoom: number) => {
  switch (zoom) {
    case 0:
      return 50;
    case 1:
      return 65;
    case 2:
      return 70;
    default:
      return 62.5;
  }
};
const GlobalStyle = createGlobalStyle<GlobalStyle>`
  html {
    font-size: ${({ zoom }) => `${getFontSize(zoom)}%`};
    /* font-size: 62.5%; */
  }
  body {
    font-family: "Roboto", sans-serif;
    letter-spacing: .2px;
    line-height: 1.3;
    @font-face {
      font-family: "Muni";
      src: url("${MuniFont}") format("woff2");
    }
    @font-face {
      font-family: "MuniArial";
      src: url("${MuniArial}") format("woff2");
    }
  }
  *, *::after, *::before {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  *:not(input,textarea) {
    user-select: ${({ disableUserSelect }) =>
      disableUserSelect ? "none" : "auto"};
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
      border-radius: 0;
      box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
      width: 100%;
      transform: translate(0, -6px);
    }
    .react-select__menu-list {
      max-height: 18rem;
    }
    .react-select__option {
      margin: 0;
    }
    .react-select__option--is-selected {
      font-weight: bold;
      color: ${({ theme }) => theme.color["primary"]};
      background-color: white;
      :hover {
        background-color: ${({ theme }) =>
          theme.color["invertedBg"]["primary"]};
      }
    }
    .react-select__option--is-focused {
      background-color: ${({ theme }) => theme.color["invertedBg"]["primary"]};
    }
  }

  .react-select__entity-dropdown {
    .react-select__option {
      padding: 2px;
      padding-left: 0;
      height: 2.5rem;
    }
  }
`;

export default GlobalStyle;
