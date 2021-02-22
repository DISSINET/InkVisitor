// import css from '@styled-system/css'
// import normalize from 'normalize.css'
import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;800;900&display=swap');

  body {
    position: absolute;
    min-width: 100%;
    font-family: "Roboto", sans-serif;
    letter-spacing: 0.2px;
    line-height: 1.5;
    /* font-size: 62.5%; */
  }
  *, *::after, *::before {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

export default GlobalStyle;