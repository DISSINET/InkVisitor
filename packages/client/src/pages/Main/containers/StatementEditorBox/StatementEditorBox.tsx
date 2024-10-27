import { EntityEnums } from "@shared/enums";
import { IResponseStatement, IStatement, IStatementData } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { CustomScrollbar, Loader } from "components";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { toast } from "react-toastify";
import { useAppSelector } from "redux/hooks";
import { StatementEditor } from "./StatementEditor/StatementEditor";
import { StyledEditorEmptyState } from "./StatementEditorBoxStyles";

export const StatementEditorBox: React.FC = () => {
  const { statementId, setStatementId, selectedDetailId, setTerritoryId } =
    useSearchParams();

  const queryClient = useQueryClient();

  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  const userId = localStorage.getItem("userid");
  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    enabled: !!userId && api.isLoggedIn(),
  });

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

  const { data: dataActions, error: errorActions } = useQuery({
    queryKey: ["statement-actions", statementId],
    queryFn: async () => {
      const actionIds = statement?.data.actions.map((a) => a.actionId);
      if (actionIds === undefined) {
        return [];
      }
      const actions = [];
      for (const actionId of actionIds) {
        const res = await api.entitiesGet(actionId);
        actions.push(res.data);
      }
      return actions;
    },
    enabled: statement !== undefined && !!statementId && api.isLoggedIn(),
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
    onSuccess: (data, variables) => {
      if (selectedDetailId === statementId) {
        queryClient.invalidateQueries({ queryKey: ["entity"] });
      }
      queryClient.invalidateQueries({ queryKey: ["statement"] });
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      if (variables.labels[0] !== undefined) {
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
    if (JSON.stringify(statement) !== JSON.stringify(tempObject)) {
      setTempObject(statement);
    }
  }, [statement]);

  const sendChangesToBackend = (changes: IResponseStatement) => {
    if (statement && JSON.stringify(statement) !== JSON.stringify(changes)) {
      const { entities, warnings, right, ...newStatement } = changes;
      updateStatementMutation.mutate(newStatement);
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
    newData: IResponseStatement,
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

  const checkValidActantLanguage = async (
    newData: Partial<IStatementData>
  ): Promise<Partial<IStatementData>> => {
    const oldActants = statement?.data.actants ?? [];

    // check only the actantId that was added
    const newActant = newData.actants?.find((newA, newAI) => {
      //check if the actant is completely new
      if (!newA.entityId) {
        return false;
      }
      if (oldActants[newAI]) {
        return newA.entityId !== oldActants[newAI].entityId;
      } else {
        return true;
      }
    });
    const oldActions = statement?.data.actions ?? [];
    const newAction = newData.actions?.find((newA, newAI) => {
      //check if the actant is completely new
      if (!newA.actionId) {
        return false;
      }
      if (oldActions[newAI]) {
        return newA.actionId !== oldActions[newAI].actionId;
      } else {
        return true;
      }
    });

    if (newActant || newAction) {
      let entity = null;
      if (newActant) {
        entity = await api.entitiesGet(newActant.entityId);
      } else if (newAction) {
        entity = await api.entitiesGet(newAction.actionId);
      }

      if (!entity) {
        return newData;
      } else {
        // check if Actant involvement elvl for normal actants in any role (s, a1, pa...)
        const userLanguage = user?.options.defaultStatementLanguage;
        const entityLanguage = entity.data.language;

        if (userLanguage !== entityLanguage) {
          toast.info(
            `Linked Entity language (${entityLanguage}) does not correspondent with the user statement language (${userLanguage}). Entity involvement epistemic level changed to "inferential".`
          );
          if (newData.actants) {
            newData.actants = newData.actants?.map((actant) => {
              if (actant.entityId === newActant?.entityId) {
                actant.elvl = EntityEnums.Elvl.Inferential;
              }
              return actant;
            });
          }
          if (newData.actions) {
            newData.actions = newData.actions?.map((action) => {
              if (action.actionId === newAction?.actionId) {
                action.elvl = EntityEnums.Elvl.Inferential;
              }
              return action;
            });
          }
        }
      }

      return newData;
    }
    return newData;
  };

  const checkValidActantPosition = async (
    changes: Partial<IStatementData>
  ): Promise<Partial<IStatementData>> => {
    const oldActants = statement?.data.actants ?? [];

    // check only the actantId that was added
    const newActant = changes.actants?.find((newA, newAI) => {
      //check if the actant is completely new
      if (!newA.entityId) {
        return false;
      }
      if (oldActants[newAI]) {
        return newA.entityId !== oldActants[newAI].entityId;
      } else {
        return true;
      }
    });

    if (newActant === undefined) {
      return changes;
    } else {
      const newActantEntity = await api.entitiesGet(newActant.entityId);

      const actantPosition = newActant.position;

      // check what entity types are allowed for actions
      const allowedSTypes = dataActions
        ?.map((action) => {
          return action.data.entities.s;
        })
        .flat();

      const allowedA1Types = dataActions
        ?.map((action) => {
          return action.data.entities.a1;
        })
        .flat();

      const allowedA2Types = dataActions
        ?.map((action) => {
          return action.data.entities.a2;
        })
        .flat();

      const allowedS = allowedSTypes?.includes(newActantEntity.data.class);
      const allowedA1 = allowedA1Types?.includes(newActantEntity.data.class);
      const allowedA2 = allowedA2Types?.includes(newActantEntity.data.class);

      let newPosition: false | EntityEnums.Position = false;

      if (actantPosition === EntityEnums.Position.Subject && !allowedS) {
        if (allowedA1) {
          newPosition = EntityEnums.Position.Actant1;
        } else if (allowedA2) {
          newPosition = EntityEnums.Position.Actant2;
        } else {
          newPosition = EntityEnums.Position.PseudoActant;
        }
      } else if (
        actantPosition === EntityEnums.Position.Actant1 &&
        !allowedA1
      ) {
        if (allowedA2) {
          newPosition = EntityEnums.Position.Actant2;
        } else {
          newPosition = EntityEnums.Position.PseudoActant;
        }
      } else if (
        actantPosition === EntityEnums.Position.Actant2 &&
        !allowedA2
      ) {
        newPosition = EntityEnums.Position.PseudoActant;
      }

      if (newPosition !== false) {
        toast.info(
          `Statement Actions valency rules do not allow Actant position "${actantPosition}" for ${newActantEntity.data.labels[0]}. It was moved to "${newPosition}".`
        );
        newActant.position = newPosition;
      }
      return changes;
    }
  };

  const handleDataAttributeChange = async (
    changes: Partial<IStatementData>,
    instantUpdate?: boolean
  ) => {
    if (tempObject) {
      queryClient.cancelQueries({
        queryKey: ["statement", statementId],
      });

      const validatedData = await checkValidActantPosition(changes);
      const validatedData2 = await checkValidActantLanguage(validatedData);

      const newData: IResponseStatement = {
        ...tempObject,
        data: {
          ...tempObject.data,
          ...validatedData2,
        },
      };
      setTempObject(newData);
      updateChangesAndPendingState(newData, instantUpdate);
    }
  };

  return (
    <>
      {tempObject ? (
        <CustomScrollbar>
          <div onMouseLeave={() => sendChangesToBackend(tempObject)}>
            <StatementEditor
              statement={tempObject}
              updateStatementMutation={updateStatementMutation}
              moveStatementMutation={moveStatementMutation}
              handleAttributeChange={handleAttributeChange}
              handleDataAttributeChange={handleDataAttributeChange}
            />
          </div>
        </CustomScrollbar>
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
