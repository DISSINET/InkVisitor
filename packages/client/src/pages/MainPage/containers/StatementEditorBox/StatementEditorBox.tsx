import api from "api";
import { Loader } from "components";

import { useSearchParams } from "hooks";
import React, { useEffect } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { useQuery, useQueryClient } from "react-query";

import { StatementEditor } from "./StatementEditor/StatementEditor";

import { StyledEditorEmptyState } from "./StatementEditorBoxStyles";

export const StatementEditorBox: React.FC = () => {
  const { statementId, setStatementId } = useSearchParams();

  const queryClient = useQueryClient();

  // Statement query
  const {
    status: statusStatement,
    data: statement,
    error: statementError,
    isFetching: isFetchingStatement,
  } = useQuery(
    ["statement", statementId],
    async () => {
      const res = await api.statementGet(statementId);
      return res.data;
    },
    { enabled: !!statementId && api.isLoggedIn() }
  );

  useEffect(() => {
    if (
      statementError &&
      (statementError as any).error === "StatementDoesNotExits"
    ) {
      setStatementId("");
    }
  }, [statementError]);

  return (
    <>
      {statement ? (
        <StatementEditor statement={statement} />
      ) : (
        <>
          <StyledEditorEmptyState>
            <BsInfoCircle size="23" />
          </StyledEditorEmptyState>
          <StyledEditorEmptyState>
            {"No statement selected yet. Pick one from the statements table"}
          </StyledEditorEmptyState>
        </>
      )}

      <Loader show={isFetchingStatement} />
    </>
  );
};

export const MemoizedStatementEditorBox = React.memo(StatementEditorBox);
