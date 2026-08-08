import { UserEnums } from "@inkvisitor/shared/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Header, Loader } from "components";
import { LeftHeader, RightHeader, UserCustomizationModal } from "components/advanced";
import { useSearchParams } from "hooks";
import { useUserQuery } from "hooks/react-query";
import useKeyLift from "hooks/useKeyLift";
import useKeypress from "hooks/useKeyPress";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Id, toast } from "react-toastify";
import { setPing } from "redux/features/pingSlice";
import { setLastClickedIndex } from "redux/features/statementList/lastClickedIndexSlice";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import theme, { ThemeColor } from "Theme/theme";
import { getAppEnv } from "utils/appEnv";
import { clearRedirectTarget } from "utils/redirectAfterLogin";
import { getStoredUserId, getStoredUserRole } from "utils/userStorage";
import { StyledPage, StyledPageContent } from "./PageStyles";

interface Page {
  children?: React.ReactNode;
}
export const Page: React.FC<Page> = ({ children }) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const lastClickedIndex: number = useAppSelector((state) => state.statementList.lastClickedIndex);
  const userId = getStoredUserId();
  const userRole = getStoredUserRole() as UserEnums.Role;
  const { cleanAllParams, setLogoutState } = useSearchParams();

  const contentHeight: number = useAppSelector((state) => state.layout.contentHeight);
  const layoutWidth: number = useAppSelector((state) => state.layout.layoutWidth);

  const environmentName = getAppEnv();

  // Env names double as theme color keys, but an env can be deployed before its
  // color exists. Fall back rather than resolving to an undefined background.
  const headerColor: keyof ThemeColor =
    environmentName === "production"
      ? "muni"
      : environmentName in theme.color
        ? (environmentName as keyof ThemeColor)
        : "black";

  const location = useLocation();
  const navigate = useNavigate();

  // Auth pages render a branded modal of their own, so the app header (logo,
  // version, user chrome) stays hidden there entirely.
  const isAuthRoute: boolean =
    location.pathname === "/login" ||
    location.pathname === "/activate" ||
    location.pathname === "/password_reset";

  const { data: user, isFetching: isFetchingUser, isPaused } = useUserQuery(!isAuthRoute);

  const toastId = React.useRef<Id | null>(null);
  const notify = () => (toastId.current = toast.dark("you're offline", { autoClose: false }));

  useEffect(() => {
    if (isPaused) {
      notify();
    } else {
      if (toastId.current && toast.isActive(toastId.current)) {
        toast.dismiss(toastId.current);
      }
    }
  }, [isPaused]);

  const logOutMutation = useMutation({
    mutationFn: async () => await api.signOut(),
    onSuccess: (data, variables) => {
      // Set logout state to prevent navigation conflicts in React 19
      setLogoutState(true);

      dispatch(setUsername(""));
      queryClient.removeQueries();
      toast.success("You've been successfully logged out!");

      cleanAllParams();
      // a deliberate logout ends at the login screen, not back where the
      // previous session was
      clearRedirectTarget();

      navigate("/login");

      // Reset the logout flag after navigation completes
      setTimeout(() => {
        setLogoutState(false);
      }, 100);
    },
  });

  const [userCustomizationOpen, setUserCustomizationOpen] = useState<boolean>(false);

  const [tempLocation, setTempLocation] = useState<string | false>(false);

  useKeypress("Shift", () => document.body.classList.add("no-select"));
  useKeyLift("Shift", () => document.body.classList.remove("no-select"));

  useEffect(() => {
    const updatePing = () => {
      const localPing = api.getPing();
      if (localPing) {
        dispatch(setPing(localPing));
      }
    };
    updatePing();
    const interval = setInterval(updatePing, 5000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const headerLeft = useMemo(() => <LeftHeader tempLocation={tempLocation} />, [tempLocation]);

  const headerRight = useMemo<undefined | React.ReactNode>(() => {
    if (isAuthRoute) {
      return undefined;
    }
    return (
      <RightHeader
        setUserCustomizationOpen={setUserCustomizationOpen}
        userId={userId ?? ""}
        handleLogOut={logOutMutation.mutate}
        userName={user?.name ?? ""}
        userRole={userRole || ""}
        setTempLocation={setTempLocation}
        tempLocation={tempLocation}
        userIsFetching={isFetchingUser}
      />
    );
  }, [user?.name, userRole, isFetchingUser, tempLocation, isAuthRoute]);

  const handleClick = useCallback(() => {
    if (lastClickedIndex !== -1) {
      dispatch(setLastClickedIndex(-1));
    }
  }, [lastClickedIndex]);

  const contentEl = useMemo(() => {
    if (contentHeight > 0 && layoutWidth > 0) {
      return children;
    } else {
      return <Loader show />;
    }
  }, [contentHeight, layoutWidth]);

  return (
    <StyledPage onClick={handleClick} id="page">
      {!isAuthRoute && (
        <Header
          paddingY={0}
          paddingX={10}
          color={headerColor}
          left={headerLeft}
          right={headerRight}
        />
      )}

      <StyledPageContent id="page-content" $fullHeight={isAuthRoute}>
        {contentEl}
      </StyledPageContent>

      {user && userCustomizationOpen && (
        <UserCustomizationModal user={user} onClose={() => setUserCustomizationOpen(false)} />
      )}
    </StyledPage>
  );
};
