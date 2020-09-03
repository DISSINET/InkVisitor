import React, { useEffect } from "react";
import { connect } from "react-redux";

import { Button, Box } from "components";
import { TerritoriesTreeProps } from "types";
import { ResponseTerritoryI } from "@shared/types/response-territory";
import { fetchMeta } from "redux/actions/metaActions";
import { fetchTerritory } from "redux/actions/territoryTreeActions";
import { Tree } from "components/Tree/Tree";
// import { territories } from "components/Tree/treeData";
import { ResponseMetaI } from "@shared/types/response-meta";

interface MainPage {
  fetchMeta: () => void;
  fetchTerritory: (id: string) => void;
  meta: ResponseMetaI;
  territory: ResponseTerritoryI;
  setTreeExpandId: (id: string) => void;
  setTreeSelectId: (id: string) => void;
  territoriesTreeProps: TerritoriesTreeProps;
}

const MainPage: React.FC<MainPage> = ({
  fetchTerritory,
  fetchMeta,
  meta,
  territory,
  setTreeExpandId,
  setTreeSelectId,
  territoriesTreeProps,
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
      {/* <Button
        label="log data"
        onClick={() => console.log("statements", statements)}
      /> */}
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
  territoriesTreeProps,
}: StateFromProps): StateToProps => ({
  meta,
  territory,
  territoriesTreeProps,
});

export default connect(mapStateToProps, {
  fetchMeta,
  fetchTerritory,
  setTreeExpandId,
  setTreeSelectId,
})(MainPage);

interface StateFromProps {
  meta: ResponseMetaI;
  territory: ResponseTerritoryI;
  territoriesTreeProps: TerritoriesTreeProps;
}

interface StateToProps {
  meta: ResponseMetaI;
  territory: ResponseTerritoryI;
  territoriesTreeProps: TerritoriesTreeProps;
}
