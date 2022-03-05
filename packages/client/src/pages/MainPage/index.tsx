import api from "api";
import LogoInkvisitor from "assets/logos/inkvisitor-full.svg";
import {
  Box,
  Button,
  ButtonGroup,
  Footer,
  Header,
  Panel,
  PanelSeparator,
  Toast,
} from "components";
import { useSearchParams } from "hooks";
import ScrollHandler from "hooks/ScrollHandler";
import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { IoMdClose } from "react-icons/io";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { setAuthToken } from "redux/features/authTokenSlice";
import { setFirstPanelExpanded } from "redux/features/layout/firstPanelExpandedSlice";
import { setFourthPanelExpanded } from "redux/features/layout/fourthPanelExpandedSlice";
import { setUsername } from "redux/features/usernameSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  collapsedPanelWidth,
  heightFooter,
  heightHeader,
} from "Theme/constants";
import packageJson from "../../../package.json";
import {
  ActantBookmarkBox,
  ActantSearchBox,
  EntityDetailBox,
  LoginModal,
  StatementEditorBox,
  StatementListBox,
  TerritoryTreeBox,
  UserListModal,
} from "./containers";
import { UserCustomizationModal } from "./containers/UserCustomizationModal/UserCustomizationModal";
import {
  StyledFaUserAlt,
  StyledHeader,
  StyledHeaderLogo,
  StyledHeaderTag,
  StyledPage,
  StyledPanelWrap,
  StyledText,
  StyledUser,
  StyledUserBox,
  StyledUsername,
} from "./MainPageStyles";

interface MainPage {
  size: number[];
}

