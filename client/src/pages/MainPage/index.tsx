import React, { useEffect } from "react";
import { connect } from "react-redux";

import { Button, Box } from "components";
import { Statement } from "types";
import {
  fetchStatements,
  fetchStatement,
} from "redux/actions/statementsActions";
import {
  setTreeExpandId,
  setTreeSelect,
} from "redux/actions/territoryTreeActions";
import { Tree } from "components/Tree/Tree";
import { territories } from "components/Tree/treeData";

interface MainPage {
  fetchStatements: () => void;
  fetchStatement: (id: string) => void;
  statements: Statement[];
  statement: Statement;
  setTreeExpandId: (id: string) => void;
  setTreeSelect: (id: string) => void;
  expandedTreeId?: string;
  selectedTreeId?: string;
}

const MainPage: React.FC<MainPage> = ({
  fetchStatement,
  fetchStatements,
  statements,
  statement,
  setTreeExpandId,
  setTreeSelect,
  expandedTreeId,
  selectedTreeId,
}) => {
  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);
  useEffect(() => {
    // get tree root and set to redux
    if (territories && territories.id && !expandedTreeId) {
      setTreeExpandId(territories.id);
    }
  }, []);

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
            expandedTreeId={expandedTreeId}
            selectedTreeId={selectedTreeId}
            onNodeExpand={setTreeExpandId}
            onNodeSelect={setTreeSelect}
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
  expandedTreeId,
  selectedTreeId,
}: StateFromProps): StateToProps => ({
  statements,
  statement,
  expandedTreeId,
  selectedTreeId,
});

export default connect(mapStateToProps, {
  fetchStatements,
  fetchStatement,
  setTreeExpandId,
  setTreeSelect,
})(MainPage);

interface StateFromProps {
  statements: Statement[];
  statement: Statement;
  expandedTreeId: string;
  selectedTreeId: string;
}

interface StateToProps {
  statements: Statement[];
  statement: Statement;
  expandedTreeId: string;
  selectedTreeId: string;
}
