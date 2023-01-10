import api from "api";
import { Header, Loader, MemoizedFooter, Toast } from "components";
import {
  LeftHeader,
  RightHeader,
  UserCustomizationModal,
} from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useLocation, useHistory } from "react-router";
import { toast } from "react-toastify";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { heightFooter } from "Theme/constants";
import { StyledPageContent, StyledPage } from "./PageStyles";

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

  const environmentName = (process.env.ROOT_URL || "").replace(
    /apps\/inkvisitor[-]?/,
    ""
  );

  const location = useLocation();
  const history = useHistory();

  const disableRightHeader: boolean =
    location.pathname !== "/users" &&
    location.pathname !== "/acl" &&
    location.pathname !== "/about" &&
    location.pathname !== "/";

  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
  } = useQuery(
    ["user", username],
    async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      } else {
        return false;
      }
    },
    { enabled: !!userId && api.isLoggedIn() && !disableRightHeader }
  );

  const logOutMutation = useMutation(async () => await api.signOut(), {
    onSuccess: (data, variables) => {
      dispatch(setUsername(""));
      queryClient.removeQueries();
      toast.success("You've been successfully logged out!");
      //
      cleanAllParams();

      history.push("/");
    },
  });

  const [userCustomizationOpen, setUserCustomizationOpen] = useState(false);

  const [tempLocation, setTempLocation] = useState<string | false>(false);

  return (
    <StyledPage layoutWidth={layoutWidth}>
      <Header
        paddingY={0}
        paddingX={10}
        color={
          ["production", ""].indexOf(environmentName) === -1
            ? environmentName
            : "primary"
        }
        left={<LeftHeader tempLocation={tempLocation} />}
        right={
          <>
            {!disableRightHeader && (
              <RightHeader
                setUserCustomizationOpen={() => setUserCustomizationOpen(true)}
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

      <MemoizedFooter height={heightFooter} />

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
