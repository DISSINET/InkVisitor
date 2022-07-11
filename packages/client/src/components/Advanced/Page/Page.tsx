import api from "api";
import { Header, MemoizedFooter, Toast } from "components";
import {
  LeftHeader,
  MemoizedLoginModal,
  RightHeader,
  UserCustomizationModal,
} from "components/advanced";
import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { heightFooter, heightHeader } from "Theme/constants";
import {
  StyledContent,
  StyledPage,
  StyledVerticalCenterTransform,
} from "./PageStyles";

interface Page {
  children?: React.ReactNode;
  logOutCleanUp?: () => void;
  disableRightHeader?: boolean;
  centeredContent?: boolean;
}
export const Page: React.FC<Page> = ({
  children,
  logOutCleanUp = () => {},
  disableRightHeader = false,
  centeredContent = false,
}) => {
  const isLoggedIn = api.isLoggedIn();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const username: string = useAppSelector((state) => state.username);
  const userId = localStorage.getItem("userid");
  const userRole = localStorage.getItem("userrole");

  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  // TODO: add APP background and add StyledContent with this height prop
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
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
    { enabled: !!userId && api.isLoggedIn() && !disableRightHeader }
  );

  const logOutMutation = useMutation(async () => await api.signOut(), {
    onSuccess: (data, variables) => {
      dispatch(setUsername(""));
      queryClient.removeQueries();
      toast.success("You've been successfully logged out!");
      //
      logOutCleanUp();
    },
  });

  const [userCustomizationOpen, setUserCustomizationOpen] = useState(false);

  return (
    <DndProvider backend={HTML5Backend}>
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
            <>
              {!disableRightHeader && (
                <RightHeader
                  setUserCustomizationOpen={() =>
                    setUserCustomizationOpen(true)
                  }
                  handleLogOut={logOutMutation.mutate}
                  userName={user ? user.name : ""}
                  userRole={userRole || ""}
                />
              )}
            </>
          }
        />

        <StyledContent
          height={contentHeight}
          horizontalCenter={centeredContent}
          verticalCenter={centeredContent}
        >
          {centeredContent ? (
            <StyledVerticalCenterTransform verticalCenter={centeredContent}>
              {children}
            </StyledVerticalCenterTransform>
          ) : (
            <>{children}</>
          )}
        </StyledContent>

        <MemoizedFooter height={heightFooter} />

        {user && userCustomizationOpen && (
          <UserCustomizationModal
            user={user}
            onClose={() => setUserCustomizationOpen(false)}
          />
        )}
        {!isLoggedIn && <MemoizedLoginModal />}
        <Toast />
      </StyledPage>
    </DndProvider>
  );
};
