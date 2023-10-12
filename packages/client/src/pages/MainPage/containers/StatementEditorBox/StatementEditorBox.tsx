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

  const [tempObject, setTempObject] = useState<IResponseStatement>();

  useEffect(() => {
    setTempObject(statement);
  }, [statement]);

  const sendChangesToBackend = (changes: IStatement) => {
    // TODO: comparsion not working
    // if (JSON.stringify(statement) !== JSON.stringify(changes)) {
    updateStatementMutation.mutate(changes);
    console.log("Sending changes to the backend:", changes);
    // }
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

  const handleAttributeChange = (
    changes: Partial<IStatement>,
    instantUpdate?: boolean
  ) => {
    if (tempObject) {
      const newData = {
        ...tempObject,
        ...changes,
      };
      setTempObject(newData);

      if (instantUpdate) {
        sendChangesToBackend(tempObject);
        setChangesPending(false);
      } else {
        setChangesPending(true);
      }
    }
  };

  const handleDataAttributeChange = (
    changes: Partial<IStatementData>,
    instantUpdate?: boolean
  ) => {
    if (tempObject) {
      const newData = {
        ...tempObject,
        data: {
          ...tempObject.data,
          ...changes,
        },
      };
      setTempObject(newData);

      if (instantUpdate) {
        sendChangesToBackend(newData);
        setChangesPending(false);
      } else {
        setChangesPending(true);
      }
    }
  };

  return (
    <>
      {tempObject ? (
        <StatementEditor
          statement={tempObject}
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
