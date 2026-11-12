import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { IconWithTooltip, Tooltip, TypeBar } from "components";
import React, { useEffect, useMemo, useState } from "react";
import { IcoCaretDown, IcoCaretRight, IcoCloseCg, IcoExclamation, IcoWarning } from "Theme/icons";
import { ImportDraft } from "utils/entityImport";
import { getEntityLabel } from "utils/utils";
import { className } from "utils/entityImport/helpers";
import {
  StyledDraftList,
  StyledDraftListBadge,
  StyledDraftListEnd,
  StyledDraftListGroup,
  StyledDraftListLabel,
  StyledDraftListLeaveOut,
  StyledDraftListMarkers,
  StyledDraftListRow,
} from "./EntityImportModalStyles";

interface EntityImportDraftList {
  draft: ImportDraft;
  // the drafts with a tab of their own, in draft order
  entities: IEntity[];
  // drafts the last validation found an error in
  errorIds: Set<string>;
  selectedId: string | undefined;
  onSelect: (entityId: string) => void;
  onLeaveOut: (entityId: string) => void;
}

/**
 * The drafts grouped by class, each group in draft order, in the order the
 * classes first appear. Values come last and start folded: a batch holds many
 * and none needs a decision.
 */
export const groupDrafts = (entities: IEntity[]): [EntityEnums.Class, IEntity[]][] => {
  const groups = new Map<EntityEnums.Class, IEntity[]>();
  entities.forEach((entity) =>
    groups.set(entity.class, [...(groups.get(entity.class) ?? []), entity])
  );
  const isValues = (entityClass: EntityEnums.Class) =>
    Number(entityClass === EntityEnums.Class.Value);
  // the sort is stable, so the other classes keep their order
  return [...groups].sort(([a], [b]) => isValues(a) - isValues(b));
};

/** The drafts of an import as a list, one row each with its status. */
export const EntityImportDraftList: React.FC<EntityImportDraftList> = ({
  draft,
  entities,
  errorIds,
  selectedId,
  onSelect,
  onLeaveOut,
}) => {
  const groups = useMemo(() => groupDrafts(entities), [entities]);
  const [folded, setFolded] = useState(() => new Set([EntityEnums.Class.Value]));

  // a draft selected inside a folded group unfolds it, so its row shows
  const selectedClass = entities.find((entity) => entity.id === selectedId)?.class;
  useEffect(() => {
    if (selectedClass && folded.has(selectedClass)) {
      setFolded((current) => new Set([...current].filter((item) => item !== selectedClass)));
    }
  }, [selectedClass]);

  // the row under the pointer shows its whole label, as a Detail tab does
  const [hovered, setHovered] = useState<{ entity: IEntity; element: Element } | null>(null);
  useEffect(() => setHovered(null), [entities]);

  const toggle = (entityClass: EntityEnums.Class) =>
    setFolded((current) => {
      const next = new Set(current);
      if (!next.delete(entityClass)) {
        next.add(entityClass);
      }
      return next;
    });

  return (
    <StyledDraftList>
      {groups.map(([entityClass, members]) => {
        const isFolded = folded.has(entityClass);
        return (
          <React.Fragment key={entityClass}>
            <StyledDraftListGroup type="button" onClick={() => toggle(entityClass)}>
              {isFolded ? <IcoCaretRight /> : <IcoCaretDown />}
              {`${className(entityClass)} (${members.length})`}
            </StyledDraftListGroup>
            {!isFolded &&
              members.map((entity) => {
                const append = draft.appends?.[entity.id];
                const conflictCount = append?.conflicts.length ?? 0;
                const isSelected = entity.id === selectedId;
                return (
                  <StyledDraftListRow
                    key={entity.id}
                    role="button"
                    tabIndex={0}
                    $selected={isSelected}
                    aria-current={isSelected}
                    onClick={() => onSelect(entity.id)}
                    onMouseEnter={(event) => setHovered({ entity, element: event.currentTarget })}
                    onMouseLeave={() => setHovered(null)}
                    onKeyDown={(event) => {
                      if (event.target === event.currentTarget && event.key === "Enter") {
                        onSelect(entity.id);
                      }
                    }}
                  >
                    <TypeBar entityLetter={entity.class} noMargin dimColor={!isSelected} />
                    <StyledDraftListLabel>{getEntityLabel(entity)}</StyledDraftListLabel>
                    <StyledDraftListMarkers>
                      {errorIds.has(entity.id) && (
                        <IconWithTooltip
                          icon={<IcoExclamation />}
                          color="danger"
                          tooltipLabel="the import can't create it as it is; see the errors above"
                        />
                      )}
                      {conflictCount > 0 && (
                        <IconWithTooltip
                          icon={<IcoWarning />}
                          color="warning"
                          tooltipLabel={`${conflictCount} ${
                            conflictCount === 1 ? "conflict" : "conflicts"
                          } with the database`}
                        />
                      )}
                      <StyledDraftListBadge>{append ? "append" : "new"}</StyledDraftListBadge>
                      <StyledDraftListLeaveOut
                        type="button"
                        aria-label="leave out of the import"
                        onClick={(event) => {
                          event.stopPropagation();
                          onLeaveOut(entity.id);
                        }}
                      >
                        <IcoCloseCg />
                      </StyledDraftListLeaveOut>
                    </StyledDraftListMarkers>
                  </StyledDraftListRow>
                );
              })}
          </React.Fragment>
        );
      })}
      <StyledDraftListEnd />
      <Tooltip
        visible={!!hovered}
        referenceElement={hovered?.element ?? null}
        label={hovered ? getEntityLabel(hovered.entity) : undefined}
        position="right"
      />
    </StyledDraftList>
  );
};
