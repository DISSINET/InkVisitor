import React, { useEffect } from "react";
import { connect } from "react-redux";

import { Button, Box } from "components";
import { Statement } from "types";
import { fetchStatements } from "redux/actions/statementsActions";
import { fetchStatement } from "redux/actions/statementActions";

interface MainPage {
  statements: Statement[];
  statement: Statement;
  fetchStatements: () => void;
  fetchStatement: (id: string) => void;
}

const MainPage: React.FC<MainPage> = ({
  fetchStatement,
  fetchStatements,
  statements,
  statement,
}) => {
  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  return (
    <>
      <Button
        label="log data"
        onClick={() => console.log("statements", statements)}
      />
      <div className="flex mb-4">
        <Box height={750} width={300} label={"Territories"}>
          {"Territories"}
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
}: StateFromProps): StateToProps => ({
  statements,
  statement,
});

export default connect(mapStateToProps, {
  fetchStatements,
  fetchStatement,
})(MainPage);

interface StateFromProps {
  statements: Statement[];
  statement: Statement;
}

interface StateToProps {
  statements: Statement[];
  statement: Statement;
}
