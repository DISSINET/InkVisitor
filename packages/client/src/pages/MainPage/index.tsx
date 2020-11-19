import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAuth0 } from "@auth0/auth0-react";

import { Entities } from "types";

import { Box, Button, Footer, Header } from "components";
import { TerritoryCreateModal } from "pages/MainPage/components/TerritoryCreateModal/TerritoryCreateModal";
import { ResponseTerritoryI, ActantI, StatementI } from "@shared/types";
import { fetchMeta } from "redux/actions/metaActions";
import { fetchTerritory } from "redux/actions/territoryTreeActions";
import { setActiveStatementId } from "redux/actions/statementActions";
import { setAuthToken } from "redux/actions/authActions";
import { TerritoryTree } from "pages/MainPage/TerritoryTree/TerritoryTree";
import { ResponseMetaI } from "@shared/types/response-meta";
import { StatementsTable } from "./StatementsTable/StatementsTable";
import { StatementEditor } from "./StatementEditor/StatementEditor";
import { useHistory, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { createActant } from "api/createActant";

interface MainPage {
  fetchMeta: () => void;
  meta: ResponseMetaI;
  fetchTerritory: (id: string) => void;
  territory: ResponseTerritoryI;
  setActiveStatementId: (id: string) => void;
  activeStatementId: string;
  setAuthToken: (token: string) => void;
  size: number[];
  token: string;
}

const initTerritory = "T40-02-07";

const MainPage: React.FC<MainPage> = ({
  meta,
  fetchMeta,
  fetchTerritory,
  territory,
  setActiveStatementId,
  activeStatementId,
  setAuthToken,
  size,
  token,
}) => {
  const history = useHistory();
  const { territoryId, statementId } = useParams<{
    territoryId: string;
    statementId: string;
  }>();

  const createNewStatement = async () => {
    // wtf?
    const entityClass: "S" = "S";
    const newStatementId = uuidv4();
    const newStatement = {
      id: newStatementId,
      class: entityClass,
      data: {
        label: "",
        action: "A0093",
        territory: territoryId,
        references: [],
        tags: [],
        certainty: "1",
        elvl: "1",
        modality: "1",
        text: "",
        note: "",
        props: [],
        actants: [],
      },
      meta: {},
    };

    const createResponse = await createActant(newStatement);

    if (createResponse && createResponse.id) {
      await fetchTerritory(territoryId);
      await setActiveStatementId(newStatementId);
      history.push(`/${territoryId}/${newStatementId}`);
    }
  };

  // opening and closing modal for creating new territory
  const [createTerritoryModalOpen, setCreateTerritoryModalOpen] = useState(
    false
  );

  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      getAccessTokenSilently().then((token) => {
        setAuthToken(token);
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchMeta();
    }
  }, [fetchMeta, isAuthenticated, token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      if (territoryId) {
        fetchTerritory(territoryId);
      } else {
        fetchTerritory(initTerritory);
        history.push(`/${initTerritory}`);
      }
    }
  }, [fetchTerritory, isAuthenticated, token, territoryId]);

  const heightHeader = 70;
  const heightFooter = 30;
  const heightContent = size[1] - heightHeader - heightFooter;

  const activeStatement = statementId
    ? territory.statements.find((statement) => statement.id === statementId)
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
            {isAuthenticated ? (
              <>
                <div className="text-sm inline m-2">logged as {user.name}</div>
                <Button
                  label="log out"
                  color="danger"
                  onClick={() => logout()}
                />
              </>
            ) : (
              <Button
                label="Log In"
                color="info"
                onClick={() => loginWithRedirect()}
              />
            )}
          </div>
        }
      />
      <DndProvider backend={HTML5Backend}>
        {isAuthenticated && meta ? (
          <div className="flex">
            <TerritoryCreateModal
              meta={meta}
              parentTerritory={territory}
              fetchTerritory={fetchTerritory}
              setCreateTerritoryModalOpen={setCreateTerritoryModalOpen}
              createTerritoryModalOpen={createTerritoryModalOpen}
            />
            <Box height={heightContent} width={200} label={"Territories"}>
              <TerritoryTree
                territory={territory}
                fetchTerritory={fetchTerritory}
                setActiveStatementId={setActiveStatementId}
                setCreateTerritoryModalOpen={() => {
                  setCreateTerritoryModalOpen(true);
                }}
              />
            </Box>
            <Box height={heightContent} width={650} label={"Statements"}>
              <StatementsTable
                statements={territory.statements}
                meta={meta}
                actants={territory.actants}
                activeStatementId={statementId}
                fetchTerritory={fetchTerritory}
                setActiveStatementId={setActiveStatementId}
                createNewStatement={createNewStatement}
              />
            </Box>
            <Box height={heightContent} width={720} label={"Editor"}>
              {activeStatement ? (
                <StatementEditor
                  activeStatement={activeStatement}
                  meta={meta}
                  activeTerritoryActants={territory.actants}
                  setActiveStatementId={setActiveStatementId}
                  fetchTerritory={fetchTerritory}
                />
              ) : (
                <div>no statement selected</div>
              )}
            </Box>
            <div className="flex flex-col">
              <Box height={400} width={350} label={"Search"}></Box>
              <Box
                height={heightContent - 400}
                width={350}
                label={"Bookmarks"}
              ></Box>
            </div>
          </div>
        ) : (
          <div className="p-5">{"Login to continue.."}</div>
        )}
      </DndProvider>
      {isAuthenticated && <Footer height={heightFooter} />}
    </>
  );
};

const mapStateToProps = ({
  meta,
  territory,
  activeStatementId,
  token,
}: StateFromProps): StateToProps => ({
  meta,
  territory,
  activeStatementId,
  token,
});

export default connect(mapStateToProps, {
  fetchMeta,
  fetchTerritory,
  setActiveStatementId,
  setAuthToken,
})(MainPage);

interface StateFromProps {
  meta: ResponseMetaI;
  territory: ResponseTerritoryI;
  activeStatementId: string;
  token: string;
}

interface StateToProps {
  meta: ResponseMetaI;
  territory: ResponseTerritoryI;
  activeStatementId: string;
  token: string;
}
