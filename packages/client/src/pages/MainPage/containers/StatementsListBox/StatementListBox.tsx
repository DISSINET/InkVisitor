import React, { useEffect, useMemo, useRef, useState } from "react";
import { Cell, Column } from "react-table";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  FaInfo,
  FaTrashAlt,
  FaPlus,
  FaRegCircle,
  FaDotCircle,
  FaClone,
  FaEdit,
} from "react-icons/fa";
import { toast } from "react-toastify";

import {
  Button,
  ButtonGroup,
  Loader,
  Submit,
  TagGroup,
  Tooltip,
} from "components";
import { ActantTag } from "./../";
import api from "api";
import { IStatement, IActant, IAction, IStatementAction } from "@shared/types";
import { StatementListTable } from "./StatementListTable/StatementListTable";
import { StatementListHeader } from "./StatementListHeader/StatementListHeader";
import {
  StyledDots,
  StyledSelectorCell,
  StyledActionLabel,
  StyledText,
} from "./StatementLitBoxStyles";
import { CStatement, DStatement } from "constructors";
import { useSearchParams } from "hooks";
import { StatementListContextMenu } from "./StatementListContextMenu/StatementListContextMenu";
import { BsCaretDown, BsCaretUp } from "react-icons/bs";

const initialData: {
  statements: IStatement[];
  actants: IActant[];
  label: string;
} = {
  statements: [],
  actants: [],
  label: "",
};

