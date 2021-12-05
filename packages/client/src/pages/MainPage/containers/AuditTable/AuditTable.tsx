import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "api";
import { IAudit, IResponseAudit } from "@shared/types";
import { FaExchangeAlt, FaRegCalendarAlt, FaUser } from "react-icons/fa";
import {
  StyledAuditColumn,
  StyledAuditEllipsis,
  StyledAuditRow,
  StyledAuditTable,
} from "./AuditTableStyles";
import { RiTimeLine } from "react-icons/ri";
import { Extend } from "webpack/node_modules/schema-utils/declarations/validate";

export const AuditTable: React.FC<IResponseAudit> = ({
  actant,
  last,
  first,
}) => {
  return (
    <div>
      <StyledAuditTable>
        {last
          .filter((auditLast) => first && auditLast.date !== first.date)
          .map((auditLast, ai) => (
            <AuditTableRow mode="edit" key={ai} {...auditLast}></AuditTableRow>
          ))}
        {last && last.length > 1 && (
          <StyledAuditEllipsis>...</StyledAuditEllipsis>
        )}
        {first && (
          <AuditTableRow mode="create" key="first" {...first}></AuditTableRow>
        )}
      </StyledAuditTable>
    </div>
  );
};

type IAuditTableRow = { mode: "edit" | "create" } & IAudit;

export const AuditTableRow: React.FC<IAuditTableRow> = ({
  id,
  actantId,
  user,
  date,
  changes,
  mode,
}) => {
  const {
    status: userStatus,
    data: userData,
    error: userError,
    isFetching: isFetchingUser,
  } = useQuery(
    ["user", user],
    async () => {
      const res = await api.usersGet(user as string);
      return res.data;
    },
    {
      enabled: !!user,
      retry: 2,
    }
  );

  const changedKeys =
    mode === "create"
      ? ["Created"]
      : Object.keys(changes).length === 1 && Object.keys(changes)[0] === "data"
      ? Object.keys((changes as { data: object }).data)
      : Object.keys(changes);

  const today = new Date().setHours(0, 0, 0, 0);

  const prettyDate =
    today === new Date(date).setHours(0, 0, 0, 0)
      ? "today"
      : new Date(date).toLocaleDateString("en-GB");
  const prettyTime = new Date(date).toLocaleTimeString("en-GB");

  return (
    <div>
      <StyledAuditRow>
        <StyledAuditColumn>
          <FaUser />
          {userData && userData.name}
        </StyledAuditColumn>
        <StyledAuditColumn>
          <FaRegCalendarAlt />
          {prettyDate}
        </StyledAuditColumn>
        <StyledAuditColumn>
          <RiTimeLine />
          {prettyTime}
        </StyledAuditColumn>
        <StyledAuditColumn>
          <FaExchangeAlt />
          {changedKeys.join(", ")}
        </StyledAuditColumn>
      </StyledAuditRow>
    </div>
  );
};
