// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "../../src/setup";
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

import GlobalStyle from "Theme/global";
import theme from "Theme/theme";
import { mount } from "cypress/react18";
import { createElement } from "react";
import { ThemeProvider } from "styled-components";
import { Provider } from "react-redux";
import store from "redux/store";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

Cypress.Commands.add("mount", (jsx, options) =>
  mount(
    createElement(
      ThemeProvider,
      { theme },
      createElement(GlobalStyle),
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(
          DndProvider,
          { backend: HTML5Backend },
          createElement(Provider, { store, children: jsx })
        )
      )
    ),
    options
  )
);

// returning false here prevents Cypress from
// failing the test
// Cypress.on("uncaught:exception", (err, runnable) => {
// return false;
// });

// Example use:
// cy.mount(<MyComponent />)
