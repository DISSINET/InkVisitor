import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React, { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { ThemeProvider } from "styled-components";

import api from "api";
import { Page } from "components/advanced";
import { useDebounce } from "hooks";
import { useWindowSize } from "hooks/useWindowSize";
import { heightHeader } from "Theme/constants";
import GlobalStyle from "Theme/global";
import theme, { ThemeType } from "Theme/theme";
import { darkTheme } from "Theme/theme-dark";

import { InterfaceEnums } from "@shared/enums";
import { SearchParamsProvider } from "hooks/useSearchParamsContext";
import {
  AboutPage,
  AclPage,
  ActivatePage,
  QueryPage,
  DocumentsPage,
  LoginPage,
  MainPage,
  NotFoundPage,
  PasswordResetPage,
  UsersPage,
} from "pages";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { setContentHeight } from "redux/features/layout/contentHeightSlice";
import { setLayoutWidth } from "redux/features/layout/layoutWidthSlice";

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
      // turn on for airplane / offline work
      // networkMode: "always",
    },
  },
});
export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const disableUserSelect = useAppSelector(
    (state) => state.layout.disableUserSelect
  );
  const selectedThemeId: InterfaceEnums.Theme = useAppSelector(
    (state) => state.theme
  );

  const themeConfig = useMemo<ThemeType>(() => {
    if (selectedThemeId === "dark") {
      return darkTheme;
    }
    return theme;
  }, [selectedThemeId]);

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
    }
  }, [debouncedWidth]);

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>InkVisitor</title>
      </Helmet>
      <ThemeProvider theme={themeConfig}>
        <GlobalStyle
          theme={themeConfig}
          disableUserSelect={disableUserSelect}
        />
        <QueryClientProvider client={queryClient}>
          <div style={{ fontSize: "16px" }}>
            {/* fontSize zooms query devtools to normal size */}
            <ReactQueryDevtools initialIsOpen={false} />
          </div>
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
                    <Route
                      path="/password_reset"
                      element={
                        <PublicPath>
                          <PasswordResetPage />
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
                    <Route
                      path="/documents"
                      element={
                        <RequireAuth>
                          <DocumentsPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/query"
                      element={
                        <RequireAuth>
                          <QueryPage />
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