const MainPage: React.FC<MainPage> = ({ size }) => {
  const {
    detailId,
    setDetailId,
    statementId,
    setStatementId,
    territoryId,
    setTerritoryId,
  } = useSearchParams();

  const [width, height] = size;

  const isLoggedIn = api.isLoggedIn();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.username);
  const userId = localStorage.getItem("userid");
  const userRole = localStorage.getItem("userrole");

  const firstPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.firstPanelExpanded
  );
  const fourthPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.fourthPanelExpanded
  );
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const panelWidths: number[] = useAppSelector(
    (state) => state.layout.panelWidths
  );
  const separatorXPosition: number = useAppSelector(
    (state) => state.layout.separatorXPosition
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
    { enabled: !!userId && api.isLoggedIn(), retry: 2 }
  );

  const [userAdministrationModalOpen, setUserAdministrationModalOpen] =
    useState<boolean>(false);

  const handleLogOut = () => {
    api.signOut();
    dispatch(setUsername(""));
    dispatch(setAuthToken(""));
    toast.success("You've been successfully logged out!");
    queryClient.removeQueries();
    setDetailId("");
    setStatementId("");
    setTerritoryId("");
  };

  const handleUsersModalClick = () => {
    setUserAdministrationModalOpen(true);
  };

  const handleUsersModalCancelClick = () => {
    setUserAdministrationModalOpen(false);
  };

  const environmentName = (process.env.ROOT_URL || "").replace(
    /apps\/inkvisitor[-]?/,
    ""
  );

  const heightContent = height - heightHeader - heightFooter;

  const firstPanelButton = () => (
    <Button
      onClick={() => {
        if (firstPanelExpanded) {
          dispatch(setFirstPanelExpanded(false));
          localStorage.setItem("firstPanelExpanded", "false");
        } else {
          dispatch(setFirstPanelExpanded(true));
          localStorage.setItem("firstPanelExpanded", "true");
        }
      }}
      inverted
      icon={firstPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
    />
  );
  const fourthPanelButton = () => (
    <Button
      onClick={() => {
        if (fourthPanelExpanded) {
          dispatch(setFourthPanelExpanded(false));
          localStorage.setItem("fourthPanelExpanded", "false");
        } else {
          dispatch(setFourthPanelExpanded(true));
          localStorage.setItem("fourthPanelExpanded", "true");
        }
      }}
      inverted
      icon={fourthPanelExpanded ? <RiMenuUnfoldFill /> : <RiMenuFoldFill />}
    />
  );

  const [userCustomizationOpen, setUserCustomizationOpen] = useState(false);

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
          left={
            <StyledHeader>
              <StyledHeaderLogo
                height={heightHeader - 10}
                src={LogoInkvisitor}
                alt="React Logo"
              />
              <StyledHeaderTag>
                v. {packageJson.version}{" "}
                {["production", ""].indexOf(environmentName) === -1
                  ? `| ${environmentName}`
                  : ""}
              </StyledHeaderTag>
            </StyledHeader>
          }
          right={
            <div>
              {isLoggedIn && (
                <StyledUserBox>
                  <StyledUser>
                    <StyledText>logged as</StyledText>
                    <StyledFaUserAlt
                      size={14}
                      onClick={() => setUserCustomizationOpen(true)}
                    />
                    <StyledUsername
                      onClick={() => setUserCustomizationOpen(true)}
                    >
                      {user ? user.name : ""}
                    </StyledUsername>
                  </StyledUser>
                  <ButtonGroup>
                    {userRole == "admin" && (
                      <Button
                        label="Manage Users"
                        color="info"
                        onClick={() => handleUsersModalClick()}
                      />
                    )}
                    <Button
                      label="Log Out"
                      color="danger"
                      onClick={() => handleLogOut()}
                    />
                  </ButtonGroup>
                </StyledUserBox>
              )}
            </div>
          }
        />
        <DndProvider backend={HTML5Backend}>
          <StyledPanelWrap>
            {separatorXPosition > 0 && <PanelSeparator />}
            {/* FIRST PANEL */}
            <Panel
              width={firstPanelExpanded ? panelWidths[0] : collapsedPanelWidth}
            >
              <Box
                height={heightContent}
                label="Territories"
                isExpanded={firstPanelExpanded}
                button={firstPanelButton()}
                noPadding
              >
                <TerritoryTreeBox />
              </Box>
            </Panel>
            {/* SECOND PANEL */}
            <Panel
              width={
                firstPanelExpanded
                  ? panelWidths[1]
                  : panelWidths[1] + panelWidths[0] - collapsedPanelWidth
              }
            >
              <Box
                height={detailId ? heightContent / 2 : heightContent}
                label="Statements"
              >
                <ScrollHandler />
                <StatementListBox />
              </Box>
              {detailId && (
                <Box
                  height={heightContent / 2}
                  label="Detail"
                  button={
                    detailId && (
                      <Button
                        inverted
                        icon={<IoMdClose />}
                        onClick={() => {
                          setDetailId("");
                        }}
                      />
                    )
                  }
                >
                  <EntityDetailBox />
                </Box>
              )}
            </Panel>
            {/* THIRD PANEL */}
            <Panel
              width={
                fourthPanelExpanded
                  ? panelWidths[2]
                  : panelWidths[2] + panelWidths[3] - collapsedPanelWidth
              }
            >
              <Box height={heightContent} label="Editor">
                <StatementEditorBox />
              </Box>
            </Panel>
            {/* FOURTH PANEL */}
            <Panel
              width={fourthPanelExpanded ? panelWidths[3] : collapsedPanelWidth}
            >
              <Box
                height={heightContent / 2}
                label="Search"
                color="white"
                isExpanded={fourthPanelExpanded}
                button={fourthPanelButton()}
              >
                <ActantSearchBox />
              </Box>
              <Box
                height={heightContent / 2}
                label="Bookmarks"
                color="white"
                isExpanded={fourthPanelExpanded}
                button={fourthPanelButton()}
              >
                <ActantBookmarkBox />
              </Box>
            </Panel>
          </StyledPanelWrap>
          <UserListModal
            isOpen={userAdministrationModalOpen}
            onCloseFn={handleUsersModalCancelClick}
          />
          {user && userCustomizationOpen && (
            <UserCustomizationModal
              user={user}
              onClose={() => setUserCustomizationOpen(false)}
            />
          )}
        </DndProvider>

        <Toast />
        <Footer height={heightFooter} />
        {!isLoggedIn && <LoginModal />}
      </StyledPage>
    </>
  );
};

export default MainPage;
