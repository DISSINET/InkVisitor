// import "./../src/app.css";
import React from "react";
import { ThemeProvider } from "styled-components";
import theme from "../src/theme";
import { addDecorator } from '@storybook/react';

addDecorator((story) => 
  <ThemeProvider theme={theme}>
    {story()}
  </ThemeProvider>
);

