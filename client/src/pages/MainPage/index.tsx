import React, { useEffect } from "react";
import { connect } from "react-redux";

import { Button, Box } from "components";
import { Statement, TerritoriesTreeProps } from "types";
import {
  fetchStatements,
  fetchStatement,
} from "redux/actions/statementsActions";
import {
  setTreeExpandId,
  setTreeSelectId,
  fetchTerritories,
} from "redux/actions/territoryTreeActions";
import { Tree } from "components/Tree/Tree";
import { territories } from "components/Tree/treeData";

interface MainPage {
  fetchStatements: () => void;
  fetchStatement: (id: string) => void;
  statements: Statement[];
  statement: Statement;
  setTreeExpandId: (id: string) => void;
  setTreeSelectId: (id: string) => void;
  territoriesTreeProps: TerritoriesTreeProps;
  fetchTerritories: () => void;
}

const MainPage: React.FC<MainPage> = ({
  fetchStatement,
  fetchStatements,
  statements,
  statement,
  setTreeExpandId,
  setTreeSelectId,
  territoriesTreeProps,
  fetchTerritories,
}) => {
  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  useEffect(() => {
    // get tree root and set to redux
    if (territories && territories.id && !territoriesTreeProps.expandedTreeId) {
      setTreeExpandId(territories.id);
    }
  }, [territories]);

  return (
    <>
      <Button
        label="log data"
        onClick={() => console.log("statements", statements)}
      />
      <div className="flex mb-4">
        <Box height={750} width={300} label={"Territories"}>
          <Tree
            treeObject={territories}
            onNodeExpand={setTreeExpandId}
            onNodeSelect={setTreeSelectId}
            territoriesTreeProps={territoriesTreeProps}
          />
        </Box>
        <Box height={750} width={800} label={"Statements"}>
          {"Statements"}
        </Box>
      </div>
    </>
  );
};

const mapStateToProps = ({
  statements,
  statement,
  territoriesTreeProps,
}: StateFromProps): StateToProps => ({
  statements,
  statement,
  territoriesTreeProps,
});

export default connect(mapStateToProps, {
  fetchStatements,
  fetchStatement,
  setTreeExpandId,
  setTreeSelectId,
  fetchTerritories,
})(MainPage);

interface StateFromProps {
  statements: Statement[];
  statement: Statement;
  territoriesTreeProps: TerritoriesTreeProps;
}

interface StateToProps {
  statements: Statement[];
  statement: Statement;
  territoriesTreeProps: TerritoriesTreeProps;
}
