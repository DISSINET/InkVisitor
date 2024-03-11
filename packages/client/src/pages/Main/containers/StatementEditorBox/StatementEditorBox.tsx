import { EntityEnums } from "@shared/enums";
import { IResponseStatement, IStatement, IStatementData } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Loader } from "components";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { StatementEditor } from "./StatementEditor/StatementEditor";
import { StyledEditorEmptyState } from "./StatementEditorBoxStyles";
import { toast } from "react-toastify";

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
  } = useQuery({
    queryKey: ["statement", statementId],
    queryFn: async () => {
      const res = await api.statementGet(statementId);
      return res.data;
    },
    enabled: !!statementId && api.isLoggedIn(),
  });

  useEffect(() => {
    if (
      statementError &&
      (statementError as any).error === "StatementDoesNotExits"
    ) {
      setStatementId("");
    }
  }, [statementError]);

  // MUTATIONS
  const updateStatementMutation = useMutation({
    mutationFn: async (changes: IStatement) => {
      await api.entityUpdate(statementId, changes);
    },
    onSuccess: (data, variables: any) => {
      if (selectedDetailId === statementId) {
        queryClient.invalidateQueries({ queryKey: ["entity"] });
      }
      queryClient.invalidateQueries({ queryKey: ["statement"] });
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      if (variables.label !== undefined) {
        queryClient.invalidateQueries({ queryKey: ["detail-tab-entities"] });
      }
      if (statement && statement.isTemplate) {
        queryClient.invalidateQueries({ queryKey: ["templates"] });
        queryClient.invalidateQueries({ queryKey: ["entity-templates"] });
      }
    },
    onError: (err, newTodo, context) => {
      toast.error("Statement not updated");
    },
  });

  const moveStatementMutation = useMutation({
    mutationFn: async (newTerritoryId: string) => {
      await api.entityUpdate(statementId, {
        data: {
          territory: {
            territoryId: newTerritoryId,
            order: EntityEnums.Order.First,
          },
        },
      });
    },
    onSuccess: (data, variables) => {
      setTerritoryId(variables);
      queryClient.invalidateQueries({ queryKey: ["statement"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      queryClient.invalidateQueries({ queryKey: ["territory"] });
    },
  });

  const [tempObject, setTempObject] = useState<IResponseStatement>();

  useEffect(() => {
    setTempObject(statement);
  }, [statement]);

  const sendChangesToBackend = (changes: IStatement) => {
    if (JSON.stringify(statement) !== JSON.stringify(changes)) {
      updateStatementMutation.mutate(changes);
    }
  };

  const [changesPending, setChangesPending] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (changesPending && tempObject) {
        sendChangesToBackend(tempObject);
        setChangesPending(false);
      }
    }, 3000);

    return () => clearTimeout(timerId);
  }, [tempObject, changesPending]);

  const updateChangesAndPendingState = (
    newData: IStatement,
    instantUpdate?: boolean
  ) => {
    if (instantUpdate) {
      sendChangesToBackend(newData);
      setChangesPending(false);
    } else {
      setChangesPending(true);
    }
  };

  const handleAttributeChange = (
    changes: Partial<IStatement>,
    instantUpdate?: boolean
  ) => {
    if (tempObject) {
      queryClient.cancelQueries({
        queryKey: ["statement", statementId],
      });
      const newData = {
        ...tempObject,
        ...changes,
      };
      setTempObject(newData);
      updateChangesAndPendingState(newData, instantUpdate);
    }
  };

  const handleDataAttributeChange = (
    changes: Partial<IStatementData>,
    instantUpdate?: boolean
  ) => {
    if (tempObject) {
      queryClient.cancelQueries({
        queryKey: ["statement", statementId],
      });
      const newData = {
        ...tempObject,
        data: {
          ...tempObject.data,
          ...changes,
        },
      };
      setTempObject(newData);
      updateChangesAndPendingState(newData, instantUpdate);
    }
  };

  return (
    <>
      {tempObject ? (
        <div
          onMouseLeave={() => sendChangesToBackend(tempObject)}
          style={{ marginBottom: "4rem" }}
        >
          <StatementEditor
            statement={tempObject}
            updateStatementMutation={updateStatementMutation}
            moveStatementMutation={moveStatementMutation}
            handleAttributeChange={handleAttributeChange}
            handleDataAttributeChange={handleDataAttributeChange}
          />
        </div>
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

      <Loader show={isFetchingStatement || updateStatementMutation.isPending} />
    </>
  );
};

export const MemoizedStatementEditorBox = React.memo(StatementEditorBox);
