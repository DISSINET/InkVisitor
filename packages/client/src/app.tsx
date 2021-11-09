import React, { useEffect } from "react";
import { Switch, Route, BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { Helmet } from "react-helmet";

import theme from "./Theme/theme";
import MainPage from "./pages/MainPage";
import GlobalStyle from "Theme/global";

import AclPage from "./pages/Acl";

import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import {
  layoutWidthBreakpoint,
  minLayoutWidth,
  percentPanelWidths,
} from "Theme/constants";
import { useAppDispatch } from "redux/hooks";
import { setLayoutWidth } from "redux/features/layout/layoutWidthSlice";
import { setPanelWidths } from "redux/features/layout/panelWidthsSlice";
import { setSeparatorXPosition } from "redux/features/layout/separatorXPositionSlice";
import api from "api";
import { SearchParamsProvider } from "hooks/useParamsContext";
import { useWindowSize } from "hooks/useWindowSize";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

interface AppProps {}
export const App: React.FC<AppProps> = () => {
  const [width, height] = useWindowSize();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (width > 0 && height > 0) {
      const layoutWidth =
        width < layoutWidthBreakpoint ? minLayoutWidth : width;
      dispatch(setLayoutWidth(layoutWidth));
      const onePercent = layoutWidth / 100;
      const panels = percentPanelWidths.map(
        (percentWidth) => Math.floor(onePercent * percentWidth * 10) / 10
      );
      dispatch(setPanelWidths(panels));
      dispatch(setSeparatorXPosition(panels[0] + panels[1]));
    }
  }, [width]);

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>InkVisitor</title>
      </Helmet>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <BrowserRouter basename={process.env.ROOT_URL}>
            <SearchParamsProvider>
              <Switch>
                <Route
                  path="/"
                  exact
                  render={(props) => (
                    <MainPage {...props} size={[width, height]} />
                  )}
                />
                {api.isLoggedIn() ? (
                  <Route
                    path="/acl"
                    exact
                    render={(props) => (
                      <AclPage {...props} size={[width, height]} />
                    )}
                  />
                ) : null}
              </Switch>
            </SearchParamsProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
};
