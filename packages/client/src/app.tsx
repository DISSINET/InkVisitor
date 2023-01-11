import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import { useAppDispatch } from "redux/hooks";
import { ThemeProvider } from "styled-components";

import api from "api";
import { SearchParamsProvider } from "hooks/useParamsContext";
import { useWindowSize } from "hooks/useWindowSize";
import ActivatePage from "pages/Activate";
import LoginPage from "pages/Login";
import UsersPage from "pages/Users";

import { Page } from "components/advanced";
import { useDebounce } from "hooks";
import NotFoundPage from "pages/NotFound";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { setContentHeight } from "redux/features/layout/contentHeightSlice";
import { setLayoutWidth } from "redux/features/layout/layoutWidthSlice";
import { setPanelWidths } from "redux/features/layout/panelWidthsSlice";
import { setSeparatorXPosition } from "redux/features/layout/separatorXPositionSlice";
import {
  heightFooter,
  heightHeader,
  percentPanelWidths,
  separatorXPercentPosition,
} from "Theme/constants";
import GlobalStyle from "Theme/global";
import AclPage from "./pages/Acl";
import MainPage from "./pages/MainPage";
import theme from "./Theme/theme";
import { AboutPage } from "pages/About";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const clockPerformance = (
  profilerId: any,
  mode: any,
  actualTime: any,
  baseTime: any,
  startTime: any,
  commitTime: any
) => {
  console.log({
    profilerId,
    mode,
    actualTime,
    baseTime,
    startTime,
    commitTime,
  });
};

export const PublicPath = (props: any) => {
  const Component = props.children;

  const loggedIn = !api.isLoggedIn();
  if (loggedIn) {
    api.signOut();
  }

  return (
    <Route path={props.path} render={props.render} exact={props.exact}>
      <Component props />
    </Route>
  );
};

export const ProtectedPath = (props: any) => {
  const Component = props.children;

  return api.isLoggedIn() ? (
    <Route path={props.path} render={props.render} exact={props.exact}>
      <Component props />
    </Route>
  ) : (
    <Redirect to="/login" />
  );
};

export const App: React.FC = () => {
  const dispatch = useAppDispatch();

  const [debouncedWidth, debouncedHeight] = useDebounce(useWindowSize(), 50);

  useEffect(() => {
    if (debouncedHeight > 0) {
      const heightContent = debouncedHeight - heightHeader - heightFooter;
      dispatch(setContentHeight(heightContent));
    }
  }, [debouncedHeight]);

  useEffect(() => {
    if (debouncedWidth > 0) {
      // const layoutWidth =
      //   debouncedWidth < layoutWidthBreakpoint
      //     ? minLayoutWidth
      //     : debouncedWidth;
      const layoutWidth = debouncedWidth;
      dispatch(setLayoutWidth(layoutWidth));
      const onePercent = layoutWidth / 100;

      const separatorXStoragePosition =
        localStorage.getItem("separatorXPosition");
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
          (separatorPercentPosition + percentPanelWidths[3]) *
          10) /
        10
      );
      const fourthPanel =
        Math.floor(onePercent * percentPanelWidths[3] * 10) / 10;

      const panels = [firstPanel, secondPanel, thirdPanel, fourthPanel];
      dispatch(setPanelWidths(panels));
      dispatch(setSeparatorXPosition(panels[0] + panels[1]));
    }
  }, [debouncedWidth]);

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
          <DndProvider backend={HTML5Backend}>
            <BrowserRouter basename={process.env.ROOT_URL}>
              <SearchParamsProvider>
                <Page>
                  <Switch>
                    <PublicPath path="/login" children={LoginPage} />
                    <PublicPath path="/activate" children={ActivatePage} />
                    <ProtectedPath path="/" exact children={MainPage} />
                    <ProtectedPath path="/acl" children={AclPage} />
                    <ProtectedPath path="/about" children={AboutPage} />
                    <ProtectedPath path="/users" children={UsersPage} />
                    <Route path="*" component={NotFoundPage} />
                  </Switch>
                </Page>
              </SearchParamsProvider>
            </BrowserRouter>
          </DndProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
};
