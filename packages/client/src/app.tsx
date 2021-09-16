import React, { useState, useLayoutEffect, useEffect } from "react";
import { Switch, Route, BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { Helmet } from "react-helmet";

import theme from "./Theme/theme";
import MainPage from "./pages/MainPage";
import GlobalStyle from "Theme/global";

import AclPage from "./pages/Acl";

import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import {
  layoutWidthBreakpoint,
  minLayoutWidth,
  percentPanelWidths,
} from "Theme/constants";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setLayoutWidth } from "redux/features/layout/layoutWidthSlice";
import { setPanelWidths } from "redux/features/layout/panelWidthsSlice";
import { setSeparatorXPosition } from "redux/features/layout/separatorXPositionSlice";
import api from "api";
import { SearchParamsProvider } from "hooks/useParamsContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

interface AppProps {}
export const App: React.FC<AppProps> = () => {
  const [size, setSize] = useState([0, 0]);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight]);
    };
    // count widths and set to REDUX
    const layoutWidth =
      window.innerWidth < layoutWidthBreakpoint
        ? minLayoutWidth
        : window.innerWidth;
    dispatch(setLayoutWidth(layoutWidth));
    const onePercent = layoutWidth / 100;
    const panels = [
      Math.floor(onePercent * percentPanelWidths[0] * 10) / 10,
      Math.floor(onePercent * percentPanelWidths[1] * 10) / 10,
      Math.floor(onePercent * percentPanelWidths[2] * 10) / 10,
      Math.floor(onePercent * percentPanelWidths[3] * 10) / 10,
    ];
    dispatch(setPanelWidths(panels));
    dispatch(setSeparatorXPosition(panels[0] + panels[1]));

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          <BrowserRouter basename="apps/inkvisitor">
            <SearchParamsProvider>
              <Switch>
                <Route
                  path="/"
                  exact
                  render={(props) => <MainPage {...props} size={size} />}
                />
                {api.isLoggedIn() ? (
                  <Route
                    path="/acl"
                    exact
                    render={(props) => <AclPage {...props} size={size} />}
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
