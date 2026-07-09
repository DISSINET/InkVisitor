import { UserEnums } from "@inkvisitor/shared/enums";
import { getAppEnv } from "utils/appEnv";
import { getStoredUserId, getStoredUserRole, getStoredUsername } from "utils/userStorage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Header, Loader } from "components";
import { LeftHeader, RightHeader, UserCustomizationModal } from "components/advanced";
import { useSearchParams } from "hooks";
import useKeyLift from "hooks/useKeyLift";
import useKeypress from "hooks/useKeyPress";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Id, toast } from "react-toastify";
import { setPing } from "redux/features/pingSlice";
import { setLastClickedIndex } from "redux/features/statementList/lastClickedIndexSlice";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { ThemeColor } from "Theme/theme";
import { StyledPage, StyledPageContent } from "./PageStyles";
import { useUserQuery } from "hooks/react-query";

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
  const location = useLocation();
  const navigate = useNavigate();

  const disableRightHeader: boolean =
    location.pathname === "/login" ||
    location.pathname === "/activate" ||
    location.pathname === "/password_reset";

  const { data: user, isFetching: isFetchingUser, isPaused } = useUserQuery(!disableRightHeader);

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
    if (disableRightHeader) {
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
  }, [user?.name, userRole, isFetchingUser, tempLocation, disableRightHeader]);

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
      <Header
        paddingY={0}
        paddingX={10}
        color={
          environmentName === "production"
            ? "muni"
            : environmentName
            ? (environmentName as keyof ThemeColor)
            : "black"
        }
        left={headerLeft}
        right={headerRight}
      />

      <StyledPageContent id="page-content">{contentEl}</StyledPageContent>

      {user && userCustomizationOpen && (
        <UserCustomizationModal user={user} onClose={() => setUserCustomizationOpen(false)} />
      )}
    </StyledPage>
  );
};
