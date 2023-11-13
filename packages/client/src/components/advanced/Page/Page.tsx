import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Header, Loader, Toast } from "components";
import {
  LeftHeader,
  RightHeader,
  UserCustomizationModal,
} from "components/advanced";
import { useSearchParams } from "hooks";
import useKeyLift from "hooks/useKeyLift";
import useKeypress from "hooks/useKeyPress";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Id, toast } from "react-toastify";
import { setDisableUserSelect } from "redux/features/layout/disableUserSelectSlice";
import { setPing } from "redux/features/pingSlice";
import { setLastClickedIndex } from "redux/features/statementList/lastClickedIndexSlice";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { StyledPage, StyledPageContent } from "./PageStyles";
import { ThemeColor } from "Theme/theme";

interface Page {
  children?: React.ReactNode;
}
export const Page: React.FC<Page> = ({ children }) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const username: string = useAppSelector((state) => state.username);
  const userId = localStorage.getItem("userid");
  const userRole = localStorage.getItem("userrole");
  const { cleanAllParams } = useSearchParams();

  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  let environmentName = (process.env.ROOT_URL || "").replace(
    /apps\/inkvisitor[-]?/,
    ""
  );
  if (environmentName === "/") {
    environmentName = "";
  }

  const location = useLocation();
  const navigate = useNavigate();

  const disableRightHeader: boolean =
    location.pathname === "/login" || location.pathname === "/activate";

  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
    isPaused,
  } = useQuery(
    ["user", userId],
    async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    { enabled: api.isLoggedIn() && !disableRightHeader }
  );

  const toastId = React.useRef<Id | null>(null);
  const notify = () =>
    (toastId.current = toast.dark("you're offline", { autoClose: false }));
  const dismiss = () => {
    if (toastId.current) {
      toast.dismiss(toastId.current);
    }
  };

  useEffect(() => {
    if (isPaused) {
      notify();
    } else {
      if (toastId.current && toast.isActive(toastId.current)) {
        dismiss();
      }
    }
  }, [isPaused]);

  const logOutMutation = useMutation(async () => await api.signOut(), {
    onSuccess: (data, variables) => {
      dispatch(setUsername(""));
      queryClient.removeQueries();
      toast.success("You've been successfully logged out!");
      //
      cleanAllParams();

      navigate("/login");
    },
  });

  const [userCustomizationOpen, setUserCustomizationOpen] = useState(false);

  const [tempLocation, setTempLocation] = useState<string | false>(false);

  useKeypress("Shift", () => dispatch(setDisableUserSelect(true)));

  useKeyLift("Shift", () => dispatch(setDisableUserSelect(false)));

  useQuery(
    ["ping"],
    async () => {
      const localPing = api.getPing();
      if (localPing) dispatch(setPing(localPing));
      return localPing;
    },
    {
      refetchInterval: 5000,
    }
  );

  return (
    <StyledPage
      layoutWidth={layoutWidth}
      onClick={() => dispatch(setLastClickedIndex(-1))}
    >
      <Header
        paddingY={0}
        paddingX={10}
        color={
          ["production", ""].indexOf(environmentName) === -1
            ? (environmentName as keyof ThemeColor)
            : "muni"
        }
        left={<LeftHeader tempLocation={tempLocation} />}
        right={
          <>
            {!disableRightHeader && (
              <RightHeader
                setUserCustomizationOpen={setUserCustomizationOpen}
                handleLogOut={logOutMutation.mutate}
                userName={user ? user.name : ""}
                userRole={userRole || ""}
                setTempLocation={setTempLocation}
                tempLocation={tempLocation}
              />
            )}
          </>
        }
      />

      {contentHeight > 0 ? (
        <StyledPageContent id="page" height={contentHeight}>
          {children}
        </StyledPageContent>
      ) : (
        <StyledPageContent id="page" height={0}>
          <Loader show />
        </StyledPageContent>
      )}

      {user && userCustomizationOpen && (
        <UserCustomizationModal
          user={user}
          onClose={() => setUserCustomizationOpen(false)}
        />
      )}
      <Toast />
    </StyledPage>
  );
};
