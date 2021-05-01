import { createGlobalStyle } from "styled-components";

import MuniFont from "assets/fonts/muni-bold-webfont.woff2";

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap');

  html {
    font-size: 62.5%;
  }
  body {
    position: absolute;
    min-width: 100%;
    font-family: "Roboto", sans-serif;
    letter-spacing: .2px;
    line-height: 1.5;
    @font-face {
      font-family: "Muni";
      src: url("${MuniFont}") format("woff2");
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
  }
  h2 {
    font-size: ${({ theme }) => theme.fontSize["3xl"]};
  }
  h3 {
    font-size: ${({ theme }) => theme.fontSize["2xl"]};
  }
  h4 {
    font-size: ${({ theme }) => theme.fontSize["xl"]};
  }
  h5 {
    font-size: ${({ theme }) => theme.fontSize["lg"]};
  }
  h6 {
    font-size: ${({ theme }) => theme.fontSize["base"]};
  }
`;

export default GlobalStyle;
