import { IAudit, IResponseAudit } from "@inkvisitor/shared/types";
import { IconWithTooltip } from "components";
import { useUsersSimplifiedQuery } from "hooks/react-query";
import React from "react";
import { FaExchangeAlt, FaRegCalendarAlt, FaUser } from "react-icons/fa";
import { MdAddCircleOutline } from "react-icons/md";
import { RiTimeLine } from "react-icons/ri";
import {
  StyledAuditColumn,
  StyledAuditEllipsis,
  StyledAuditRow,
  StyledAuditTable,
} from "./AuditTableStyles";

export const AuditTable: React.FC<IResponseAudit> = ({ modelId, auditScope, last, first }) => {
  return (
    <div>
      <StyledAuditTable $columns={4}>
        {last
          .filter((auditLast) => first && auditLast.date !== first.date)
          .map((auditLast, ai) => (
            <AuditTableRow mode="edit" key={ai} {...auditLast}></AuditTableRow>
          ))}
        {last && last.length > 1 && <StyledAuditEllipsis>...</StyledAuditEllipsis>}
        {first && <AuditTableRow mode="create" key="first" {...first}></AuditTableRow>}
      </StyledAuditTable>
    </div>
  );
};

type AuditTableRow = { mode: "edit" | "create" } & IAudit;

export const AuditTableRow: React.FC<AuditTableRow> = ({
  id,
  modelId,
  user,
  date,
  changes,
  mode,
}) => {
  const { data: users } = useUsersSimplifiedQuery();
  const userName = users?.find((u) => u.id === user)?.name;

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
    <StyledAuditRow>
      <StyledAuditColumn>
        <FaUser />
        {userName ? userName : <i>{"removed user"}</i>}
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
          <IconWithTooltip icon={<MdAddCircleOutline />} tooltipLabel="created" />
        ) : (
          <IconWithTooltip icon={<FaExchangeAlt />} tooltipLabel="edited" />
        )}
        {mode === "create" ? "" : changedKeys.join(", ")}
      </StyledAuditColumn>
    </StyledAuditRow>
  );
};
