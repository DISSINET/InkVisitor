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
  UserAdministrationModal,
  UserOptionsModal,
} from "./containers";
import { useHistory, useParams } from "react-router-dom";
import api from "api";

interface MainPage {
  size: number[];
}

const MainPage: React.FC<MainPage> = ({ size }) => {
  const isLoggedIn = api.isLoggedIn();
  const history = useHistory();
  const { territoryId, statementId } = useParams<{
    territoryId: string;
    statementId: string;
  }>();

  const heightHeader = 70;
  const heightFooter = 30;
  const heightContent = size[1] - heightHeader - heightFooter;

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
              <>
                <div>logged as {localStorage.getItem("username")}</div>
                <Button
                  label="Log Out"
                  color="danger"
                  onClick={() => api.signOut()}
                />
              </>
            )}
          </div>
        }
      />
      <DndProvider backend={HTML5Backend}>
        <div style={{ display: "flex" }}>
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
        </div>
      </DndProvider>

      <Toast />
      <Footer height={heightFooter} />
      <UserAdministrationModal />
    </>
  );
};

export default MainPage;
