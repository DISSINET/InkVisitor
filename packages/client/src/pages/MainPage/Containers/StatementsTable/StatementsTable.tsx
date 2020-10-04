import React, { useEffect, useMemo, useState } from "react";
import { useTable, Cell, Row, useExpanded } from "react-table";
import classNames from "classnames";

import { Tag, Button } from "components";
import { Entities } from "types";
import { ActionI } from "@shared/types/action";
import { ActantI } from "@shared/types/actant";

interface StatementsTableProps {
  statements: {}[];
  actions: ActionI[];
  actants: ActantI[];
  activeStatementId: string;
  setActiveStatementId: (id: string) => void;
}

interface IActant {
  actant: string;
  certainty: string;
  elvl: string;
  position: string;
}

// FIXME: I had to retype ActantI, because there is not type attribute on ActantI type in @shared
interface ActantITable extends ActantI {
  data: {
    label: string;
    content: string;
    language: string;
    parent: string | false;
    type: string;
  };
}

export const StatementsTable: React.FC<StatementsTableProps> = ({
  statements,
  actions,
  actants,
  setActiveStatementId,
  activeStatementId,
}) => {
  const wrapperClasses = classNames("table-wrapper");
  const tableClasses = classNames(
    "component",
    "table",
    "w-full",
    "table-auto",
    "text-sm"
  );

  const columns = useMemo(
    () => [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        Header: "Subjects",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const subjects =
            row.values.data && row.values.data.actants
              ? row.values.data.actants.filter(
                  (a: IActant) => a.position === "s"
                )
              : [];

          return (
            <div className="table-subjects">
              {subjects.length
                ? subjects.map((actant: IActant, si: number) => {
                    return (
                      <Tag
                        key={si}
                        category={Entities["P"].id}
                        color={Entities["P"].color}
                        marginRight
                      />
                    );
                  })
                : null}
            </div>
          );
        },
      },
      {
        Header: "Type",
        accessor: "data.action",
        Cell: ({ row }: Cell) => {
          const actionTypeLabel =
            actions &&
            actions.find((action) => action.id === row.values.data.action)
              ?.labels[0].label;
          return (
            <p>
              {actionTypeLabel && actionTypeLabel.length > 55
                ? `${actionTypeLabel.substring(0, 55)}...`
                : actionTypeLabel}
            </p>
          );
        },
      },
      {
        Header: "Actants",
        Cell: ({ row }: Cell) => {
          const rowActants =
            row.values.data && row.values.data.actants
              ? row.values.data.actants.filter(
                  (a: IActant) => a.position !== "s"
                )
              : [];

          return (
            <div className="table-subjects">
              {rowActants.length > 0
                ? rowActants.map((actant: IActant, si: number) => {
                    const actantObject =
                      actants &&
                      (actants.find(
                        (a) => a.id === actant.actant
                      ) as ActantITable);
                    const actantLetter = actantObject?.class || "P";
                    return (
                      <Tag
                        key={si}
                        category={Entities[actantLetter].id}
                        color={Entities[actantLetter].color}
                        marginRight
                      />
                    );
                  })
                : null}
            </div>
          );
        },
      },
      {
        Header: "Buttons",
        id: "expander",
        Cell: ({ row }: Cell) => (
          <div className="table-actions">
            <span {...row.getToggleRowExpandedProps()}>
              <Button
                key="i"
                label="i"
                color="info"
                onClick={() => (row.isExpanded = !row.isExpanded)}
              />
            </span>
            <Button
              key="e"
              label="e"
              color="primary"
              onClick={() =>
                activeStatementId === row.values.id
                  ? setActiveStatementId("")
                  : setActiveStatementId(row.values.id)
              }
            />
            <Button key="d" label="d" color="warning" />
            <Button key="r" label="r" color="danger" />
          </div>
        ),
      },
    ],
    [activeStatementId, statements]
  );

  const renderRowSubComponent = React.useCallback(
    ({ row }) => (
      <pre
        style={{
          fontSize: "10px",
        }}
      >
        <code>{JSON.stringify({ values: row.values }, null, 2)}</code>
      </pre>
    ),
    []
  );

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
      data: statements,
      initialState: {
        hiddenColumns: ["id"],
      },
    },
    useExpanded
  );

  return (
    <div className={wrapperClasses}>
      <table {...getTableProps()} className={tableClasses}>
        <thead className="border-b-2 border-black">
          {headerGroups.map((headerGroup, key) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={key}>
              {headerGroup.headers.map((column, key) => (
                <th
                  className="table-header text-left"
                  {...column.getHeaderProps()}
                  key={key}
                >
                  {column.render("Header")}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <React.Fragment key={i}>
                <tr
                  {...row.getRowProps()}
                  className={classNames({
                    "bg-white": i % 2 == 0,
                    "bg-grey": i % 2 == 1,
                    "border-solid border-2 border-black":
                      row.values.id === activeStatementId,
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
                {row.isExpanded ? (
                  <tr>
                    <td colSpan={visibleColumns.length}>
                      {renderRowSubComponent({ row })}
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
