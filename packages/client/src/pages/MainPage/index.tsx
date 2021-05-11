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
} from "./MainPageStyles";
import { heightFooter, heightHeader } from "Theme/constants";

interface MainPage {
  size: number[];
}

const MainPage: React.FC<MainPage> = ({ size }) => {
  const isLoggedIn = api.isLoggedIn();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.username);
  const queryClient = useQueryClient();

  const history = useHistory();
  const { territoryId, statementId } = useParams<{
    territoryId: string;
    statementId: string;
  }>();

  const heightContent = size[1] - heightHeader - heightFooter;

  const handleLogOut = () => {
    api.signOut();
    dispatch(setUsername(""));
    dispatch(setAuthToken(""));
    toast.success("You've been successfully logged out!");
    queryClient.removeQueries();
  };
  return (
    <>
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
          <Box height={heightContent} width={200} label="Territories">
            <TerritoryTreeBox />
          </Box>
          <div>
            <Box height={400} width={570} label="Statements">
              <StatementListBox />
            </Box>
            <Box height={heightContent - 400} width={570} label="Detail">
              <ActantDetailBox />
            </Box>
          </div>
          <div>
            <Box height={heightContent} width={800} label="Editor">
              <StatementEditorBox />
            </Box>
          </div>
          <div>
            <Box height={400} width={350} label="Search">
              <ActantSearchBox />
            </Box>
            <Box height={heightContent - 400} width={350} label="Bookmarks">
              <ActantBookmarkBox />
            </Box>
          </div>
        </StyledBoxWrap>
      </DndProvider>

      <Toast />
      <Footer height={heightFooter} />
      {!isLoggedIn && <LoginModal />}
    </>
  );
};

export default MainPage;
