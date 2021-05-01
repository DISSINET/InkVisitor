import React, { useMemo, useRef, useState } from "react";
import { Cell } from "react-table";
import { useQuery, useQueryClient } from "react-query";
import {
  FaInfo,
  FaTrashAlt,
  FaPlus,
  FaRegCircle,
  FaDotCircle,
} from "react-icons/fa";
import { useLocation, useHistory } from "react-router";
import { toast } from "react-toastify";
const queryString = require("query-string");

import { Button, ButtonGroup, Loader, TagGroup, Tooltip } from "components";
import { ActantTag } from "./../";
import api from "api";
import { IStatement, IActant, IAction } from "@shared/types";
import { ActantType } from "@shared/enums";
import { StatementListTable } from "./StatementListTable/StatementListTable";
import {
  StyledDots,
  StyledLoaderWrap,
  StyledSelectorCell,
} from "./StatementLitBoxStyles";
import { CStatement } from "constructors";

const initialData: {
  statements: IStatement[];
  actants: IActant[];
} = {
  statements: [],
  actants: [],
};

export const StatementListBox: React.FC = () => {
  const queryClient = useQueryClient();
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
    { initialData: initialData, enabled: !!territoryId && api.isLoggedIn() }
  );

  const addStatement = async (row: any) => {
    const newStatement: IStatement = CStatement(territoryId);
    newStatement.data.territory.order = row.original.data.territory.order;

    const res = await api.actantsCreate(newStatement);

    if (res.status === 200) {
      toast.info(`Statement created!`);
      queryClient.invalidateQueries([
        "territory",
        "statement-list",
        territoryId,
      ]);

      hashParams["statement"] = newStatement.id;
      history.push({
        hash: queryString.stringify(hashParams),
      });
    } else {
      toast.error(`Error: Statement not created!`);
    }
  };

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
    { enabled: api.isLoggedIn() }
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
              <ActantTag
                actant={{
                  id: "",
                  class: ActantType.Statement,
                  label: "",
                  data: {},
                }}
              />
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
            <div>
              {actionLabel &&
                (actionLabel.length > 9 ? (
                  <Tooltip label={actionLabel}>
                    <div>{`${actionLabel.substring(0, 9)}...`}</div>
                  </Tooltip>
                ) : (
                  actionLabel
                ))}
            </div>
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
        Cell: ({ row }: Cell) => (
          <ButtonGroup noMargin>
            <span {...row.getToggleRowExpandedProps()}>
              <Button
                key="i"
                icon={<FaInfo size={14} />}
                tooltip="info"
                color="info"
                onClick={() => (row.isExpanded = !row.isExpanded)}
              />
            </span>
            {
              //<Button key="d" icon={<FaClone size={14} />} color="success" tooltip="duplicate"/>
            }
            <Button
              key="r"
              icon={<FaTrashAlt size={14} />}
              color="danger"
              tooltip="delete"
              onClick={() => {
                // delete
              }}
            />
            <Button
              key="add"
              icon={<FaPlus size={14} />}
              tooltip="add new statement"
              color="warning"
              onClick={() => addStatement(row)}
            />
          </ButtonGroup>
        ),
      },
      {
        Header: "",
        id: "Selector",
        Cell: ({ row }: Cell) => {
          return (
            <StyledSelectorCell>
              {hashParams["statement"] === row.values.id ? (
                <FaDotCircle
                  size={18}
                  onClick={() => {
                    hashParams["statement"] = row.values.id;
                    history.push({
                      hash: queryString.stringify(hashParams),
                    });
                  }}
                />
              ) : (
                <FaRegCircle
                  size={18}
                  onClick={() => {
                    hashParams["statement"] = row.values.id;
                    history.push({
                      hash: queryString.stringify(hashParams),
                    });
                  }}
                />
              )}
            </StyledSelectorCell>
          );
        },
      },
    ];
  }, [data, actions]);

  return (
    <>
      <StatementListTable
        data={statements}
        columns={columns}
        handleRowClick={(rowId: string) => {
          //console.log(rowId);
        }}
      />
      <Loader show={isFetching} />
    </>
  );
};
