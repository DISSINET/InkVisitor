import { IAudit, IResponseAudit } from "@shared/types";
import api from "api";
import React from "react";
import { FaExchangeAlt, FaRegCalendarAlt, FaUser } from "react-icons/fa";
import { MdAddCircleOutline } from "react-icons/md";
import { RiTimeLine } from "react-icons/ri";
import { useQuery } from "@tanstack/react-query";
import {
  StyledAuditColumn,
  StyledAuditEllipsis,
  StyledAuditRow,
  StyledAuditTable,
} from "./AuditTableStyles";
import { Button } from "components/basic/Button/Button";

export const AuditTable: React.FC<IResponseAudit> = ({
  entityId,
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

type AuditTableRow = { mode: "edit" | "create" } & IAudit;

export const AuditTableRow: React.FC<AuditTableRow> = ({
  id,
  entityId,
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
      const res = await api.withoutToaster().usersGet(user as string);
      return res.data;
    },
    {
      enabled: !!user,
    }
  );

  const changedKeys =
    Object.keys(changes).length === 1 && Object.keys(changes)[0] === "data"
      ? Object.keys((changes as { data: object }).data)
      : Object.keys(changes);

  const today = new Date().setHours(0, 0, 0, 0);

  const getPrettyDate = () => {
    if (today === new Date(date).setHours(0, 0, 0, 0)) {
      return "today";
    } else {
      const newDate = new Date(date);
      return newDate.toISOString().slice(0, 10);
    }
  };

  const prettyTime = new Date(date).toLocaleTimeString("en-GB");

  return (
    <div>
      <StyledAuditRow>
        <StyledAuditColumn>
          <FaUser />
          {(userData && userData.name) || "Removed user"}
        </StyledAuditColumn>
        <StyledAuditColumn>
          <FaRegCalendarAlt />
          {getPrettyDate()}
        </StyledAuditColumn>
        <StyledAuditColumn>
          <RiTimeLine />
          {prettyTime}
        </StyledAuditColumn>
        <StyledAuditColumn $wrap>
          {mode === "create" ? (
            <Button
              icon={<MdAddCircleOutline />}
              noBackground
              inverted
              noBorder
              tooltipLabel="created"
            />
          ) : (
            <Button
              icon={<FaExchangeAlt />}
              noBackground
              inverted
              noBorder
              tooltipLabel="edited"
            />
          )}
          {mode === "create" ? "" : changedKeys.join(", ")}
        </StyledAuditColumn>
      </StyledAuditRow>
    </div>
  );
};
