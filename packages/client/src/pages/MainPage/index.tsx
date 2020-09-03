import React, { useEffect } from "react";
import { connect } from "react-redux";

import { Button, Box } from "components";
import { ResponseTerritoryI } from "@shared/types/response-territory";
import { fetchMeta } from "redux/actions/metaActions";
import { fetchTerritory } from "redux/actions/territoryTreeActions";
import { setActiveStatementId } from "redux/actions/statementActions";
import { Tree } from "components/Tree/Tree";
import { ResponseMetaI } from "@shared/types/response-meta";

interface MainPage {
  fetchMeta: () => void;
  fetchTerritory: (id: string) => void;
  meta: ResponseMetaI;
  territory: ResponseTerritoryI;
  setActiveStatementId: (id: string) => void;
  activeStatementId: string;
}

const MainPage: React.FC<MainPage> = ({
  fetchTerritory,
  fetchMeta,
  meta,
  territory,
  setActiveStatementId,
}) => {
  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);
  useEffect(() => {
    fetchTerritory("T3-1");
  }, [fetchTerritory]);

  // useEffect(() => {
  //   if (territories && territories.id && !territoriesTreeProps.expandedTreeId) {
  //     setTreeExpandId(territories.id);
  //   }
  // }, [territories]);

  return (
    <>
      <Button
        label="set ID"
        onClick={() => setActiveStatementId("423dasd-asd2312")}
      />
      <div className="flex mb-4">
        <Box height={750} width={300} label={"Territories"}>
          {/* <Tree
            treeObject={territories}
            onNodeExpand={setTreeExpandId}
            onNodeSelect={setTreeSelectId}
            territoriesTreeProps={territoriesTreeProps}
          /> */}
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
