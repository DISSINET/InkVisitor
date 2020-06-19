import React, { useEffect } from "react";
import { connect } from "react-redux";

import { Button } from "components";
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
    <div>
      <h1>app almost works</h1>
      <Button
        label="log data"
        onClick={() => console.log("statements", statements)}
      />
    </div>
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
