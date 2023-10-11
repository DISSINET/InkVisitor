import { EntityEnums } from "@shared/enums";
import api from "api";
import { Loader } from "components";
import { useDebounce, useDebouncedFunction, useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatementEditor } from "./StatementEditor/StatementEditor";
import { StyledEditorEmptyState } from "./StatementEditorBoxStyles";
import { IResponseStatement, IStatement } from "@shared/types";

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
          queryClient.invalidateQueries(["detail-tab-entities"]);
        }
        queryClient.invalidateQueries(["statement"]);
        queryClient.invalidateQueries(["territory"]);

        queryClient.invalidateQueries(["statement-templates"]);
        queryClient.invalidateQueries(["entity-templates"]);
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
          queryClient.invalidateQueries(["detail-tab-entities"]);
        }
      },
    }
  );

  const moveStatementMutation = useMutation(
    async (newTerritoryId: string) => {
      await api.entityUpdate(statementId, {
        data: {
          territory: {
            territoryId: newTerritoryId,
            order: EntityEnums.Order.First,
          },
        },
      });
    },
    {
      onSuccess: (data, variables) => {
        setTerritoryId(variables);
        queryClient.invalidateQueries(["statement"]);
        queryClient.invalidateQueries(["tree"]);
        queryClient.invalidateQueries(["territory"]);
      },
    }
  );

  // State to manage your object
  const [tempObject, setTempObject] = useState<IStatement>();

  useEffect(() => {
    setTempObject(statement);
  }, [statement]);

  // const [changesPending, setChangesPending] = useState(false);

  // Function to send changes to the backend
  const sendChangesToBackend = (changes: any) => {
    if (changes) {
      updateStatementMutation.mutate(changes);
      console.log("Sending changes to the backend:", changes);
    }
  };

  const debouncedSendChanges = useDebouncedFunction(sendChangesToBackend, 3000);

  // Function to handle changes to the object
  const handleAttributeChange = (
    attribute: string,
    value: string | boolean
  ) => {
    if (tempObject) {
      setTempObject({
        ...tempObject,
        [attribute]: value,
      });
    }

    debouncedSendChanges(tempObject);
  };

  const handleDataAttributeChange = (attribute: string, value: any) => {
    if (tempObject) {
      setTempObject({
        ...tempObject,
        data: {
          ...tempObject.data,
          [attribute]: value,
        },
      });
    }

    debouncedSendChanges(tempObject);
  };

  return (
    <>
      {statement ? (
        <StatementEditor
          statement={statement}
          updateStatementMutation={updateStatementMutation}
          updateStatementDataMutation={updateStatementDataMutation}
          moveStatementMutation={moveStatementMutation}
          handleAttributeChange={handleAttributeChange}
          handleDataAttributeChange={handleDataAttributeChange}
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
