import { UserEnums } from "@shared/enums";
import {
  IAction,
  IEntity,
  IResponseAudit,
  IResponseGeneric,
  IResponseStatement,
  IStatement,
} from "@shared/types";
import { AxiosResponse } from "axios";
import { Button, ButtonGroup, Checkbox, TagGroup } from "components";
import { EntityTag } from "components/advanced";
import update from "immutability-helper";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BsArrowDown, BsArrowUp } from "react-icons/bs";
import {
  FaChevronCircleDown,
  FaChevronCircleUp,
  FaClone,
  FaPlus,
  FaTrashAlt,
} from "react-icons/fa";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { UseMutationResult } from "react-query";
import {
  Cell,
  Column,
  Row,
  useExpanded,
  useRowSelect,
  useTable,
} from "react-table";
import { setRowsExpanded } from "redux/features/statementList/rowsExpandedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { StatementListContextMenu } from "../StatementListContextMenu/StatementListContextMenu";
import { StyledText } from "../StatementLitBoxStyles";
import { StatementListRow } from "./StatementListRow";
import { StyledTable, StyledTh, StyledTHead } from "./StatementListTableStyles";

interface StatementListTable {
  statements: IResponseStatement[];
  handleRowClick?: (rowId: string) => void;
  actantsUpdateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      statementId: string;
      data: {};
    },
    unknown
  >;
  entities: { [key: string]: IEntity };
  right: UserEnums.RoleMode;
  audits: IResponseAudit[];

  duplicateStatement: (statementToDuplicate: IResponseStatement) => void;
  setStatementToDelete: React.Dispatch<
    React.SetStateAction<IStatement | undefined>
  >;
  setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  addStatementAtCertainIndex: (index: number) => Promise<void>;

  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
}
export const StatementListTable: React.FC<StatementListTable> = ({
  statements,
  handleRowClick = () => {},
  actantsUpdateMutation,
  entities,
  right,
  audits,

  duplicateStatement,
  setStatementToDelete,
  setShowSubmit,
  addStatementAtCertainIndex,

  selectedRows,
  setSelectedRows,
}) => {
  const dispatch = useAppDispatch();
  const rowsExpanded: { [key: string]: boolean } = useAppSelector(
    (state) => state.statementList.rowsExpanded
  );

  const [statementsLocal, setStatementsLocal] = useState<IResponseStatement[]>(
    []
  );

  useEffect(() => {
    setStatementsLocal(statements);
  }, [statements]);

  const getRowId = useCallback((row): string => {
    return row.id;
  }, []);

  const handleRowSelect = (rowId: string) => {
    if (selectedRows.includes(rowId)) {
      setSelectedRows(
        selectedRows.filter((selectedRow) => selectedRow !== rowId)
      );
    } else {
      setSelectedRows([...selectedRows, rowId]);
    }
  };

  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        id: "selection",
        Cell: ({ row }: Cell) => {
          const size = 18;
          const checked = selectedRows.includes(row.id);

          return checked ? (
            <MdOutlineCheckBox
              size={size}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                handleRowSelect(row.id);
              }}
            />
          ) : (
            <MdOutlineCheckBoxOutlineBlank
              size={size}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                handleRowSelect(row.id);
              }}
            />
          );
        },
      },
      {
        id: "move",
        Cell: ({ row }: Cell) => {
          return false;
        },
      },
      {
        Header: "",
        id: "Statement",
        Cell: ({ row }: Cell) => {
          const statement = row.original as IStatement;
          return (
            <EntityTag
              entity={statement as IEntity}
              showOnly="entity"
              tooltipText={statement.data.text}
            />
          );
        },
      },
      {
        Header: "Subj.",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const subjectIds: string[] = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position === "s")
                .map((a: any) => a.entityId)
            : [];
          const subjectObjects = subjectIds.map(
            (actantId: string) => entities[actantId]
          );
          const definedSubjects = subjectObjects.filter((s) => s !== undefined);

          return (
            <>
              {definedSubjects ? (
                <TagGroup definedEntities={definedSubjects} />
              ) : (
                <div />
              )}
            </>
          );
        },
      },
      {
        Header: "Actions",
        Cell: ({ row }: Cell) => {
          const actionIds = row.values.data?.actions
            ? row.values.data.actions.map((a: any) => a.actionId)
            : [];
          const actionObjects: IAction[] = actionIds.map(
            (actionId: string) => entities[actionId]
          );
          const definedActions = actionObjects.filter((a) => a !== undefined);

          return (
            <>
              {definedActions ? (
                <TagGroup definedEntities={definedActions} />
              ) : (
                <div />
              )}
            </>
          );
        },
      },
      {
        Header: "Objects",
        Cell: ({ row }: Cell) => {
          const actantIds = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position !== "s")
                .map((a: any) => a.entityId)
            : [];
          const actantObjects: IEntity[] = actantIds.map(
            (actantId: string) => entities[actantId]
          );
          const definedObjects = actantObjects.filter((o) => o !== undefined);

          return (
            <>
              {definedObjects ? (
                <TagGroup definedEntities={definedObjects} oversizeLimit={4} />
              ) : (
                <div />
              )}
            </>
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
        id: "lastEdit",
        Header: "Edited",
        Cell: ({ row }: Cell) => {
          return false;
        },
      },
      {
        Header: "",
        id: "expander",
        width: 300,
        Cell: ({ row }: Cell) => {
          return (
            <ButtonGroup>
              {right !== UserEnums.RoleMode.Read && (
                <StatementListContextMenu
                  buttons={[
                    <Button
                      key="r"
                      icon={<FaTrashAlt size={14} />}
                      color="danger"
                      tooltipLabel="delete"
                      onClick={() => {
                        setStatementToDelete(
                          row.original as IResponseStatement
                        );
                        setShowSubmit(true);
                      }}
                    />,
                    <Button
                      key="d"
                      icon={<FaClone size={14} />}
                      color="warning"
                      tooltipLabel="duplicate"
                      onClick={() => {
                        duplicateStatement(row.original as IResponseStatement);
                      }}
                    />,
                    <Button
                      key="add-up"
                      icon={
                        <>
                          <FaPlus size={14} />
                          <BsArrowUp size={14} />
                        </>
                      }
                      tooltipLabel="add new statement before"
                      color="info"
                      onClick={() => {
                        addStatementAtCertainIndex(row.index);
                      }}
                    />,
                    <Button
                      key="add-down"
                      icon={
                        <>
                          <FaPlus size={14} />
                          <BsArrowDown size={14} />
                        </>
                      }
                      tooltipLabel="add new statement after"
                      color="success"
                      onClick={() => {
                        addStatementAtCertainIndex(row.index + 1);
                      }}
                    />,
                  ]}
                />
              )}
              <span
                {...row.getToggleRowExpandedProps()}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  const newObject = {
                    ...rowsExpanded,
                    [row.values.id]: !rowsExpanded[row.values.id],
                  };
                  dispatch(setRowsExpanded(newObject));
                }}
              >
                {rowsExpanded[row.values.id] ? (
                  <FaChevronCircleUp />
                ) : (
                  <FaChevronCircleDown />
                )}
              </span>
            </ButtonGroup>
          );
        },
      },
    ];
  }, [statementsLocal, rowsExpanded, right, selectedRows]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
    selectedFlatRows,
    state: { selectedRowIds },
  } = useTable(
    {
      columns,
      data: statementsLocal,
      getRowId,
      initialState: {
        hiddenColumns: ["id"],
      },
    },
    useExpanded,
    useRowSelect
  );

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRecord = statementsLocal[dragIndex];
      setStatementsLocal(
        update(statementsLocal, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRecord],
          ],
        })
      );
    },
    [statementsLocal]
  );

  const moveEndRow = async (statementToMove: IStatement, index: number) => {
    if (statementToMove.data.territory && statements[index].data.territory) {
      const { order: thisOrder, territoryId } = statementToMove.data.territory;

      if (thisOrder !== statements[index].data.territory?.order) {
        let allOrders: number[] = statements.map((s) =>
          s.data.territory ? s.data.territory.order : 0
        );
        allOrders.sort((a, b) => (a && b ? (a > b ? 1 : -1) : 0));

        allOrders = allOrders.filter((o) => o !== thisOrder);
        allOrders.splice(index, 0, thisOrder);

        if (index === 0) {
          allOrders[index] = allOrders[1] - 1;
        } else if (index === allOrders.length - 1) {
          allOrders[index] = allOrders[index - 1] + 1;
        } else {
          allOrders[index] = (allOrders[index - 1] + allOrders[index + 1]) / 2;
        }

        actantsUpdateMutation.mutate({
          statementId: statementToMove.id,
          data: {
            territory: {
              territoryId: territoryId,
              order: allOrders[index],
            },
          },
        });
      }
    }
  };

  return (
    <StyledTable {...getTableProps()}>
      <StyledTHead>
        {headerGroups.map((headerGroup, key) => (
          <tr {...headerGroup.getHeaderGroupProps()} key={key}>
            {headerGroup.headers.map((column, key) =>
              key < 6 ? (
                <StyledTh {...column.getHeaderProps()} key={key}>
                  {column.render("Header")}
                </StyledTh>
              ) : (
                <th key={key}></th>
              )
            )}
          </tr>
        ))}
      </StyledTHead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row: Row, i: number) => {
          prepareRow(row);
          return (
            <StatementListRow
              index={i}
              handleClick={handleRowClick}
              row={row}
              moveRow={moveRow}
              moveEndRow={moveEndRow}
              visibleColumns={visibleColumns}
              entities={entities}
              audits={audits}
              isSelected={selectedRows.includes(row.id)}
              {...row.getRowProps()}
            />
          );
        })}
      </tbody>
    </StyledTable>
  );
};
