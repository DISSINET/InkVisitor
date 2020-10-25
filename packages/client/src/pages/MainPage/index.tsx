import React, { useEffect } from "react";
import { connect } from "react-redux";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAuth0 } from "@auth0/auth0-react";

import { Box, Button, Header } from "components";
import { ResponseTerritoryI } from "@shared/types/response-territory";
import { fetchMeta } from "redux/actions/metaActions";
import { fetchTerritory } from "redux/actions/territoryTreeActions";
import { setActiveStatementId } from "redux/actions/statementActions";
import { Tree } from "pages/MainPage/Containers/Tree/Tree";
import { ResponseMetaI } from "@shared/types/response-meta";
import { StatementsTable } from "./Containers/StatementsTable/StatementsTable";
import { StatementEditor } from "./Containers/StatementEditor/StatementEditor";

interface MainPage {
  fetchMeta: () => void;
  meta: ResponseMetaI;
  fetchTerritory: (id: string) => void;
  territory: ResponseTerritoryI;
  setActiveStatementId: (id: string) => void;
  activeStatementId: string;
  size: number[];
}

const initTerritory = "T40-02-07";

const MainPage: React.FC<MainPage> = ({
  meta,
  fetchMeta,
  fetchTerritory,
  territory,
  setActiveStatementId,
  activeStatementId,
  size,
}) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
  } = useAuth0();

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchTerritory(initTerritory);
    setActiveStatementId("T40-02-00-004");
  }, [fetchTerritory]);

  const heightHeader = 70;
  const heightFooter = 40;
  const heightContent = size[1] - heightHeader - heightFooter;

  const activeStatement = activeStatementId
    ? territory.statements.find(
        (statement) => statement.id === activeStatementId
      )
    : undefined;

  return (
    <>
      <Header
        height={heightHeader}
        paddingY={0}
        paddingX={10}
        left={<div className="text-4xl">InkVisitor</div>}
        right={
          <div className="inline">
            {!isAuthenticated && (
              <Button
                label="Log In"
                color="info"
                onClick={() => loginWithRedirect()}
              />
            )}
            {isAuthenticated && (
              <>
                <div className="text-sm inline m-2">logged as {user.name}</div>
                <Button
                  label="log out"
                  color="danger"
                  onClick={() => logout()}
                />
              </>
            )}
          </div>
        }
      />
      <DndProvider backend={HTML5Backend}>
        {isAuthenticated ? (
          <div className="flex">
            <Box height={heightContent} width={200} label={"Territories"}>
              <Tree
                territory={territory}
                fetchTerritory={fetchTerritory}
                setActiveStatementId={setActiveStatementId}
              />
            </Box>
            <Box height={heightContent} width={500} label={"Statements"}>
              <StatementsTable
                statements={territory.statements}
                meta={meta}
                actants={territory.actants}
                activeStatementId={activeStatementId}
                fetchTerritory={fetchTerritory}
                setActiveStatementId={setActiveStatementId}
              />
            </Box>
            <Box height={heightContent} width={720} label={"Editor"}>
              {activeStatement ? (
                <StatementEditor
                  activeStatement={activeStatement}
                  meta={meta}
                  actants={territory.actants}
                  setActiveStatementId={setActiveStatementId}
                  fetchTerritory={fetchTerritory}
                />
              ) : null}
            </Box>
            <div className="flex flex-col">
              <Box height={400} width={300} label={"Search"}></Box>
              <Box
                height={heightContent - 400}
                width={300}
                label={"Bookmarks"}
              ></Box>
            </div>
          </div>
        ) : (
          <div className="p-5">{"Login to continue.."}</div>
        )}
      </DndProvider>
      {/* footer */}
      {/* <Header height={heightFooter} paddingY={0} paddingX={10} color="grey" /> */}
    </>
  );
};

const mapStateToProps = ({
  meta,
  territory,
  activeStatementId,
}: StateFromProps): StateToProps => ({
  meta,
  territory,
  activeStatementId,
});

export default connect(mapStateToProps, {
  fetchMeta,
  fetchTerritory,
  setActiveStatementId,
})(MainPage);

interface StateFromProps {
  meta: ResponseMetaI;
  territory: ResponseTerritoryI;
  activeStatementId: string;
}

interface StateToProps {
  meta: ResponseMetaI;
  territory: ResponseTerritoryI;
  activeStatementId: string;
}
