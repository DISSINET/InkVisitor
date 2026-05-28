import { InterfaceEnums, UserEnums } from "@inkvisitor/shared/enums";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import api from "api";
import { Toast } from "components";
import { Page } from "components/advanced";
import ErrorBoundary from "components/ErrorBoundary";
import { useDebounce } from "hooks";
import { SearchParamsProvider } from "hooks/useSearchParamsContext";
import { useWindowSize } from "hooks/useWindowSize";
import {
  AboutPage,
  AclPage,
  ActivatePage,
  BackupsPage,
  DocumentsPage,
  LoginPage,
  MainPage,
  NotFoundPage,
  PasswordResetPage,
  UsersPage,
} from "pages";
import { StatsPage } from "pages/Stats/StatsPage";
import React, { useEffect, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Helmet } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { setContentHeight } from "redux/features/layout/contentHeightSlice";
import { setLayoutWidth } from "redux/features/layout/layoutWidthSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { ThemeProvider } from "styled-components";
import { heightHeader } from "Theme/constants";
import GlobalStyle from "Theme/global";
import theme from "Theme/theme";
import { darkTheme } from "Theme/theme-dark";
import { QueryPage } from "pages";

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

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  return api.isLoggedIn() ? children : <Navigate to="/login" />;
};

export const RequireOwner = ({ children }: { children: React.ReactNode }) => {
  if (!api.isLoggedIn()) {
    return <Navigate to="/login" />;
  }
  const isOwner = localStorage.getItem("userrole") === UserEnums.Role.Owner;
  return isOwner ? children : <Navigate to="/" />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      retry: false,
      // turn on for airplane / offline work
      // networkMode: "always",
    },
  },
});
export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedThemeId: InterfaceEnums.Theme = useAppSelector((state) => state.theme);

  const themeConfig = useMemo(() => {
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
    <ErrorBoundary>
      <Helmet>
        <meta charSet="utf-8" />
        <title>InkVisitor</title>
      </Helmet>
      <ThemeProvider theme={themeConfig}>
        <GlobalStyle theme={themeConfig} />
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
                      path="/stats"
                      element={
                        <RequireAuth>
                          <StatsPage />
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
                      path="/backups"
                      element={
                        <RequireOwner>
                          <BackupsPage />
                        </RequireOwner>
                      }
                    />
                    <Route
                      path="/explorer"
                      element={
                        <RequireAuth>
                          <QueryPage />
                        </RequireAuth>
                      }
                    />

                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>

                  <Toast />
                </Page>
              </SearchParamsProvider>
            </BrowserRouter>
          </DndProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
