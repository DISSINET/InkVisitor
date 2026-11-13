import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { Button, IconWithTooltip, Input, Tooltip, TypeBar } from "components";
import { AttributeButtonGroup } from "components/advanced";
import React, { useEffect, useMemo, useState } from "react";
import {
  IcoArrow90DegLeft,
  IcoArrowDown,
  IcoArrowUp,
  IcoCaretDown,
  IcoCaretRight,
  IcoCheck,
  IcoCloseCg,
  IcoExclamation,
  IcoWarning,
} from "Theme/icons";
import { ImportDraft } from "utils/entityImport";
import { getEntityLabel } from "utils/utils";
import { className } from "utils/entityImport/helpers";
import { ButtonSize } from "types";
import {
  StyledDraftList,
  StyledDraftListBadge,
  StyledDraftListBox,
  StyledDraftListCount,
  StyledDraftListEmpty,
  StyledDraftListEnd,
  StyledDraftListGroup,
  StyledDraftListLabel,
  StyledDraftListLeaveOut,
  StyledDraftListMarkers,
  StyledDraftListNav,
  StyledDraftListResize,
  StyledDraftListRow,
  StyledDraftListSummary,
  StyledDraftListToolbar,
} from "./EntityImportModalStyles";

interface EntityImportDraftList {
  draft: ImportDraft;
  // the drafts with a tab of their own, in draft order
  entities: IEntity[];
  // drafts the last validation found an error in
  errorIds: Set<string>;
  // every left-out draft with the draft that is the reason, see leftOutDrafts
  leftOut: Map<string, string>;
  labelOf: (entityId: string) => string;
  selectedId: string | undefined;
  onSelect: (entityId: string) => void;
  onToggleLeftOut: (entityId: string) => void;
  // drafts opened in the Detail so far
  reviewedIds: Set<string>;
  onAllConflictChoices: (useImported: boolean) => void;
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

// case and accents do not matter to the label filter
const fold = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Whether any label of the draft holds the searched text. */
export const matchesSearch = (entity: IEntity, query: string): boolean => {
  const searched = fold(query.trim());
  return !searched || entity.labels.some((label) => fold(label).includes(searched));
};

// the width of the list in px, kept in the browser between imports
const LIST_WIDTH_KEY = "entityImportListWidth";
const LIST_WIDTH = { min: 200, max: 450, initial: 250 };
const clampWidth = (width: number) => Math.min(LIST_WIDTH.max, Math.max(LIST_WIDTH.min, width));
const readListWidth = () => {
  try {
    const stored = Number(localStorage.getItem(LIST_WIDTH_KEY));
    return stored ? clampWidth(stored) : LIST_WIDTH.initial;
  } catch {
    return LIST_WIDTH.initial;
  }
};
const storeListWidth = (width: number) => {
  try {
    localStorage.setItem(LIST_WIDTH_KEY, String(width));
  } catch {
    // the width just isn't remembered
  }
};

/**
 * The drafts of an import as a list, one row each with its status, and the
 * tools to find one: a label filter, a filter for the drafts that need a decision,
 * and moving through the rows.
 */
export const EntityImportDraftList: React.FC<EntityImportDraftList> = ({
  draft,
  entities,
  errorIds,
  leftOut,
  labelOf,
  selectedId,
  onSelect,
  onToggleLeftOut,
  reviewedIds,
  onAllConflictChoices,
}) => {
  const [width, setWidth] = useState(readListWidth);
  const resizeTo = (next: number) => {
    const clamped = clampWidth(next);
    setWidth(clamped);
    storeListWidth(clamped);
  };
  const startResize = (event: React.MouseEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    const onMove = (move: MouseEvent) => setWidth(clampWidth(startWidth + move.clientX - startX));
    const onUp = (up: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      resizeTo(startWidth + up.clientX - startX);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [folded, setFolded] = useState(() => new Set([EntityEnums.Class.Value]));

  const conflictsOf = (entity: IEntity) => draft.appends?.[entity.id]?.conflicts.length ?? 0;
  // the drafts that still need a decision: a conflict or an error
  const attentionIds = useMemo(
    () =>
      new Set(
        entities
          .filter(
            (entity) =>
              !leftOut.has(entity.id) && (conflictsOf(entity) > 0 || errorIds.has(entity.id))
          )
          .map((entity) => entity.id)
      ),
    [entities, draft.appends, errorIds, leftOut]
  );
  const groups = useMemo(
    () =>
      groupDrafts(
        entities.filter(
          (entity) =>
            matchesSearch(entity, query) && (!attentionOnly || attentionIds.has(entity.id))
        )
      ),
    [entities, query, attentionOnly, attentionIds]
  );
  // the rows in the order they show, folded groups included
  const order = groups.flatMap(([, members]) => members);
  const position = order.findIndex((entity) => entity.id === selectedId);

  const step = (delta: number) => {
    const target =
      position < 0 ? order[delta > 0 ? 0 : order.length - 1] : order[position + delta];
    if (target) {
      onSelect(target.id);
    }
  };
  const withConflict = order.filter((entity) => !leftOut.has(entity.id) && conflictsOf(entity) > 0);
  // the next one below the selected row, or the first one from the top
  const nextConflict = () => {
    const target =
      withConflict.find((entity) => order.indexOf(entity) > position) ?? withConflict[0];
    if (target) {
      onSelect(target.id);
    }
  };

  // Alt+up/down moves through the rows, except in a text field, where the
  // keys move the caret
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      event.preventDefault();
      step(event.key === "ArrowDown" ? 1 : -1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const appendCount = entities.filter(
    (entity) => draft.appends?.[entity.id] && !leftOut.has(entity.id)
  ).length;
  const leftOutCount = entities.filter((entity) => leftOut.has(entity.id)).length;
  const reviewedCount = entities.filter((entity) => reviewedIds.has(entity.id)).length;
  const conflictCount = entities
    .filter((entity) => !leftOut.has(entity.id))
    .reduce((total, entity) => total + conflictsOf(entity), 0);
  const summary = [
    `${reviewedCount}/${entities.length} reviewed`,
    appendCount ? `${appendCount} append` : "",
    leftOutCount ? `${leftOutCount} left out` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  // a draft selected inside a folded group unfolds it, so its row shows
  const selectedClass = entities.find((entity) => entity.id === selectedId)?.class;
  useEffect(() => {
    if (selectedClass && folded.has(selectedClass)) {
      setFolded((current) => new Set([...current].filter((item) => item !== selectedClass)));
    }
  }, [selectedClass]);

  // The row under the pointer shows its whole label, as a Detail tab does;
  // over its markers the label gives way to what the marker under the pointer
  // says.
  const [hovered, setHovered] = useState<{ element: Element; label: string } | null>(null);
  useEffect(() => setHovered(null), [entities]);

  // a draft left out with another one says which
  const hoverLabel = (entity: IEntity) => {
    const reason = leftOut.get(entity.id);
    return reason && reason !== entity.id
      ? `${getEntityLabel(entity)}; left out with "${labelOf(reason)}"`
      : getEntityLabel(entity);
  };

  const toggle = (entityClass: EntityEnums.Class) =>
    setFolded((current) => {
      const next = new Set(current);
      if (!next.delete(entityClass)) {
        next.add(entityClass);
      }
      return next;
    });

  return (
    <StyledDraftListBox $width={width}>
      <StyledDraftListResize
        role="separator"
        aria-orientation="vertical"
        aria-label="width of the list"
        tabIndex={0}
        onMouseDown={startResize}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            resizeTo(width + (event.key === "ArrowRight" ? 20 : -20));
          }
        }}
      />
      <StyledDraftListToolbar>
        <StyledDraftListNav>
          <Input
            width="full"
            placeholder="filter by label"
            value={query}
            onChangeFn={setQuery}
            changeOnType
          />
          <Button
            icon={<IcoArrowUp />}
            inverted
            noBorder
            size={ButtonSize.Small}
            tooltipLabel="previous (Alt+up)"
            disabled={!order.length || position === 0}
            onClick={() => step(-1)}
          />
          <StyledDraftListCount>
            {`${position >= 0 ? position + 1 : "-"}/${order.length}`}
          </StyledDraftListCount>
          <Button
            icon={<IcoArrowDown />}
            inverted
            noBorder
            size={ButtonSize.Small}
            tooltipLabel="next (Alt+down)"
            disabled={!order.length || position === order.length - 1}
            onClick={() => step(1)}
          />
          <Button
            icon={<IcoWarning />}
            inverted
            noBorder
            size={ButtonSize.Small}
            textColor="warning"
            tooltipLabel="next conflict"
            disabled={!withConflict.length}
            onClick={nextConflict}
          />
        </StyledDraftListNav>
        <StyledDraftListNav>
          <AttributeButtonGroup
            noMargin
            options={[
              {
                longValue: `all (${entities.length})`,
                shortValue: `all (${entities.length})`,
                selected: !attentionOnly,
                onClick: () => setAttentionOnly(false),
              },
              {
                longValue: `needs attention (${attentionIds.size})`,
                shortValue: `needs attention (${attentionIds.size})`,
                selected: attentionOnly,
                onClick: () => setAttentionOnly(true),
              },
            ]}
          />
          <StyledDraftListSummary>{summary}</StyledDraftListSummary>
        </StyledDraftListNav>
        {conflictCount > 0 && (
          <StyledDraftListNav>
            <StyledDraftListSummary $left>
              {`All ${conflictCount} ${conflictCount === 1 ? "conflict" : "conflicts"}:`}
            </StyledDraftListSummary>
            <Button
              label="keep stored"
              inverted
              size={ButtonSize.Small}
              onClick={() => onAllConflictChoices(false)}
            />
            <Button
              label="take import"
              inverted
              size={ButtonSize.Small}
              onClick={() => onAllConflictChoices(true)}
            />
          </StyledDraftListNav>
        )}
      </StyledDraftListToolbar>
      <StyledDraftList>
        {groups.length === 0 && <StyledDraftListEmpty>{"Nothing matches."}</StyledDraftListEmpty>}
        {groups.map(([entityClass, members]) => {
          // a label filter shows every match, folded groups too
          const isFolded = !query.trim() && folded.has(entityClass);
          return (
            <React.Fragment key={entityClass}>
              <StyledDraftListGroup type="button" onClick={() => toggle(entityClass)}>
                {isFolded ? <IcoCaretRight /> : <IcoCaretDown />}
                {`${className(entityClass)} (${members.length})`}
              </StyledDraftListGroup>
              {!isFolded &&
                members.map((entity) => {
                  const append = draft.appends?.[entity.id];
                  const rowConflicts = append?.conflicts.length ?? 0;
                  const isSelected = entity.id === selectedId;
                  const reason = leftOut.get(entity.id);
                  return (
                    <StyledDraftListRow
                      key={entity.id}
                      role="button"
                      tabIndex={0}
                      $selected={isSelected}
                      aria-current={isSelected}
                      onClick={() => onSelect(entity.id)}
                      onMouseEnter={(event) =>
                        setHovered({ element: event.currentTarget, label: hoverLabel(entity) })
                      }
                      onMouseLeave={() => setHovered(null)}
                      onKeyDown={(event) => {
                        if (event.target === event.currentTarget && event.key === "Enter") {
                          onSelect(entity.id);
                        }
                      }}
                    >
                      <TypeBar entityLetter={entity.class} noMargin dimColor={!isSelected} />
                      <StyledDraftListLabel $leftOut={!!reason}>
                        {getEntityLabel(entity)}
                      </StyledDraftListLabel>
                      <StyledDraftListMarkers
                        onMouseEnter={() => setHovered(null)}
                        onMouseLeave={(event) =>
                          event.currentTarget.parentElement &&
                          setHovered({
                            element: event.currentTarget.parentElement,
                            label: hoverLabel(entity),
                          })
                        }
                      >
                        {!reason && errorIds.has(entity.id) && (
                          <IconWithTooltip
                            icon={<IcoExclamation />}
                            color="danger"
                            tooltipLabel="the import can't create it as it is; see the errors above"
                          />
                        )}
                        {!reason && rowConflicts > 0 && (
                          <IconWithTooltip
                            icon={<IcoWarning />}
                            color="warning"
                            tooltipLabel={`${rowConflicts} ${
                              rowConflicts === 1 ? "conflict" : "conflicts"
                            } with the database`}
                          />
                        )}
                        {reviewedIds.has(entity.id) && (
                          <IconWithTooltip
                            icon={<IcoCheck />}
                            color="greyer"
                            tooltipLabel="reviewed: opened in the Detail"
                          />
                        )}
                        <StyledDraftListBadge>
                          {reason ? "left out" : append ? "append" : "new"}
                        </StyledDraftListBadge>
                        {/* a draft left out with another one comes back with it */}
                        {(!reason || reason === entity.id) && (
                          <StyledDraftListLeaveOut
                            type="button"
                            aria-label={reason ? "bring back" : "leave out of the import"}
                            onMouseEnter={(event) =>
                              setHovered({
                                element: event.currentTarget,
                                label: reason ? "bring back" : "leave out of the import",
                              })
                            }
                            onMouseLeave={() => setHovered(null)}
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleLeftOut(entity.id);
                            }}
                          >
                            {reason ? <IcoArrow90DegLeft /> : <IcoCloseCg />}
                          </StyledDraftListLeaveOut>
                        )}
                      </StyledDraftListMarkers>
                    </StyledDraftListRow>
                  );
                })}
            </React.Fragment>
          );
        })}
        <StyledDraftListEnd />
      </StyledDraftList>
      <Tooltip
        visible={!!hovered}
        referenceElement={hovered?.element ?? null}
        label={hovered?.label}
        position="right"
      />
    </StyledDraftListBox>
  );
};
