import "./../src/app.css";
import React from "react";
import { ThemeProvider } from "styled-components";
import theme from "../src/Theme/theme";
import { addDecorator } from '@storybook/react';
import GlobalStyle from '../src/Theme/global';

addDecorator((story) => 
  <ThemeProvider theme={theme}>
    <GlobalStyle />
    {story()}
  </ThemeProvider>
);
