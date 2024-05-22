import { UserEnums } from "@shared/enums";
import {
  IEntity,
  IResponseGeneric,
  IResponseStatement,
  IStatement,
} from "@shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { Button, ButtonGroup, TagGroup } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
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
import { TiWarningOutline } from "react-icons/ti";
import {
  CellProps,
  Column,
  useExpanded,
  useRowSelect,
  useTable,
} from "react-table";
import { setShowWarnings } from "redux/features/statementEditor/showWarningsSlice";
import { setLastClickedIndex } from "redux/features/statementList/lastClickedIndexSlice";
import { setRowsExpanded } from "redux/features/statementList/rowsExpandedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { StatementListContextMenu } from "../StatementListContextMenu/StatementListContextMenu";
import { StatementListRow } from "./StatementListRow";
import {
  StyledAbbreviatedLabel,
  StyledCheckboxWrapper,
  StyledFocusedCircle,
  StyledTHead,
  StyledTable,
  StyledTdLastEdit,
  StyledTh,
} from "./StatementListTableStyles";
import { StatementListDisplayMode } from "types";

type CellType = CellProps<IResponseStatement>;

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

  cloneStatementMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>>,
    unknown,
    string,
    unknown
  >;
  setStatementToDelete: React.Dispatch<
    React.SetStateAction<IStatement | undefined>
  >;
  setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  addStatementAtCertainIndex: (index: number) => Promise<void>;

  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
  displayMode: StatementListDisplayMode;
  contentWidth: number;
}
export const StatementListTable: React.FC<StatementListTable> = ({
  statements,
  handleRowClick = () => {},
  actantsUpdateMutation,
  entities,
  right,

  cloneStatementMutation,
  setStatementToDelete,
  setShowSubmit,
  addStatementAtCertainIndex,

  selectedRows,
  setSelectedRows,
  displayMode,
  contentWidth,
}) => {
  const dispatch = useAppDispatch();
  const { territoryId, setStatementId } = useSearchParams();
  const rowsExpanded: { [key: string]: boolean } = useAppSelector(
    (state) => state.statementList.rowsExpanded
  );
  const lastClickedIndex: number = useAppSelector(
    (state) => state.statementList.lastClickedIndex
  );

  const [statementsLocal, setStatementsLocal] = useState<IResponseStatement[]>(
    []
  );

  useEffect(() => {
    dispatch(setLastClickedIndex(-1));
  }, [territoryId]);

  useEffect(() => {
    setStatementsLocal(statements);
  }, [statements]);

  const getRowId = useCallback((row: IResponseStatement): string => {
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

  const handleSelection = (
    lastClickedIndex: number,
    rowIndex: number
  ): string[] => {
    let selectedStatements: IResponseStatement[] = [];
    if (lastClickedIndex < rowIndex) {
      selectedStatements = statementsLocal.slice(
        lastClickedIndex,
        rowIndex + 1
      );
    } else {
      // is bigger than - oposite direction of selection
      selectedStatements = statementsLocal.slice(
        rowIndex,
        lastClickedIndex + 1
      );
    }
    return selectedStatements.map((statement) => statement.id);
  };

  const columns = useMemo<Column<IResponseStatement>[]>(
    () => [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        id: "selection",
        Cell: ({ row }: CellType) => {
          const size = 18;
          const checked = selectedRows.includes(row.id);
          const isFocused = lastClickedIndex === row.index;

          return (
            <StyledCheckboxWrapper>
              {isFocused && <StyledFocusedCircle checked={checked} />}
              {checked ? (
                <MdOutlineCheckBox
                  size={size}
                  style={{ zIndex: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      e.shiftKey &&
                      lastClickedIndex !== -1 &&
                      lastClickedIndex !== row.index
                    ) {
                      // unset all between
                      const mappedIds = handleSelection(
                        lastClickedIndex,
                        row.index
                      );
                      const filteredIds = selectedRows.filter(
                        (id) => !mappedIds.includes(id)
                      );
                      setSelectedRows(filteredIds);
                    } else {
                      handleRowSelect(row.id);
                    }
                    dispatch(setLastClickedIndex(row.index));
                  }}
                />
              ) : (
                <MdOutlineCheckBoxOutlineBlank
                  size={size}
                  style={{ zIndex: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      e.shiftKey &&
                      lastClickedIndex !== -1 &&
                      lastClickedIndex !== row.index
                    ) {
                      // set all between
                      const mappedIds = handleSelection(
                        lastClickedIndex,
                        row.index
                      );
                      setSelectedRows([
                        ...new Set(selectedRows.concat(mappedIds)),
                      ]);
                    } else {
                      handleRowSelect(row.id);
                    }
                    dispatch(setLastClickedIndex(row.index));
                  }}
                />
              )}
            </StyledCheckboxWrapper>
          );
        },
      },
      {
        id: "move",
        Cell: ({ row }: CellType) => {
          return false;
        },
      },
      {
        id: "statement",
        Header: "",
        Cell: ({ row }: CellType) => {
          const statement = row.original;
          return <EntityTag entity={statement as IEntity} showOnly="entity" />;
        },
      },
      {
        id: "subject",
        Header: "Subj.",
        Cell: ({ row }: CellType) => {
          const subjectIds: string[] = row.original.data?.actants
            ? row.original.data.actants
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
        id: "actions",
        Header: "Actions",
        Cell: ({ row }: CellType) => {
          const actionIds = row.original.data?.actions
            ? row.original.data.actions.map((a) => a.actionId)
            : [];
          const actionObjects = actionIds.map(
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
        id: "objects",
        Header: "Objects",
        Cell: ({ row }: CellType) => {
          const actantIds = row.original.data?.actants
            ? row.original.data.actants
                .filter((a) => a.position !== "s")
                .map((a) => a.entityId)
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
        id: "text",
        Header: "Text",
        accessor: "data",
        Cell: ({ row }: CellType) => {
          const { text } = row.original.data;
          return <StyledAbbreviatedLabel>{text}</StyledAbbreviatedLabel>;
        },
      },
      {
        id: "warnings",
        Header: "Warn.",
        Cell: ({ row }: CellType) => {
          const { warnings } = row.original;

          return (
            <>
              {warnings.length > 0 && (
                <Button
                  icon={<TiWarningOutline size={20} />}
                  label={warnings.length.toString()}
                  color="warning"
                  inverted
                  noBorder
                  noBackground
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatementId(row.id);
                    dispatch(setShowWarnings(true));
                  }}
                />
              )}
            </>
          );
        },
      },
      {
        id: "lastEdit",
        Header: "Edited",
        Cell: ({ row }: CellType) => {
          const { updatedAt, createdAt } = row.original;
          const lastEditDate: Date | undefined = updatedAt || createdAt;
          if (!lastEditDate) {
            return "";
          }
          const today = new Date().setHours(0, 0, 0, 0);
          const lastEditDay = new Date(lastEditDate).setHours(0, 0, 0, 0);

          if (today === lastEditDay) {
            return (
              <StyledTdLastEdit>
                {"today " +
                  new Date(lastEditDate).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </StyledTdLastEdit>
            );
          } else {
            return (
              <StyledTdLastEdit>
                {new Date(lastEditDate).toLocaleDateString("en-GB")}
              </StyledTdLastEdit>
            );
          }
        },
      },
      {
        Header: "",
        id: "expander",
        width: 300,
        Cell: ({ row }: CellType) => {
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
                        setStatementToDelete(row.original);
                        setShowSubmit(true);
                      }}
                    />,
                    <Button
                      key="d"
                      icon={<FaClone size={14} />}
                      color="warning"
                      tooltipLabel="duplicate"
                      onClick={() => {
                        cloneStatementMutation.mutate(row.original.id);
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
                    [row.original.id]: !rowsExpanded[row.original.id],
                  };
                  dispatch(setRowsExpanded(newObject));
                }}
              >
                {rowsExpanded[row.original.id] ? (
                  <FaChevronCircleUp />
                ) : (
                  <FaChevronCircleDown />
                )}
              </span>
            </ButtonGroup>
          );
        },
      },
    ],
    [statementsLocal, rowsExpanded, right, selectedRows, lastClickedIndex]
  );

  const {
    setHiddenColumns,
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
    selectedFlatRows,
    state: { selectedRowIds },
  } = useTable<IResponseStatement>(
    {
      columns,
      data: statementsLocal,
      getRowId,
      initialState: {
        hiddenColumns:
          displayMode === StatementListDisplayMode.TEXT
            ? [
                "id",
                "selection",
                "move",
                "subject",
                "actions",
                "objects",
                "text",
                "warnings",
                "lastEdit",
                "expander",
              ]
            : ["id"],
      },
    },
    useExpanded,
    useRowSelect
  );

  useEffect(() => {
    if (displayMode === StatementListDisplayMode.TEXT) {
      setHiddenColumns([
        "id",
        "selection",
        "move",
        "subject",
        "actions",
        "objects",
        "text",
        "warnings",
        "lastEdit",
        "expander",
      ]);
    } else {
      setTimeout(() => {
        setHiddenColumns(["id"]);
      }, 500);
    }
  }, [displayMode]);

  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    setStatementsLocal((prevStatementsLocal) =>
      update(prevStatementsLocal, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevStatementsLocal[dragIndex]],
        ],
      })
    );
  }, []);

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
    <StyledTable
      {...getTableProps()}
      // $expanded={displayMode === StatementListDisplayMode.LIST}
      $contentWidth={
        displayMode === StatementListDisplayMode.LIST ? contentWidth : 80
      }
    >
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
        {rows.map((row, i) => {
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
              isSelected={selectedRows.includes(row.id)}
              {...row.getRowProps()}
            />
          );
        })}
      </tbody>
    </StyledTable>
  );
};
