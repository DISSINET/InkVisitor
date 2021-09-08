import React from "react";
import { ThemeProvider } from "styled-components";
import { addDecorator } from "@storybook/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import store from "../src/redux/store";
import theme from "../src/Theme/theme";
import GlobalStyle from "../src/Theme/global";

addDecorator((story) => (
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        {story()}
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
));
