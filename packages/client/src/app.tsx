import React, { useState, useEffect } from "react";
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
  const [size, setSize] = useState([0, 0]);
  const [width, height] = useWindowSize();
  const dispatch = useAppDispatch();
  console.log(width, height);

  useEffect(() => {
    const handleResize = () => {
      setSize([width, height]);
    };
    // count widths and set to REDUX
    const layoutWidth = width < layoutWidthBreakpoint ? minLayoutWidth : width;
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
  }, [width, height]);

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>InkVisitor</title>
        {/* <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap"
          rel="stylesheet"
        /> */}
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
