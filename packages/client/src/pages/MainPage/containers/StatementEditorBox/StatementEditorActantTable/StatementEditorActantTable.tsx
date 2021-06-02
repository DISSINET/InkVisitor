import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Column, useTable, useExpanded, Row } from "react-table";
import update from "immutability-helper";
import {
  StyledTable,
  StyledTHead,
  StyledTh,
} from "./StatementEditorActantTableStyles";
import { StatementEditorActantTableRow } from "./StatementEditorActantTableRow/StatementEditorActantTableRow";
import { IActant, IResponseStatement, IStatementActant } from "@shared/types";

interface FilteredActantObject {
  actant: IActant | undefined;
  sActant: IStatementActant;
}
interface StatementEditorActantTable {
  statement: IResponseStatement;
  handleRowClick?: Function;
  moveEndRow: Function;
}
export const StatementEditorActantTable: React.FC<StatementEditorActantTable> =
  ({ statement, handleRowClick = () => {}, moveEndRow }) => {
    const [filteredActants, setFilteredActants] = useState<
      FilteredActantObject[]
    >([]);

    useEffect(() => {
      const filteredActants = statement.data.actants.map((sActant, key) => {
        const actant = statement.actants.find((a) => a.id === sActant.actant);
        return { id: key, actant, sActant };
      });
      console.log(filteredActants);
      setFilteredActants(filteredActants);
    }, [statement]);

    const columns: Column<{}>[] = useMemo(() => {
      return [
        {
          Header: "ID",
          accessor: "id",
        },
        {
          Header: "Actant",
        },
        {
          Header: "Position",
        },
        {
          Header: "Attributes",
        },
      ];
    }, [filteredActants]);

    const getRowId = useCallback((row) => {
      return row.id;
    }, []);
    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      rows,
      prepareRow,
      visibleColumns,
    } = useTable(
      {
        columns,
        data: filteredActants,
        getRowId,
        initialState: {
          // hiddenColumns: ["id"],
        },
      },
      useExpanded
    );

    const moveRow = useCallback(
      (dragIndex: number, hoverIndex: number) => {
        const dragRecord = filteredActants[dragIndex];
        setFilteredActants(
          update(filteredActants, {
            $splice: [
              [dragIndex, 1],
              [hoverIndex, 0, dragRecord],
            ],
          })
        );
      },
      [filteredActants]
    );

    return (
      <StyledTable {...getTableProps()}>
        <StyledTHead>
          {headerGroups.map((headerGroup, key) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={key}>
              <th></th>
              {headerGroup.headers.map((column, key) => (
                <StyledTh {...column.getHeaderProps()} key={key}>
                  {column.render("Header")}
                </StyledTh>
              ))}
            </tr>
          ))}
        </StyledTHead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row: Row, i: number) => {
            prepareRow(row);
            return (
              <StatementEditorActantTableRow
                handleClick={handleRowClick}
                index={i}
                row={row}
                moveRow={moveRow}
                moveEndRow={moveEndRow}
                {...row.getRowProps()}
              />
            );
          })}
        </tbody>
      </StyledTable>
    );
  };
