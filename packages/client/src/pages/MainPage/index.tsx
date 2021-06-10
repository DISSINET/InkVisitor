import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { toast } from "react-toastify";

import { Box, Button, Footer, Header, Toast } from "components";

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
  StyledBoxWrap,
  StyledUser,
  StyledFaUserAlt,
  StyledText,
  StyledUsername,
  StyledButtonWrap,
  StyledPage,
} from "./MainPageStyles";
import {
  collapsedPanelWidth,
  firstPanelElasticWidth,
  firstPanelWidth,
  fourthPanelElasticWidth,
  fourthPanelWidth,
  heightFooter,
  heightHeader,
  secondPanelElasticWidth,
  secondPanelWidth,
  springConfig,
  thirdPanelElasticWidth,
  thirdPanelWidth,
} from "Theme/constants";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { setFirstPanelExpanded } from "redux/features/firstPanelExpandedSlice";
import { config, useSpring } from "react-spring";
import { setFourthPanelExpanded } from "redux/features/fourthPanelExpandedSlice";

interface MainPage {
  size: number[];
}

const MainPage: React.FC<MainPage> = ({ size }) => {
  const isLoggedIn = api.isLoggedIn();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.username);
  const firstPanelExpanded = useAppSelector(
    (state) => state.firstPanelExpanded
  );
  const fourthPanelExpanded = useAppSelector(
    (state) => state.fourthPanelExpanded
  );
  const queryClient = useQueryClient();

  const history = useHistory();
  const { territoryId, statementId } =
    useParams<{
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
          <StyledBoxWrap>
            {/* FIRST PANEL */}
            <Box
              height={heightContent}
              width={firstPanelExpanded ? firstPanelWidth : collapsedPanelWidth}
              label="Territories"
              isExpanded={firstPanelExpanded}
              button={firstPanelButton()}
            >
              <TerritoryTreeBox />
            </Box>
            {/* SECOND PANEL */}
            <div>
              <Box
                height={400}
                width={
                  firstPanelExpanded
                    ? secondPanelWidth
                    : secondPanelWidth + firstPanelWidth - collapsedPanelWidth
                }
                label="Statements"
              >
                <StatementListBox />
              </Box>
              <Box
                height={heightContent - 400}
                width={
                  firstPanelExpanded
                    ? secondPanelWidth
                    : secondPanelWidth + firstPanelWidth - collapsedPanelWidth
                }
                label="Detail"
              >
                <ActantDetailBox />
              </Box>
            </div>
            {/* THIRD PANEL */}
            <div>
              <Box
                height={heightContent}
                width={
                  fourthPanelExpanded
                    ? thirdPanelWidth
                    : thirdPanelWidth + fourthPanelWidth - collapsedPanelWidth
                }
                label="Editor"
              >
                <StatementEditorBox />
              </Box>
            </div>
            {/* FOURTH PANEL */}
            <div>
              <Box
                height={400}
                width={
                  fourthPanelExpanded ? fourthPanelWidth : collapsedPanelWidth
                }
                label="Search"
                isExpanded={fourthPanelExpanded}
                button={fourthPanelButton()}
              >
                <ActantSearchBox />
              </Box>
              <Box
                height={heightContent - 400}
                width={
                  fourthPanelExpanded ? fourthPanelWidth : collapsedPanelWidth
                }
                label="Bookmarks"
                isExpanded={fourthPanelExpanded}
                button={fourthPanelButton()}
              >
                <ActantBookmarkBox />
              </Box>
            </div>
          </StyledBoxWrap>
        </DndProvider>

        <Toast />
        <Footer height={heightFooter} />
        {!isLoggedIn && <LoginModal />}
      </StyledPage>
    </>
  );
};

export default MainPage;
