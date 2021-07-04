import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { toast } from "react-toastify";

import {
  Box,
  Button,
  Footer,
  Header,
  Panel,
  PanelSeparator,
  Toast,
} from "components";

import {
  ActantSearchBox,
  ActantDetailBox,
  ActantSuggester,
  ActionModal,
  ActantBookmarkBox,
  StatementEditorBox,
  StatementListBox,
  TerritoryTreeBox,
  UserOptionsModal,
  LoginModal,
} from "./containers";
import { useHistory, useParams } from "react-router-dom";
import api from "api";
import { useQueryClient } from "react-query";
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
  StyledButtonWrap,
  StyledPage,
} from "./MainPageStyles";
import {
  collapsedPanelWidth,
  heightFooter,
  heightHeader,
} from "Theme/constants";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { setFirstPanelExpanded } from "redux/features/layout/firstPanelExpandedSlice";
import { setFourthPanelExpanded } from "redux/features/layout/fourthPanelExpandedSlice";

interface MainPage {
  size: number[];
}

const MainPage: React.FC<MainPage> = ({ size }) => {
  const isLoggedIn = api.isLoggedIn();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.username);
  const firstPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.firstPanelExpanded
  );
  const fourthPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.fourthPanelExpanded
  );
  const panelWidths: number[] = useAppSelector(
    (state) => state.layout.panelWidths
  );
  const queryClient = useQueryClient();

  const history = useHistory();
  const { territoryId, statementId } = useParams<{
    territoryId: string;
    statementId: string;
  }>();

  const handleLogOut = () => {
    api.signOut();
    dispatch(setUsername(""));
    dispatch(setAuthToken(""));
    toast.success("You've been successfully logged out!");
    queryClient.removeQueries();
  };

  const heightContent = size[1] - heightHeader - heightFooter;

  const firstPanelButton = () => (
    <StyledButtonWrap>
      <Button
        onClick={() =>
          firstPanelExpanded
            ? dispatch(setFirstPanelExpanded(false))
            : dispatch(setFirstPanelExpanded(true))
        }
        inverted
        icon={firstPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
      />
    </StyledButtonWrap>
  );
  const fourthPanelButton = () => (
    <StyledButtonWrap>
      <Button
        onClick={() =>
          fourthPanelExpanded
            ? dispatch(setFourthPanelExpanded(false))
            : dispatch(setFourthPanelExpanded(true))
        }
        inverted
        icon={fourthPanelExpanded ? <RiMenuUnfoldFill /> : <RiMenuFoldFill />}
      />
    </StyledButtonWrap>
  );

  return (
    <>
      <StyledPage>
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
                  <Button
                    label="Log Out"
                    color="danger"
                    onClick={() => handleLogOut()}
                  />
                </StyledUserBox>
              )}
            </div>
          }
        />
        <DndProvider backend={HTML5Backend}>
          <StyledPanelWrap>
            {/* <PanelSeparator xPosition={panelWidths[0] + panelWidths[1]} /> */}
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
              <Box height={400} label="Statements">
                <StatementListBox />
              </Box>
              <Box height={heightContent - 400} label="Detail">
                <ActantDetailBox />
              </Box>
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
      </StyledPage>
    </>
  );
};

export default MainPage;