export const StatementListBox: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    territory: territoryId,
    setTerritory: setTerritoryId,
    statement: statementId,
    setStatement: setStatementId,
  } = useSearchParams();

  const [showSubmit, setShowSubmit] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<IStatement>();

  const { status, data, error, isFetching } = useQuery(
    ["territory", "statement-list", territoryId],
    async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    {
      initialData: initialData,
      enabled: !!territoryId && api.isLoggedIn(),
      retry: 2,
    }
  );

  const {
    status: statusStatement,
    data: statement,
    error: errorStatement,
    isFetching: isFetchingStatement,
  } = useQuery(
    ["statement", statementId],
    async () => {
      const res = await api.statementGet(statementId);
      return res.data;
    },
    { enabled: !!statementId && api.isLoggedIn(), retry: 2 }
  );

  useEffect(() => {
    if (statement && !territoryId) {
      setTerritoryId(statement.data.territory.id);
    }
  }, [statement, territoryId]);

  useEffect(() => {
    if (error && (error as any).error === "TerritoryDoesNotExits") {
      setTerritoryId("");
    }
  }, [error]);

  const removeStatementMutation = useMutation(
    async (sId: string) => {
      await api.actantsDelete(sId);
    },
    {
      onSuccess: () => {
        toast.info(`Statement removed!`);
        setStatementId("");
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("tree");
      },
    }
  );

  const duplicateStatementMutation = useMutation(
    async (statementToDuplicate: IStatement) => {
      const duplicatedStatement = DStatement(statementToDuplicate);
      await api.actantsCreate(duplicatedStatement);
    },
    {
      onSuccess: (data, variables) => {
        setStatementId(variables.id);
        toast.info(`Statement duplicated!`);
        queryClient.invalidateQueries("territory");
      },
    }
  );

  const addStatementAtTheEndMutation = useMutation(
    async (newStatement: IStatement) => {
      await api.actantsCreate(newStatement);
    },
    {
      onSuccess: (data, variables) => {
        setStatementId(variables.id);
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("tree");
      },
    }
  );

  const actantsCreateMutation = useMutation(
    async (newStatement: IStatement) => await api.actantsCreate(newStatement),
    {
      onSuccess: (data, variables) => {
        toast.info(`Statement created!`);
        queryClient.invalidateQueries([
          "territory",
          "statement-list",
          territoryId,
        ]);
        setStatementId(variables.id);
        queryClient.invalidateQueries("tree");
      },
      onError: () => {
        toast.error(`Error: Statement not created!`);
      },
    }
  );

  const addStatementAtCertainIndex = async (index: number) => {
    let newOrder =
      index === 0
        ? statements[0].data.territory.order - 1
        : (statements[index - 1].data.territory.order +
            statements[index].data.territory.order) /
          2;

    const newStatement: IStatement = CStatement(territoryId);
    newStatement.data.territory.order = newOrder;

    actantsCreateMutation.mutate(newStatement);
  };

  const { statements, actants } = data || initialData;

  const moveEndRow = async (statementToMove: IStatement, index: number) => {
    // return if order don't change
    if (
      statementToMove.data.territory.order ===
      statements[index].data.territory.order
    ) {
      return;
    }

    // whether row is moving top-bottom direction
    const topDown =
      statementToMove.data.territory.order <
      statements[index].data.territory.order;

    const thisOrder = statementToMove.data.territory.order;
    let allOrders = statements.map((s) => s.data.territory.order);
    allOrders.sort((a, b) => (a > b ? 1 : -1));
    const thisIndex = allOrders.indexOf(thisOrder);

    allOrders = allOrders.filter((o) => o !== thisOrder);
    allOrders.splice(index, 0, thisOrder);

    if (index === 0) {
      allOrders[index] = allOrders[1] - 1;
    } else if (index === allOrders.length - 1) {
      allOrders[index] = allOrders[index - 1] + 1;
    } else {
      allOrders[index] = (allOrders[index - 1] + allOrders[index + 1]) / 2;
    }

    const res = await api.actantsUpdate(statementToMove.id, {
      data: {
        territory: {
          id: statementToMove.data.territory.id,
          order: allOrders[index],
        },
      },
    });
    queryClient.invalidateQueries("territory");
  };

  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        Header: "Subj.",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const subjectIds = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position === "s")
                .map((a: any) => a.actant)
            : [];

          const isOversized = subjectIds.length > 2;
          const subjectIdsSlice = subjectIds.slice(0, 2);

          return (
            <TagGroup>
              {subjectIdsSlice
                .filter((a: any) => a)
                .map((actantId: string, ai: number) => {
                  const subjectObject =
                    actants && actants.find((a) => a.id === actantId);

                  return (
                    subjectObject && (
                      <ActantTag key={ai} actant={subjectObject} short />
                    )
                  );
                })}
              {isOversized && <StyledDots>{"..."}</StyledDots>}
            </TagGroup>
          );
        },
      },
      {
        Header: "S",
        Cell: ({ row }: Cell) => {
          const statement = row.original;
          console.log(statement);
          return <ActantTag actant={statement as IActant} short />;
        },
      },
      {
        Header: "Actions",
        Cell: ({ row }: Cell) => {
          const {
            actions,
            actants,
          }: {
            actions: IStatementAction[];
            actants: IActant[];
          } = row.values.data;
          // TODO: get right actants to filter
          // const actants = row.values.actants;
          const filteredActions: (IActant | undefined)[] = actions.map(
            (sAction: IStatementAction) => {
              // console.log(sAction.action);
              // return actants.find((a: IActant) => a.id === sAction.action);
              return actants.find((a: IActant) => a.id === sAction.action);
            }
          );

          // const isOversized = filteredActions.length > 2;
          // const subjectIdsSlice = filteredActions.slice(0, 2);

          return (
            <>
              {filteredActions?.map(
                (action: IActant | undefined, key: number) => (
                  <React.Fragment key={key}>
                    {action && <ActantTag key={key} short actant={action} />}
                  </React.Fragment>
                )
              )}
            </>
          );
        },
      },

      {
        Header: "Obj.",
        Cell: ({ row }: Cell) => {
          const actantIds = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position !== "s")
                .map((a: any) => a.actant)
            : [];
          const isOversized = actantIds.length > 4;
          const actantIdsSlice = actantIds.slice(0, 4);

          return (
            <TagGroup>
              {actantIdsSlice
                .filter((a: any) => a)
                .map((actantId: string, ai: number) => {
                  const actantObject =
                    actants && actants.find((a) => a && a.id === actantId);

                  return (
                    actantObject && (
                      <ActantTag key={ai} actant={actantObject} short />
                    )
                  );
                })}
              {isOversized && <StyledDots>{"..."}</StyledDots>}
            </TagGroup>
          );
        },
      },
      {
        Header: "Text",
        Cell: ({ row }: Cell) => {
          const { text } = row.values.data;
          const maxWordsCount = 20;
          const trimmedText = text.split(" ").slice(0, maxWordsCount).join(" ");
          if (text?.match(/(\w+)/g)?.length > maxWordsCount) {
            return <StyledText>{trimmedText}...</StyledText>;
          }
          return <StyledText>{trimmedText}</StyledText>;
        },
      },
      {
        Header: "",
        id: "expander",
        width: 300,
        Cell: ({ row }: Cell) => (
          <ButtonGroup>
            <StatementListContextMenu
              inverted={statementId === row.values.id}
              buttons={[
                <Button
                  key="d"
                  icon={<FaClone size={14} />}
                  color="info"
                  tooltip="duplicate"
                  onClick={() => {
                    duplicateStatementMutation.mutate(
                      row.original as IStatement
                    );
                  }}
                />,
                <Button
                  key="r"
                  icon={<FaTrashAlt size={14} />}
                  color="danger"
                  tooltip="delete"
                  onClick={() => {
                    setStatementToDelete(row.original as IStatement);
                    setShowSubmit(true);
                  }}
                />,
                <Button
                  key="add"
                  icon={<FaPlus size={14} />}
                  tooltip="add new statement before"
                  color="warning"
                  onClick={() => addStatementAtCertainIndex(row.index + 1)}
                />,
              ]}
            />
            <span {...row.getToggleRowExpandedProps()}>
              <Button
                key="i"
                icon={
                  row.isExpanded ? (
                    <BsCaretUp size={14} />
                  ) : (
                    <BsCaretDown size={14} />
                  )
                }
                tooltip="info"
                color="info"
                onClick={() => (row.isExpanded = !row.isExpanded)}
              />
            </span>
            <Button
              icon={<FaEdit size={14} />}
              color="warning"
              tooltip="edit statement"
              onClick={() => {
                selectStatementRow(row.values.id);
              }}
            />
          </ButtonGroup>
        ),
      },
    ];
  }, [data, statementId]);

  const selectStatementRow = (rowId: string) => {
    setStatementId(rowId);
  };

  statements.sort((a, b) =>
    a.data.territory.order > b.data.territory.order ? 1 : -1
  );

  return (
    <>
      <StatementListHeader
        data={data ? data : initialData}
        addStatementAtTheEndMutation={addStatementAtTheEndMutation}
      />
      <StatementListTable
        moveEndRow={moveEndRow}
        data={statements}
        columns={columns}
        handleRowClick={(rowId: string) => {
          // selectStatementRow(rowId)
        }}
      />
      <Submit
        title="Delete statement"
        text={`Do you really want to delete statement [${
          statementToDelete?.label
            ? statementToDelete.label
            : statementToDelete?.id
        }]?`}
        show={showSubmit}
        onCancel={() => {
          setShowSubmit(false);
          setStatementToDelete(undefined);
        }}
        onSubmit={() => {
          if (statementToDelete) {
            removeStatementMutation.mutate(statementToDelete.id);
            setShowSubmit(false);
            setStatementToDelete(undefined);
          }
        }}
        loading={removeStatementMutation.isLoading}
      />
      <Loader
        show={
          isFetching ||
          removeStatementMutation.isLoading ||
          duplicateStatementMutation.isLoading ||
          addStatementAtTheEndMutation.isLoading ||
          actantsCreateMutation.isLoading
        }
      />
    </>
  );
};
