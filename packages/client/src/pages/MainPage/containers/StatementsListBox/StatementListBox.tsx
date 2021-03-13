import React, { useMemo, useState } from "react";
import { useTable, Cell, Row, useExpanded } from "react-table";
import { useQuery } from "react-query";

import { FaInfo, FaPencilAlt, FaClone, FaTrashAlt } from "react-icons/fa";
import { ActantTag } from "./../";

import { Button, ButtonGroup } from "components";
const queryString = require("query-string");

import api from "api";
import { useLocation, useHistory } from "react-router";

import { IStatement, IActant } from "@shared/types";

const initialData: { statements: IStatement[]; actants: IActant[] } = {
  statements: [],
  actants: [],
};

export const StatementListBox: React.FC = () => {
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;

  const { status, data, error, isFetching } = useQuery(
    ["statement", "territory", "statement-list", territoryId],
    async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    { initialData: initialData, enabled: !!territoryId }
  );

  const { statements, actants } = data || initialData;

  const columns: any = useMemo(() => {
    return [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        Header: "Subjects",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const subjectIds = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position === "s")
                .map((a: any) => a.actant)
            : [];

          const isOversized = subjectIds.length > 4;
          const subjectIdsSlice = subjectIds.slice(0, 1);

          return (
            <div className="table-subjects inline-flex">
              {subjectIdsSlice
                .filter((a: any) => a)
                .map((actantId: string, ai: number) => {
                  const subjectObject =
                    actants && actants.find((a) => a.id === actantId);

                  return (
                    subjectObject && (
                      <ActantTag
                        key={ai}
                        actant={subjectObject}
                        short={false}
                      />
                    )
                  );
                })}
              {isOversized && <div className="flex items-end">{"..."}</div>}
            </div>
          );
        },
      },
      {
        Header: "Type",
        accessor: "data.action",
        Cell: ({ row }: Cell) => {
          const actionTypeLabel = row.values.data?.action;
          return (
            <p>
              {actionTypeLabel && actionTypeLabel.length > 40
                ? `${actionTypeLabel.substring(0, 40)}...`
                : actionTypeLabel}
            </p>
          );
        },
      },
      {
        Header: "Actants",
        Cell: ({ row }: Cell) => {
          const actantIds = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position !== "s")
                .map((a: any) => a.actant)
            : [];
          const isOversized = actantIds.length > 4;
          const actantIdsSlice = actantIds.slice(0, 4);

          return (
            <div className="table-subjects inline-flex">
              {actantIdsSlice
                .filter((a: any) => a)
                .map((actantId: string, ai: number) => {
                  const actantObject =
                    actants && actants.find((a) => a && a.id === actantId);

                  return (
                    actantObject && (
                      <ActantTag key={ai} actant={actantObject} short={false} />
                    )
                  );
                })}
              {isOversized && <div className="flex items-end">{"..."}</div>}
            </div>
          );
        },
      },
      {
        Header: "",
        id: "expander",
        Cell: ({ row }: any) => (
          <ButtonGroup>
            <Button
              key="i"
              icon={<FaInfo size={14} />}
              color="info"
              onClick={() => (row.isExpanded = !row.isExpanded)}
            />
            <Button key="d" icon={<FaClone size={14} />} color="success" />
            <Button
              key="e"
              icon={<FaPencilAlt size={14} />}
              color="warning"
              onClick={() => {
                hashParams["statement"] = row.values.id;
                history.push({
                  hash: queryString.stringify(hashParams),
                });
              }}
            />
            <Button
              key="r"
              icon={<FaTrashAlt size={14} />}
              color="danger"
              onClick={() => {
                // delete
              }}
            />
          </ButtonGroup>
        ),
      },
    ];
  }, [data]);

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
    <div>
      <table {...getTableProps()}>
        <thead className="border-b-2 border-black">
          {headerGroups.map((headerGroup, key) => (
            <tr
              {...headerGroup.getHeaderGroupProps()}
              key={key}
              style={{ fontSize: "1rem" }}
            >
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
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell, i) => {
                    return (
                      <td className="p-1" {...cell.getCellProps()}>
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
