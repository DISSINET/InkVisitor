import { Header, MemoizedFooter, Toast } from "components";
import React from "react";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { heightFooter, heightHeader } from "Theme/constants";
import { StyledPage } from "./PageStyles";
import { LeftHeader, RightHeader } from "components/advanced";
import { useMutation, useQuery, useQueryClient } from "react-query";
import api from "api";
import { setUsername } from "redux/features/usernameSlice";
import { toast } from "react-toastify";

interface Page {
  children?: React.ReactNode;
}
export const Page: React.FC<Page> = ({ children }) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const username: string = useAppSelector((state) => state.username);
  const userId = localStorage.getItem("userid");
  const userRole = localStorage.getItem("userrole");

  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );

  const environmentName = (process.env.ROOT_URL || "").replace(
    /apps\/inkvisitor[-]?/,
    ""
  );

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
    { enabled: !!userId && api.isLoggedIn() }
  );

  const logOutMutation = useMutation(async () => await api.signOut(), {
    onSuccess: (data, variables) => {
      dispatch(setUsername(""));
      queryClient.removeQueries();
      toast.success("You've been successfully logged out!");
    },
  });

  return (
    <StyledPage layoutWidth={layoutWidth}>
      <Header
        height={heightHeader}
        paddingY={0}
        paddingX={10}
        color={
          ["production", ""].indexOf(environmentName) === -1
            ? environmentName
            : "primary"
        }
        left={<LeftHeader />}
        right={
          <RightHeader
            setUserCustomizationOpen={() => {}}
            handleLogOut={logOutMutation.mutate}
            userName={user ? user.name : ""}
            userRole={userRole || ""}
          />
        }
      />

      {children}

      <Toast />
      <MemoizedFooter height={heightFooter} />
    </StyledPage>
  );
};
