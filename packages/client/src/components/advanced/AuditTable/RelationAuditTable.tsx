import { RelationEnums } from "@inkvisitor/shared/enums";
import { IAudit, IEntity, Relation } from "@inkvisitor/shared/types";
import { EventType } from "@inkvisitor/shared/types/stats";
import { Button, IconWithTooltip, LetterIcon } from "components";
import { useUsersSimplifiedQuery } from "hooks/react-query";
import React from "react";
import { FaExchangeAlt, FaRegCalendarAlt, FaUser } from "react-icons/fa";
import { MdAddCircleOutline, MdRemoveCircleOutline } from "react-icons/md";
import { RiTimeLine } from "react-icons/ri";
import { EntityTag } from "../EntityTag/EntityTag";
import { EntityTagById } from "../EntityTag/EntityTagById";
import {
  StyledAuditColumn,
  StyledAuditRow,
  StyledAuditTable,
  StyledLoadMoreWrap,
  StyledRelationAuditCell,
  StyledRelationAuditEmpty,
  StyledRelationAuditEntities,
  StyledRelationAuditType,
} from "./AuditTableStyles";

/** Snapshot stored in a relation audit's `changes` blob (Relation.auditSnapshot). */
type RelationAuditChanges = {
  id: string;
  type: RelationEnums.Type;
  entityIds: string[];
  order?: number;
};

interface RelationAuditTable {
  relations: IAudit[];
  /** The entity whose Detail this is - excluded from the connected-entity tags. */
  detailEntityId: string;
  /** Preloaded entities from the entity Detail, used to resolve tags without a fetch. */
  entities?: Record<string, IEntity>;
  /** Whether the backend may hold more relation audits beyond the current page. */
  hasMore?: boolean;
  /** Requests the next page (current limit + 10) from the parent. */
  onLoadMore?: () => void;
}

/**
 * Compact list of the relation create/edit/delete audits connected to an
 * entity. Mirrors AuditTable's row layout but renders a flat IAudit[] and shows
 * the relation type plus the other connected entities.
 */
export const RelationAuditTable: React.FC<RelationAuditTable> = ({
  relations,
  detailEntityId,
  entities,
  hasMore,
  onLoadMore,
}) => {
  const { data: users } = useUsersSimplifiedQuery();

  const today = new Date().setHours(0, 0, 0, 0);
  const getPrettyDate = (date: Date) =>
    today === new Date(date).setHours(0, 0, 0, 0)
      ? "today"
      : new Date(date).toISOString().slice(0, 10);

  const actionButton = (type: EventType) => {
    switch (type) {
      case EventType.RELATION_CREATE:
        return <IconWithTooltip icon={<MdAddCircleOutline />} tooltipLabel="created" />;
      case EventType.RELATION_DELETE:
        return <IconWithTooltip icon={<MdRemoveCircleOutline />} tooltipLabel="deleted" />;
      default:
        return <IconWithTooltip icon={<FaExchangeAlt />} tooltipLabel="edited" />;
    }
  };

  if (!relations?.length) {
    return <StyledRelationAuditEmpty>No relation audits.</StyledRelationAuditEmpty>;
  }

  return (
    <>
      <StyledAuditTable $columns={5}>
        {relations.map((audit, ai) => {
          const userName = users?.find((u) => u.id === audit.user)?.name;
          const prettyTime = new Date(audit.date).toLocaleTimeString("en-GB");
          const changes = audit.changes as RelationAuditChanges;
          const label = Relation.RelationRules[changes.type]?.label ?? changes.type;

          return (
            <StyledAuditRow key={audit.id || ai}>
              <StyledAuditColumn>
                <FaUser />
                {userName ? userName : <i>{"removed user"}</i>}
              </StyledAuditColumn>
              <StyledAuditColumn>
                <FaRegCalendarAlt />
                {getPrettyDate(audit.date)}
              </StyledAuditColumn>
              <StyledAuditColumn>
                <RiTimeLine />
                {prettyTime}
              </StyledAuditColumn>
              <StyledAuditColumn>{actionButton(audit.type)}</StyledAuditColumn>
              <StyledRelationAuditCell>
                <StyledRelationAuditType>
                  <LetterIcon letter={changes.type} color="info" />
                  {label}
                </StyledRelationAuditType>

                <StyledRelationAuditEntities>
                  {changes.entityIds
                    ?.filter((id) => id !== detailEntityId)
                    .map((id) => {
                      const ent = entities?.[id];
                      return ent ? (
                        <EntityTag key={id} entity={ent} disableTooltip />
                      ) : (
                        // a since-deleted counterpart resolves to nothing - suppress
                        // the global 404 error toast; EntityTagById degrades to the id
                        <EntityTagById key={id} entityId={id} disableTooltip disableToast />
                      );
                    })}
                </StyledRelationAuditEntities>
              </StyledRelationAuditCell>
            </StyledAuditRow>
          );
        })}
      </StyledAuditTable>
      {hasMore && (
        <StyledLoadMoreWrap>
          <Button label="load more" inverted color="primary" onClick={onLoadMore} />
        </StyledLoadMoreWrap>
      )}
    </>
  );
};
