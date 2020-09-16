import React, { useEffect } from "react";
import { connect } from "react-redux";

import { Box } from "components";
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
}

const MainPage: React.FC<MainPage> = ({
  meta,
  fetchMeta,
  fetchTerritory,
  territory,
  setActiveStatementId,
  activeStatementId,
}) => {
  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchTerritory("T3-1");
  }, [fetchTerritory]);

  return (
    <>
      <div className="flex mb-4">
        <Box height={750} width={350} label={"Territories"}>
          <Tree
            territory={territory}
            fetchTerritory={fetchTerritory}
            setActiveStatementId={setActiveStatementId}
          />
        </Box>
        <Box height={750} width={800} label={"Statements"}>
          <StatementsTable
            statements={territory.statements}
            actions={meta.actions}
            actants={territory.actants}
            activeStatementId={activeStatementId}
            setActiveStatementId={setActiveStatementId}
          />
        </Box>
        <Box height={750} width={800} label={"Editor"}>
          <StatementEditor
            statement={
              activeStatementId
                ? territory.statements.find(
                    (statement) => statement.id === activeStatementId
                  )
                : undefined
            }
            meta={meta}
            actants={territory.actants}
          />
        </Box>
      </div>
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
