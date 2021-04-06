import React from "react";
import { ThemeProvider } from "styled-components";
import { addDecorator } from "@storybook/react";

import theme from "../src/Theme/theme";
import GlobalStyle from "../src/Theme/global";

addDecorator((story) => (
  <ThemeProvider theme={theme}>
    <GlobalStyle />
    {story()}
  </ThemeProvider>
));

// export const parameters = { layout: "fullscreen" };
