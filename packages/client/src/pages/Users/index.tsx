import api from "api";

import { Box, Header, Toast } from "components";
import { MemoizedFooter } from "components/Footer/Footer";
import { UserList } from "./containers";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { heightFooter, heightHeader } from "Theme/constants";
import {
  LeftHeader,
  RightHeader,
} from "../MainPage/containers/MainPageHeader/MainPageHeader";
import { StyledPage } from "./UsersPageStyles";

interface UsersPageProps {
  size: number[];
}

const UsersPage: React.FC<UsersPageProps> = ({ size }) => {
  const dispatch = useAppDispatch();
  const username: string = useAppSelector((state) => state.username);
  const userId = localStorage.getItem("userid");
  const userRole = localStorage.getItem("userrole");

  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const queryClient = useQueryClient();

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

  const handleLogOut = () => {
    api.signOut();
    dispatch(setUsername(""));
    queryClient.removeQueries();
    toast.success("You've been successfully logged out!");
  };

  const environmentName = (process.env.ROOT_URL || "").replace(
    /apps\/inkvisitor[-]?/,
    ""
  );

  const [mainPageRedirect, setMainPageRedirect] = useState(false);

  return (
    <>
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
              setUserCustomizationOpen={setMainPageRedirect}
              handleLogOut={handleLogOut}
              userName={user ? user.name : ""}
              userRole={userRole || ""}
            />
          }
        />
        <Box>
          <UserList />
        </Box>
        <Toast />
        <MemoizedFooter height={heightFooter} />
      </StyledPage>
    </>
  );
};

export default UsersPage;
