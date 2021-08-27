import { createGlobalStyle } from "styled-components";

import MuniFont from "assets/fonts/muni-bold-webfont.woff2";
import MuniArial from "assets/fonts/academicons.woff2";

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap');

  html {
    font-size: 62.5%;
  }
  body {
    font-family: "Roboto", sans-serif;
    letter-spacing: .2px;
    line-height: 1.5;
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
  h1 {
    font-size: ${({ theme }) => theme.fontSize["4xl"]};
    line-height: 1.5;
  }
  h2 {
    font-size: ${({ theme }) => theme.fontSize["3xl"]};
    line-height: 1.5;
  }
  h3 {
    font-size: ${({ theme }) => theme.fontSize["2xl"]};
    line-height: 1.5;
  }
  h4 {
    font-size: ${({ theme }) => theme.fontSize["xl"]};
    line-height: 1.5;
  }
  h5 {
    font-size: ${({ theme }) => theme.fontSize["lg"]};
    line-height: 1.5;
  }
  h6 {
    font-size: ${({ theme }) => theme.fontSize["base"]};
    line-height: 1.5;
  }
`;

export default GlobalStyle;
