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
  ExplorerPage,
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
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { setContentHeight } from "redux/features/layout/contentHeightSlice";
import { setLayoutWidth } from "redux/features/layout/layoutWidthSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { ThemeProvider } from "styled-components";
import { heightHeader } from "Theme/constants";
import GlobalStyle from "Theme/global";
import theme from "Theme/theme";
import { darkTheme } from "Theme/theme-dark";
import { storeRedirectTarget } from "utils/redirectAfterLogin";
import { getStoredUserRole } from "utils/userStorage";

const clockPerformance = (
  profilerId: any,
  mode: any,
  actualTime: any,
  baseTime: any,
  startTime: any,
  commitTime: any,
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

// throws during render, which is the only kind of failure an error boundary
// catches — event handlers and async callbacks bypass it
const CrashTest = () => {
  throw new Error("Deliberate crash from /crash — ErrorBoundary preview route.");
};

export const PublicPath = (props: any) => {
  const loggedIn = !api.isLoggedIn();
  if (loggedIn) {
    api.signOut();
  }

  return props.children;
};

// The redirect to /login drops the route the user asked for together with its
// search and hash params, so it is recorded first and LoginPage returns them
// there once the session exists.
const RedirectToLogin = () => {
  const location = useLocation();
  storeRedirectTarget(location);
  return <Navigate to="/login" replace />;
};

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  return api.isLoggedIn() ? children : <RedirectToLogin />;
};

export const RequireOwner = ({ children }: { children: React.ReactNode }) => {
  if (!api.isLoggedIn()) {
    return <RedirectToLogin />;
  }
  const isOwner = getStoredUserRole() === UserEnums.Role.Owner;
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
    <ThemeProvider theme={themeConfig}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>InkVisitor</title>
      </Helmet>
      {/* outside the boundary: the fallback replaces everything inside it, and
          without the global reset it would render at the browser's default
          font and root size */}
      <GlobalStyle theme={themeConfig} />
      {/* inside the provider so its fallback can reach the theme; an error
          thrown above this point belongs to App's own render and no boundary
          rendered by App could catch it anyway */}
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          {/* sized by the .tsqd-parent-container rules in Theme/global.ts */}
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          <DndProvider backend={HTML5Backend}>
            <BrowserRouter basename={process.env.ROOT_URL}>
              <SearchParamsProvider>
                <Page>
                  <Routes>
                    {/* PUBLIC */}
                    {process.env.NODE_ENV === "development" && (
                      <Route path="/crash" element={<CrashTest />} />
                    )}
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
                          <ExplorerPage />
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
      </ErrorBoundary>
    </ThemeProvider>
  );
};
