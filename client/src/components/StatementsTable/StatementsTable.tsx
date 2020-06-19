import React from "react";
import { useTable, Cell } from "react-table";
import classNames from "classnames";

import { Tag, Button } from "components";
import { EntityKeys, Entities } from "types";

interface StatementsTableProps {
  statements: {
    subjects: {}[];
    type: string;
    actants: {}[];
    active: boolean;
  }[];
}

export const StatementsTable: React.FC<StatementsTableProps> = ({
  statements,
}) => {
  const wrapperClasses = classNames("table-wrapper");
  const tableClasses = classNames("component", "table", "w-full", "table-auto");

  const {
    getTableProps,
    getTableBodyProps,
    allColumns,
    rows,
    prepareRow,
  } = useTable({
    columns: [
      {
        Header: "Order",
        Cell: () => <div className="table-order">^</div>,
      },
      {
        Header: "Subjects",
        accessor: () => "subjects",
        Cell: ({ row }: Cell) => (
          <div className="table-subjects">
            {row.values.subjects.map(
              (
                subject: { entity: typeof Entities[EntityKeys] },
                si: number
              ) => {
                return <Tag key={si} entity={subject.entity}></Tag>;
              }
            )}
          </div>
        ),
      },
      { Header: "Type", accessor: () => "type" },
      {
        Header: "Actants",
        accessor: () => "actants",
        Cell: ({ row }: Cell) => (
          <div className="table-subjects">
            {row.values.actants.map(
              (actant: { entity: typeof Entities[EntityKeys] }, si: number) => {
                return <Tag key={si} entity={actant.entity}></Tag>;
              }
            )}
          </div>
        ),
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
          {rows.slice(0, 10).map((row, i) => {
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

StatementsTable.defaultProps = {
  statements: [],
};
