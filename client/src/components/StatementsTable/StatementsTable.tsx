import React, { useEffect, useMemo } from "react";
import { useTable, Cell } from "react-table";
import classNames from "classnames";

import { Tag, Button } from "components";
import { EntityKeys, Entities, Statement } from "types";

interface StatementsTableProps {
  statements: {}[];
}

interface IActant {
  id: string;
  _label: string;
  type: string;
  props: {}[];
}

export const StatementsTable: React.FC<StatementsTableProps> = ({
  statements,
}) => {
  const wrapperClasses = classNames("table-wrapper");
  const tableClasses = classNames("component", "table", "w-full", "table-auto");

  console.log(statements);

  const columns = useMemo(
    () => [
      {
        Header: "Order",
        Cell: () => <div className="table-order">^</div>,
      },
      {
        Header: "Subjects",
        accessor: "tree",
        Cell: ({ row }: Cell) => {
          const subjects =
            row.values.tree && row.values.tree.actants
              ? row.values.tree.actants.filter(
                  (a: IActant) => a.type === "subject"
                )
              : [];

          return (
            <div className="table-subjects">
              {subjects.length
                ? subjects.map((actant: IActant, si: number) => {
                    console.log(actant);
                    return <Tag key={si} entity={Entities["P"]}></Tag>;
                  })
                : null}
            </div>
          );
        },
      },
      {
        Header: "Type",
        accessor: "actionId",
        Cell: ({ row }: Cell) => (
          <div className="table-action-id">{row.values.actionId}</div>
        ),
      },
      {
        Header: "Actants",
        accessor: () => "tree",
        Cell: ({ row }: Cell) => {
          const actants =
            row.values.tree && row.values.tree.actants
              ? row.values.tree.actants.filter(
                  (a: IActant) => a.type === "actant1"
                )
              : [];

          return (
            <div className="table-subjects">
              {actants.length
                ? actants.map((actant: IActant, si: number) => {
                    return <Tag key={si} entity={Entities["P"]}></Tag>;
                  })
                : null}
            </div>
          );
        },
      },
      {
        Header: "Buttons",
        Cell: () => (
          <div className="table-actions">
            <Button key="i" label="i" color="info" />
            <Button key="e" label="e" color="primary" />
            <Button key="d" label="d" color="warning" />
            <Button key="r" label="r" color="danger" />
          </div>
        ),
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    allColumns,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data: statements,
  });

  return (
    <div className={wrapperClasses}>
      <table {...getTableProps()} className={tableClasses}>
        <thead className="border-b-2 border-black">
          <tr>
            {allColumns.map((column, i) => (
              <th className="table-header text-left" key={i}>
                {column.render("Header")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr
                {...row.getRowProps()}
                className={classNames({
                  "bg-white": i % 2 == 0,
                  "bg-grey": i % 2 == 1,
                })}
              >
                {row.cells.map((cell, i) => {
                  return (
                    <td className="p-1" {...cell.getCellProps()}>
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
