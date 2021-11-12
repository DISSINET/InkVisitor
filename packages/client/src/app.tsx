import React, { useEffect, useState } from "react";
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
  separatorXPercentPosition,
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

export const App: React.FC = () => {
  const [width, height] = useWindowSize();
  const dispatch = useAppDispatch();

  useEffect(() => {}, []);

  useEffect(() => {
    if (width > 0 && height > 0) {
      const layoutWidth =
        width < layoutWidthBreakpoint ? minLayoutWidth : width;
      dispatch(setLayoutWidth(layoutWidth));
      const onePercent = layoutWidth / 100;

      const separatorXStoragePosition = localStorage.getItem(
        "separatorXPosition"
      );
      const separatorPercentPosition: number = separatorXStoragePosition
        ? Number(separatorXStoragePosition)
        : separatorXPercentPosition;

      if (!separatorXStoragePosition) {
        localStorage.setItem(
          "separatorXPosition",
          separatorPercentPosition.toString()
        );
      }

      const firstPanel =
        Math.floor(onePercent * percentPanelWidths[0] * 10) / 10;
      const secondPanel = Math.floor(
        (onePercent * (separatorPercentPosition - percentPanelWidths[0]) * 10) /
          10
      );
      const thirdPanel = Math.floor(
        layoutWidth -
          (onePercent *
            (separatorPercentPosition - percentPanelWidths[3]) *
            10) /
            10
      );
      const fourthPanel =
        Math.floor(onePercent * percentPanelWidths[3] * 10) / 10;

      // const panels = percentPanelWidths.map(
      //   (percentPanelWidth) =>
      //     Math.floor(onePercent * percentPanelWidth * 10) / 10
      // );
      const panels = [firstPanel, secondPanel, thirdPanel, fourthPanel];
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
