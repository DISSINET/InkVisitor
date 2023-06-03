import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { ThemeProvider } from "styled-components";

import api from "api";
import { SearchParamsProvider } from "hooks/useParamsContext";
import { useWindowSize } from "hooks/useWindowSize";
import ActivatePage from "pages/Activate";
import LoginPage from "pages/Login";
import UsersPage from "pages/Users";

import {
  heightHeader,
  percentPanelWidths,
  secondPanelMinWidth,
  separatorXPercentPosition,
  thirdPanelMinWidth,
} from "Theme/constants";
import GlobalStyle from "Theme/global";
import { Page } from "components/advanced";
import { useDebounce } from "hooks";
import { AboutPage } from "pages/About";
import NotFoundPage from "pages/NotFound";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { setContentHeight } from "redux/features/layout/contentHeightSlice";
import { setLayoutWidth } from "redux/features/layout/layoutWidthSlice";
import { setPanelWidths } from "redux/features/layout/panelWidthsSlice";
import { setSeparatorXPosition } from "redux/features/layout/separatorXPositionSlice";
import theme from "./Theme/theme";
import AclPage from "./pages/Acl";
import MainPage from "./pages/MainPage";

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
  const loggedIn = !api.isLoggedIn();
  if (loggedIn) {
    api.signOut();
  }

  return props.children;
};

export const RequireAuth = ({ children }: { children: JSX.Element }) => {
  return api.isLoggedIn() ? children : <Navigate to="/login" />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});
export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const disableUserSelect = useAppSelector(
    (state) => state.layout.disableUserSelect
  );

  const [debouncedWidth, debouncedHeight] = useDebounce(useWindowSize(), 50);

  useEffect(() => {
    if (debouncedHeight > 0) {
      const heightContent = debouncedHeight - heightHeader;
      dispatch(setContentHeight(heightContent));
    }
  }, [debouncedHeight]);

  useEffect(() => {
    if (debouncedWidth > 0) {
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

      // FIRST
      const firstPanel =
        Math.floor(onePercent * percentPanelWidths[0] * 10) / 10;

      // SECOND
      const secondPanelPx = Math.floor(
        (onePercent * (separatorPercentPosition - percentPanelWidths[0]) * 10) /
          10
      );
      const isSecondPanelUndersized = secondPanelPx < secondPanelMinWidth;
      let secondPanel = isSecondPanelUndersized
        ? secondPanelMinWidth
        : secondPanelPx;

      // THIRD
      const thirdPanelPx = Math.floor(
        layoutWidth -
          (onePercent *
            (separatorPercentPosition + percentPanelWidths[3]) *
            10) /
            10
      );
      const isThirdPanelUndersized = thirdPanelPx < thirdPanelMinWidth;
      let thirdPanel = isThirdPanelUndersized
        ? thirdPanelMinWidth
        : thirdPanelPx;

      // FOURTH
      const fourthPanel =
        Math.floor(onePercent * percentPanelWidths[3] * 10) / 10;

      if (!isSecondPanelUndersized && isThirdPanelUndersized) {
        const undersizeDifference = thirdPanelMinWidth - thirdPanelPx;
        secondPanel = secondPanel - undersizeDifference;
      }

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
        <GlobalStyle disableUserSelect={disableUserSelect} />
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <DndProvider backend={HTML5Backend}>
            <BrowserRouter basename={process.env.ROOT_URL}>
              <SearchParamsProvider>
                <Page>
                  <Routes>
                    {/* PUBLIC */}
                    <Route
                      path="/login"
                      element={
                        <PublicPath>
                          <LoginPage />
                        </PublicPath>
                      }
                    />
                    <Route
                      path="/activate"
                      element={
                        <PublicPath>
                          <ActivatePage />
                        </PublicPath>
                      }
                    />
                    {/* PRIVATE */}
                    <Route
                      path="/"
                      element={
                        <RequireAuth>
                          <MainPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/acl"
                      element={
                        <RequireAuth>
                          <AclPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/about"
                      element={
                        <RequireAuth>
                          <AboutPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/users"
                      element={
                        <RequireAuth>
                          <UsersPage />
                        </RequireAuth>
                      }
                    />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Page>
              </SearchParamsProvider>
            </BrowserRouter>
          </DndProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
};
