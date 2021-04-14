import React, { useMemo, useRef, useState } from "react";
import { Cell } from "react-table";
import { useQuery } from "react-query";
import {
  FaInfo,
  FaPencilAlt,
  FaClone,
  FaTrashAlt,
  FaPlus,
} from "react-icons/fa";
import { useLocation, useHistory } from "react-router";
const queryString = require("query-string");

import { Button, ButtonGroup, TagGroup, Tooltip } from "components";
import { ActantTag } from "./../";
import api from "api";
import { IStatement, IActant, IAction } from "@shared/types";
import { StatementListTable } from "./StatementListTable";
import { StyledDots } from "./StatementLitBoxStyles";

const initialData: {
  statements: IStatement[];
  actants: IActant[];
} = {
  statements: [],
  actants: [],
};

export const StatementListBox: React.FC = () => {
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;
  const statementId = hashParams.statement;

  const { status, data, error, isFetching } = useQuery(
    ["territory", "statement-list", territoryId],
    async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    { initialData: initialData, enabled: !!territoryId }
  );

  const { statements, actants } = data || initialData;

  const {
    status: statusActions,
    data: actions,
    error: errorActions,
    isFetching: isFetchingActions,
  } = useQuery(
    ["actions"],
    async () => {
      const res = await api.actionsGetMore({});
      return res.data;
    },
    {}
  );

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

          const isOversized = subjectIds.length > 1;
          const subjectIdsSlice = subjectIds.slice(0, 1);

          return (
            <TagGroup>
              <ActantTag actant={{ id: "", class: "S", label: "", data: {} }} />
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
        Header: "Type",
        accessor: "data.action",
        Cell: ({ row }: Cell) => {
          const actionTypeLabel = row.values.data?.action;
          const actionLabel = actions?.find(
            (a: IAction) => a.id === actionTypeLabel
          )?.labels[0].value;

          return (
            <p>
              {actionLabel &&
                (actionLabel.length > 9 ? (
                  <Tooltip label={actionLabel}>
                    <div>{`${actionLabel.substring(0, 9)}...`}</div>
                  </Tooltip>
                ) : (
                  actionLabel
                ))}
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
        Header: "",
        id: "expander",
        Cell: ({ row }: any) => (
          <ButtonGroup noMargin>
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
      {
        Header: "",
        id: "addStatement",
        Cell: ({ row }: any) => (
          <div>
            <Button
              key="add"
              icon={<FaPlus size={14} />}
              color="primary"
              inverted
              onClick={() => addStatement(row.values.id)}
            />
          </div>
        ),
      },
    ];
  }, [data, actions]);

  const addStatement = (rowId: string) => {
    // TODO: add new statement
    console.log("Adding statement not implemented. Clicked on ID: ", rowId);
  };

  if (isFetching) {
    return <div>loading...</div>;
  }
  return <StatementListTable data={statements} columns={columns} />;
};
