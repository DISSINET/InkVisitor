import { Order } from "@shared/enums";
import api from "api";
import { Loader } from "components";
import { useSearchParams } from "hooks";
import React, { useEffect } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { StatementEditor } from "./StatementEditor/StatementEditor";
import { StyledEditorEmptyState } from "./StatementEditorBoxStyles";

export const StatementEditorBox: React.FC = () => {
  const { statementId, setStatementId, selectedDetailId, setTerritoryId } =
    useSearchParams();

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

  // MUTATIONS
  const updateStatementMutation = useMutation(
    async (changes: object) => {
      await api.entityUpdate(statementId, changes);
    },
    {
      onSuccess: (data, variables: any) => {
        if (selectedDetailId === statementId) {
          queryClient.invalidateQueries(["entity"]);
        }
        if (statement && statement.isTemplate) {
          queryClient.invalidateQueries(["templates"]);
        }
        if (variables.label !== undefined) {
          queryClient.invalidateQueries("detail-tab-entities");
        }
        queryClient.invalidateQueries(["statement"]);
        queryClient.invalidateQueries(["territory"]);
      },
    }
  );
  const updateStatementDataMutation = useMutation(
    async (changes: object) => {
      await api.entityUpdate(statementId, {
        data: changes,
      });
    },
    {
      onSuccess: (data, variables: any) => {
        queryClient.invalidateQueries(["entity"]);
        queryClient.invalidateQueries(["statement"]);
        queryClient.invalidateQueries(["territory"]);
        if (variables.text !== undefined) {
          queryClient.invalidateQueries("detail-tab-entities");
        }
      },
    }
  );

  const moveStatementMutation = useMutation(
    async (newTerritoryId: string) => {
      await api.entityUpdate(statementId, {
        data: { territory: { id: newTerritoryId, order: Order.First } },
      });
    },
    {
      onSuccess: (data, variables) => {
        setTerritoryId(variables);
        queryClient.invalidateQueries("statement");
        queryClient.invalidateQueries("tree");
        queryClient.invalidateQueries("territory");
      },
    }
  );

  return (
    <>
      {statement ? (
        <StatementEditor
          statement={statement}
          updateStatementMutation={updateStatementMutation}
          updateStatementDataMutation={updateStatementDataMutation}
          moveStatementMutation={moveStatementMutation}
        />
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

      <Loader
        show={
          isFetchingStatement ||
          updateStatementMutation.isLoading ||
          updateStatementDataMutation.isLoading
        }
      />
    </>
  );
};

export const MemoizedStatementEditorBox = React.memo(StatementEditorBox);
