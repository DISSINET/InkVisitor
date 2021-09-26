import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "react-toastify";
import { useQueryClient } from "react-query";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { IoMdClose } from "react-icons/io";

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

import {
  ActantSearchBox,
  ActantDetailBox,
  ActantBookmarkBox,
  StatementEditorBox,
  StatementListBox,
  TerritoryTreeBox,
  UserOptionsModal,
  UserListModal,
  LoginModal,
} from "./containers";

import api from "api";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setAuthToken } from "redux/features/authTokenSlice";
import { setUsername } from "redux/features/usernameSlice";
import {
  StyledUserBox,
  StyledPanelWrap,
  StyledUser,
  StyledFaUserAlt,
  StyledText,
  StyledUsername,
  StyledPage,
} from "./MainPageStyles";
import {
  collapsedPanelWidth,
  heightFooter,
  heightHeader,
  layoutWidthBreakpoint,
} from "Theme/constants";
import { setFirstPanelExpanded } from "redux/features/layout/firstPanelExpandedSlice";
import { setFourthPanelExpanded } from "redux/features/layout/fourthPanelExpandedSlice";
import { useSearchParams } from "hooks";
import ScrollHandler from "hooks/ScrollHandler";

interface MainPage {
  size: number[];
}

const MainPage: React.FC<MainPage> = ({ size }) => {
  const { actantId, setActantId } = useSearchParams();

  const isLoggedIn = api.isLoggedIn();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.username);
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
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleLogOut = () => {
    api.signOut();
    dispatch(setUsername(""));
    dispatch(setAuthToken(""));
    toast.success("You've been successfully logged out!");
    queryClient.removeQueries();
  };

  const handleUsersModalClic = () => {
    setModalOpen(true);
  };

  const handleUsersModalCancelClick = () => {
    setModalOpen(false);
  };

  const heightContent = size[1] - heightHeader - heightFooter;

  const firstPanelButton = () => (
    <Button
      onClick={() =>
        firstPanelExpanded
          ? dispatch(setFirstPanelExpanded(false))
          : dispatch(setFirstPanelExpanded(true))
      }
      inverted
      icon={firstPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
    />
  );
  const fourthPanelButton = () => (
    <Button
      onClick={() =>
        fourthPanelExpanded
          ? dispatch(setFourthPanelExpanded(false))
          : dispatch(setFourthPanelExpanded(true))
      }
      inverted
      icon={fourthPanelExpanded ? <RiMenuUnfoldFill /> : <RiMenuFoldFill />}
    />
  );

  return (
    <>
      <StyledPage layoutWidth={layoutWidth}>
        <Header
          height={heightHeader}
          paddingY={0}
          paddingX={10}
          left={<div>InkVisitor</div>}
          right={
            <div>
              {isLoggedIn && (
                <StyledUserBox>
                  <StyledUser>
                    <StyledText>logged as</StyledText>
                    <StyledFaUserAlt size={14} />
                    <StyledUsername>{username}</StyledUsername>
                  </StyledUser>
                  <ButtonGroup>
                    {
                      //TODO make condition based on user role
                      username == "admin" && (
                        <Button
                          label="Manage Users"
                          color="info"
                          onClick={() => handleUsersModalClic()}
                        />
                      )
                    }
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
            {separatorXPosition > 0 &&
              window.innerWidth > layoutWidthBreakpoint && <PanelSeparator />}
            {/* FIRST PANEL */}
            <Panel
              width={firstPanelExpanded ? panelWidths[0] : collapsedPanelWidth}
            >
              <Box
                height={heightContent}
                label="Territories"
                isExpanded={firstPanelExpanded}
                button={firstPanelButton()}
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
              <Box height={actantId ? 400 : heightContent} label="Statements">
                <ScrollHandler />
                <StatementListBox />
              </Box>
              {actantId && (
                <Box
                  height={heightContent - 400}
                  label="Detail"
                  button={
                    actantId && (
                      <Button
                        icon={<IoMdClose />}
                        onClick={() => {
                          setActantId("");
                        }}
                      />
                    )
                  }
                >
                  <ActantDetailBox />
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
              <Box height={heightContent} label="Editor" noPadding={false}>
                <StatementEditorBox />
              </Box>
            </Panel>
            {/* FOURTH PANEL */}
            <Panel
              width={fourthPanelExpanded ? panelWidths[3] : collapsedPanelWidth}
            >
              <Box
                height={400}
                label="Search"
                isExpanded={fourthPanelExpanded}
                button={fourthPanelButton()}
              >
                <ActantSearchBox />
              </Box>
              <Box
                height={heightContent - 400}
                label="Bookmarks"
                isExpanded={fourthPanelExpanded}
                button={fourthPanelButton()}
              >
                <ActantBookmarkBox />
              </Box>
            </Panel>
          </StyledPanelWrap>
        </DndProvider>

        <Toast />
        <Footer height={heightFooter} />
        {!isLoggedIn && <LoginModal />}
        <UserListModal
          isOpen={modalOpen}
          handler={handleUsersModalCancelClick}
        />
      </StyledPage>
    </>
  );
};

export default MainPage;
