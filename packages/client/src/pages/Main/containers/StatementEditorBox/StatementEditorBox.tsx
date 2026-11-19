import { EntityEnums } from "@inkvisitor/shared/enums";
import { IResponseStatement, IStatement, IStatementData } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { CustomScrollbar, Loader } from "components";
import { useSearchParams } from "hooks";
import { invalidateAllExplorerQueries } from "pages/Query/useQueryData";
import { STATEMENT_EDITOR_SCROLLER_ID } from "Theme/constants";
import React, { useEffect, useRef, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { toast } from "react-toastify";
import { StatementEditor } from "./StatementEditor/StatementEditor";
import { StyledEditorEmptyState } from "./StatementEditorBoxStyles";
import { computeDifferences } from "utils/utils";
import { DETAIL_TAB_ENTITIES_KEY, useStatementQuery, useUserQuery } from "hooks/react-query";

// a toast names the first few rows and counts the rest, so appending a long
// batch of rows keeps it a few lines tall
const TOAST_NAMES_LIMIT = 5;
const listNames = (names: string[]) =>
  names.length > TOAST_NAMES_LIMIT
    ? `${names.slice(0, TOAST_NAMES_LIMIT).join(", ")} and ${names.length - TOAST_NAMES_LIMIT} more`
    : names.join(", ");

interface StatementEditorBox {
  // the panel holding the box is expanded
  isExpanded: boolean;
  // the box is on screen rather than minimized
  isVisible: boolean;
}
export const StatementEditorBox: React.FC<StatementEditorBox> = ({ isExpanded, isVisible }) => {
  const { statementId, setStatementId, selectedDetailId, setTerritoryId } = useSearchParams();

  const queryClient = useQueryClient();

  const { data: user } = useUserQuery();

  // Statement query
  const {
    data: statement,
    error: statementError,
    isFetching: isFetchingStatement,
  } = useStatementQuery(statementId);

  useEffect(() => {
    if (statementError && (statementError as any).error === "StatementDoesNotExits") {
      setStatementId("");
    }
  }, [statementError]);

  // MUTATIONS
  const updateStatementMutation = useMutation({
    mutationFn: async (changes: Partial<IStatement>) => {
      await api.entityUpdate(statementId, changes);
    },
    onSuccess: (data, variables) => {
      // if (selectedDetailId === statementId ) {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      // }
      queryClient.invalidateQueries({ queryKey: ["statement"] });
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      queryClient.invalidateQueries({ queryKey: ["audit", statementId] });

      if (variables.labels?.[0] !== undefined) {
        queryClient.invalidateQueries({ queryKey: [DETAIL_TAB_ENTITIES_KEY] });
      }
      if (statement && statement.isTemplate) {
        queryClient.invalidateQueries({ queryKey: ["templates"] });
      }
      const entityAttributeChanged =
        variables.detail !== undefined ||
        variables.status !== undefined ||
        variables.language !== undefined;
      if (entityAttributeChanged) {
        queryClient.invalidateQueries({ queryKey: ["suggestion"] });
        queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      }
      if (entityAttributeChanged || variables.props !== undefined) {
        invalidateAllExplorerQueries(queryClient);
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
  // read after awaits, where the tempObject of the calling render may be outdated
  const tempObjectRef = useRef(tempObject);
  tempObjectRef.current = tempObject;
  const [lastSentData, setLastSentData] = useState<string>("");

  useEffect(() => {
    if (JSON.stringify(statement) !== JSON.stringify(tempObject)) {
      setTempObject(statement);
      // Reset last sent data when statement changes
      setLastSentData("");
    }
  }, [statement]);

  const sendChangesToBackend = (changes: IResponseStatement) => {
    if (statement && JSON.stringify(statement) !== JSON.stringify(changes)) {
      // Remove response-specific fields
      const { entities, warnings, right, ...cleanChanges } = changes;

      // Compute only the differences between original statement and current changes
      const differences = computeDifferences(statement, cleanChanges);

      // Create a hash of the differences to check for duplicates
      const differencesHash = JSON.stringify(differences);

      // Only send if there are actual differences and we haven't sent this exact change before
      if (Object.keys(differences).length > 0 && differencesHash !== lastSentData) {
        updateStatementMutation.mutate(differences);
        setLastSentData(differencesHash);
        setChangesPending(false);
      }
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

  const updateChangesAndPendingState = (newData: IResponseStatement, instantUpdate?: boolean) => {
    if (instantUpdate) {
      sendChangesToBackend(newData);
      setChangesPending(false);
    } else {
      setChangesPending(true);
    }
  };

  const handleAttributeChange = (changes: Partial<IStatement>, instantUpdate?: boolean) => {
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
    const latest = tempObjectRef.current ?? statement;
    // a row is newly linked when it is new or holds another entity than before;
    // rows are matched by id, as removing a row shifts the rows below it
    const oldActantEntityIds = new Map(latest?.data.actants.map((a) => [a.id, a.entityId]));
    const linkedActants =
      newData.actants?.filter((a) => a.entityId && oldActantEntityIds.get(a.id) !== a.entityId) ??
      [];
    const oldActionEntityIds = new Map(latest?.data.actions.map((a) => [a.id, a.actionId]));
    const linkedActions =
      newData.actions?.filter((a) => a.actionId && oldActionEntityIds.get(a.id) !== a.actionId) ??
      [];

    const linkedEntityIds = [
      ...new Set([
        ...linkedActants.map((a) => a.entityId),
        ...linkedActions.map((a) => a.actionId),
      ]),
    ];
    if (!linkedEntityIds.length) {
      return newData;
    }

    const userLanguage = user?.options.defaultStatementLanguage;
    const { data: entities } = await api.entitiesSearch({ entityIds: linkedEntityIds });
    const otherLanguage = new Map(
      entities.filter((e) => e.language !== userLanguage).map((e) => [e.id, e]),
    );
    if (!otherLanguage.size) {
      return newData;
    }

    const changedActantIds = new Set(
      linkedActants.filter((a) => otherLanguage.has(a.entityId)).map((a) => a.id),
    );
    const changedActionIds = new Set(
      linkedActions.filter((a) => otherLanguage.has(a.actionId)).map((a) => a.id),
    );
    const entityList = listNames(
      [...otherLanguage.values()].map((e) => `${e.labels[0]} (${e.language})`),
    );
    toast.info(
      `Linked entity language does not correspond with the user statement language (${userLanguage}). Entity involvement epistemic level changed to "inferential" for ${entityList}.`
    );
    return {
      ...newData,
      ...(newData.actants && {
        actants: newData.actants.map((a) =>
          changedActantIds.has(a.id) ? { ...a, elvl: EntityEnums.Elvl.Inferential } : a,
        ),
      }),
      ...(newData.actions && {
        actions: newData.actions.map((a) =>
          changedActionIds.has(a.id) ? { ...a, elvl: EntityEnums.Elvl.Inferential } : a,
        ),
      }),
    };
  };

  const checkValidActantPosition = async (
    changes: Partial<IStatementData>
  ): Promise<Partial<IStatementData>> => {
    const oldActantIds = new Set(
      (tempObjectRef.current ?? statement)?.data.actants.map((a) => a.id) ?? []
    );

    // only a newly added actant row gets its position from the action valency;
    // linking another entity into an existing row keeps the position chosen there
    const newActants = changes.actants?.filter((a) => a.entityId && !oldActantIds.has(a.id)) ?? [];
    const actionIds = statement?.data.actions.map((a) => a.actionId).filter((a) => a) ?? [];

    // do not check if there are no valid actions
    if (!newActants.length || !actionIds.length) {
      return changes;
    }

    const { data: entities } = await api.entitiesSearch({
      entityIds: [...new Set([...newActants.map((a) => a.entityId), ...actionIds])],
    });
    const actionEntities = entities.filter((e) => e.class === EntityEnums.Class.Action);

    // check what entity types are allowed for given actions
    const allowedSTypes = actionEntities.flatMap((action) => action.data.entities.s);
    const allowedA1Types = actionEntities.flatMap((action) => action.data.entities.a1);
    const allowedA2Types = actionEntities.flatMap((action) => action.data.entities.a2);

    const newPositions = new Map<string, EntityEnums.Position>();
    const changedLabels: string[] = [];
    for (const actant of newActants) {
      const entity = entities.find((e) => e.id === actant.entityId);
      // if actant entity is not found, do not change anything
      if (!entity || allowedSTypes.includes(entity.class)) {
        continue;
      }
      const position = allowedA1Types.includes(entity.class)
        ? EntityEnums.Position.Actant1
        : allowedA2Types.includes(entity.class)
          ? EntityEnums.Position.Actant2
          : EntityEnums.Position.PseudoActant;
      newPositions.set(actant.id, position);
      changedLabels.push(`${entity.labels[0]} to "${position}"`);
    }
    if (!newPositions.size) {
      return changes;
    }

    toast.info(
      `Actant position changes based on the allowed action valency constraints: ${listNames(changedLabels)}.`
    );
    return {
      ...changes,
      actants: changes.actants?.map((a) =>
        newPositions.has(a.id) ? { ...a, position: newPositions.get(a.id)! } : a,
      ),
    };
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

      const latestTempObject = tempObjectRef.current ?? tempObject;
      const newData: IResponseStatement = {
        ...latestTempObject,
        data: {
          ...latestTempObject.data,
          ...validatedData2,
        },
      };
      tempObjectRef.current = newData;
      setTempObject(newData);
      updateChangesAndPendingState(newData, instantUpdate);
    }
  };

  // delay of show content for fluent animation on open
  const [showEditor, setShowEditor] = useState(true);

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        setShowEditor(true);
      }, 500);
    } else {
      setShowEditor(false);
    }
  }, [isExpanded]);

  return (
    <>
      {showEditor && (
        <>
          {tempObject && isExpanded ? (
            <CustomScrollbar id={STATEMENT_EDITOR_SCROLLER_ID}>
              <div
                onMouseLeave={() => {
                  if (changesPending && tempObject) {
                    sendChangesToBackend(tempObject);
                  }
                }}
              >
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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "6.8rem",
                padding: "2rem",
                paddingTop: "0",
              }}
            >
              <StyledEditorEmptyState>
                <BsInfoCircle size="23" />
              </StyledEditorEmptyState>
              <StyledEditorEmptyState>
                {"No statement selected yet. Pick one from the statements table"}
              </StyledEditorEmptyState>
            </div>
          )}
        </>
      )}

      <Loader
        show={
          isVisible &&
          (isFetchingStatement || updateStatementMutation.isPending || (isExpanded && !showEditor))
        }
      />
    </>
  );
};

export const MemoizedStatementEditorBox = React.memo(StatementEditorBox);
