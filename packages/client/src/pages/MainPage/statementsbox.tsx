import React, { useEffect, useMemo } from "react";
import { connect } from "react-redux";

import { Button, Box, StatementsTable } from "components";
import { Statement } from "types";

interface MainPageStatementBoxProps {
  statements: Statement[];
}

export const MainPageStatementBox: React.FC<MainPageStatementBoxProps> = ({
  statements,
}) => {
  const data = useMemo(() => statements, [statements]);

  return (
    <div>
      <StatementsTable statements={data} />
      {console.log("statement box ")}
    </div>
  );
};
/*
 */
