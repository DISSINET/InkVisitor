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
} from "./MainPageStyles";
import { heightFooter, heightHeader } from "Theme/constants";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { setTerritoryTreeBoxExpanded } from "redux/features/territoryTreeBoxExpandedSlice";
import { config, useSpring } from "react-spring";
import { setLastBoxExpanded } from "redux/features/lastBoxExpandedSlice";

interface MainPage {
  size: number[];
}

const MainPage: React.FC<MainPage> = ({ size }) => {
  const isLoggedIn = api.isLoggedIn();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.username);
  const territoryTreeBoxExpanded = useAppSelector(
    (state) => state.territoryTreeBoxExpanded
  );
  const lastBoxExpanded = useAppSelector((state) => state.lastBoxExpanded);
  const queryClient = useQueryClient();

  const history = useHistory();
  const { territoryId, statementId } =
    useParams<{
      territoryId: string;
      statementId: string;
    }>();

  const heightContent = size[1] - heightHeader - heightFooter;

  const animatedTerritoryTreeWidth = useSpring({
    width: territoryTreeBoxExpanded ? 200 : 50,
    config: config.stiff,
  });
  const animatedLastBoxWidth = useSpring({
    width: lastBoxExpanded ? 350 : 50,
    config: config.stiff,
  });

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
          <Box
            height={heightContent}
            animatedWidth={animatedTerritoryTreeWidth}
            label={territoryTreeBoxExpanded ? "Territories" : "T"}
          >
            <StyledButtonWrap>
              <Button
                onClick={() =>
                  territoryTreeBoxExpanded
                    ? dispatch(setTerritoryTreeBoxExpanded(false))
                    : dispatch(setTerritoryTreeBoxExpanded(true))
                }
                inverted
                icon={
                  territoryTreeBoxExpanded ? (
                    <RiMenuFoldFill />
                  ) : (
                    <RiMenuUnfoldFill />
                  )
                }
              />
            </StyledButtonWrap>
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
            <Box
              height={400}
              animatedWidth={animatedLastBoxWidth}
              label={lastBoxExpanded ? "Search" : "S"}
            >
              <ActantSearchBox />
              <StyledButtonWrap>
                <Button
                  onClick={() =>
                    lastBoxExpanded
                      ? dispatch(setLastBoxExpanded(false))
                      : dispatch(setLastBoxExpanded(true))
                  }
                  inverted
                  icon={
                    lastBoxExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />
                  }
                />
              </StyledButtonWrap>
            </Box>
            <Box
              height={heightContent - 400}
              animatedWidth={animatedLastBoxWidth}
              label={lastBoxExpanded ? "Bookmarks" : "B"}
            >
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
