import "./env-shim";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { HelmetProvider } from "react-helmet-async";
import { Provider as ReduxProvider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "redux/store";
import { ThemeProvider } from "styled-components";
import GlobalStyle from "Theme/global";
import theme from "Theme/theme";

// Queries never retry here: a preview renders against no backend, and the
// default retry schedule keeps components in their loading state for the
// whole capture window.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: Infinity },
  },
});

interface DSProvider {
  children?: React.ReactNode;
}

/**
 * Context every InkVisitor component expects from the application shell:
 * the redux store, the styled-components theme plus global styles, drag and
 * drop, a router, and the query client. Wrap anything rendered outside the
 * app itself in this.
 */
export const DSProvider: React.FC<DSProvider> = ({ children }) => (
  <ReduxProvider store={store}>
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <DndProvider backend={HTML5Backend}>
          <MemoryRouter>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </MemoryRouter>
        </DndProvider>
      </ThemeProvider>
    </HelmetProvider>
  </ReduxProvider>
);
