import { UserEnums } from "@inkvisitor/shared/enums";
import { EntityEditing, EntityEditingContext } from "hooks";
import { EntityDetail } from "../EntityDetailBox/EntityDetail/EntityDetail";
import { IEntity } from "@inkvisitor/shared/types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDraftDetail,
  createDraftWrites,
  ImportDraft,
  ImportIssue,
  leftOutDrafts,
  searchCandidates,
  tabEntities,
} from "utils/entityImport";
import { getStoredUserRole } from "utils/userStorage";
import { getEntityLabel } from "utils/utils";
import { canAppend, EntityImportAppendPanel } from "./EntityImportAppendPanel";
import { EntityImportDraftList, groupDrafts } from "./EntityImportDraftList";
import { EntityImportLeftOutPanel } from "./EntityImportLeftOutPanel";
import { EntityImportIssueList } from "./EntityImportIssueList";
import {
  StyledDraftBody,
  StyledDraftDetail,
  StyledDraftIssues,
  StyledDrafts,
} from "./EntityImportModalStyles";

// Detail decides its narrow layout from the width of this element
const DRAFT_DETAIL_ELEMENT_ID = "entity-import-draft-detail";

interface EntityImportDrafts {
  draft: ImportDraft;
  onDraftChange: (update: (draft: ImportDraft) => ImportDraft) => void;
  // leaves the entity out of the import, or brings it back
  onToggleLeftOut: (entityId: string) => void;
  onConflictChoice: (entityId: string, conflictIndex: number, useImported: boolean) => void;
  // resolves to whether the draft became an append to the stored entity
  onAppendTo: (entityId: string, storedId: string) => Promise<boolean>;
  // the stored ids of the appends made in the tabs, which can be undone
  undoableAppendIds: string[];
  onUndoAppend: (storedId: string) => void;
  errors: ImportIssue[];
  notes: ImportIssue[];
}

/**
 * The entities of an import as a list, the selected one shown and edited in
 * Detail. Every edit stays in the draft until the import creates the entities.
 */
export const EntityImportDrafts: React.FC<EntityImportDrafts> = ({
  draft,
  onDraftChange,
  onToggleLeftOut,
  onConflictChoice,
  onAppendTo,
  undoableAppendIds,
  onUndoAppend,
  errors,
  notes,
}) => {
  const tabs = useMemo(() => tabEntities(draft), [draft]);
  // the first row of the list, where the selection goes when it has none
  const firstId = () => groupDrafts(tabs)[0]?.[1][0]?.id;
  const [selectedId, setSelectedId] = useState<string | undefined>(firstId);

  // the import id of each draft appended in the tabs, by stored id
  const appendedFrom = useRef<Record<string, string>>({});

  // an undone append gives the draft its import id back; a draft left out
  // hands the selection to the first row
  useEffect(() => {
    if (!tabs.some((entity) => entity.id === selectedId)) {
      const restoredId = selectedId && appendedFrom.current[selectedId];
      setSelectedId(tabs.some((entity) => entity.id === restoredId) ? restoredId : firstId());
    }
  }, [tabs, selectedId]);

  const leftOut = useMemo(() => leftOutDrafts(draft), [draft]);
  const labelOf = (entityId: string) => {
    const entity = draft.entities.find((candidate) => candidate.id === entityId);
    return entity ? getEntityLabel(entity) : entityId;
  };

  const errorIds = useMemo(
    () =>
      new Set(
        errors.flatMap((issue) => (issue.entityId ? [issue.entityId] : []))
      ),
    [errors]
  );

  const right = [UserEnums.Role.Admin, UserEnums.Role.Owner].includes(
    getStoredUserRole() as UserEnums.Role
  )
    ? UserEnums.RoleMode.Admin
    : UserEnums.RoleMode.Write;

  // Detail edits the drafts: its writes change the draft, its suggesters and
  // drop zones create nothing, and it leaves out what needs a stored entity
  const writes = useMemo(() => createDraftWrites(onDraftChange), [onDraftChange]);
  const draftEntityIds = useMemo(
    () => new Set(draft.entities.map((entity) => entity.id)),
    [draft.entities]
  );
  const editing = useMemo<EntityEditing>(
    () => ({
      writes,
      unstoredEntityIds: draftEntityIds,
      createsEntities: false,
      offersStoredEntityFeatures: false,
      hostElementId: DRAFT_DETAIL_ELEMENT_ID,
    }),
    [writes, draftEntityIds]
  );

  const detail = selectedId ? buildDraftDetail(draft, selectedId, right) : undefined;
  const selected = tabs.find((entity) => entity.id === selectedId);

  // A new draft is searched by its labels for an entity already in the
  // database when its tab is first opened. The search outlives a tab switch,
  // so its results are kept by draft id; it is dropped only when the drafts
  // close.
  const [candidates, setCandidates] = useState<Record<string, IEntity[]>>({});
  const searchedIds = useRef(new Set<string>());
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (
      !selected ||
      !canAppend(selected) ||
      draft.appends?.[selected.id] ||
      searchedIds.current.has(selected.id)
    ) {
      return;
    }
    searchedIds.current.add(selected.id);
    searchCandidates(selected)
      .catch(() => [])
      .then((found) => {
        if (isMounted.current) {
          setCandidates((current) => ({
            ...current,
            [selected.id]: found.filter((candidate) => !draftEntityIds.has(candidate.id)),
          }));
        }
      });
  }, [selected, draft.appends, draftEntityIds]);

  // the draft takes the id of the stored entity, so its row stays selected
  const handleAppendTo = async (entityId: string, storedId: string) => {
    if (await onAppendTo(entityId, storedId)) {
      appendedFrom.current[storedId] = entityId;
      setSelectedId(storedId);
    }
  };

  return (
    <EntityEditingContext.Provider value={editing}>
      <StyledDrafts>
        {(errors.length > 0 || notes.length > 0) && (
          <StyledDraftIssues>
            <EntityImportIssueList
              title="Invalid input, nothing was created"
              issues={errors}
              isError
              onSelectEntity={setSelectedId}
            />
            <EntityImportIssueList
              title="Changes the import made to the input"
              issues={notes}
              collapsible
            />
          </StyledDraftIssues>
        )}

        <StyledDraftBody>
          <EntityImportDraftList
            draft={draft}
            entities={tabs}
            errorIds={errorIds}
            selectedId={selectedId}
            onSelect={setSelectedId}
            leftOut={leftOut}
            labelOf={labelOf}
            onToggleLeftOut={onToggleLeftOut}
          />

          <StyledDraftDetail id={DRAFT_DETAIL_ELEMENT_ID}>
            {detail && (
              <EntityDetail
                key={detail.id}
                detailId={detail.id}
                entity={detail}
                error={null}
                isFetching={false}
              />
            )}
          </StyledDraftDetail>

          {selected && leftOut.has(selected.id) && (
            <EntityImportLeftOutPanel
              entity={selected}
              leftOut={leftOut}
              labelOf={labelOf}
              onToggleLeftOut={onToggleLeftOut}
              onSelect={setSelectedId}
            />
          )}
          {selected && !leftOut.has(selected.id) && (
            <EntityImportAppendPanel
              draft={draft}
              entity={selected}
              candidates={candidates[selected.id]}
              onConflictChoice={(conflictIndex, useImported) =>
                onConflictChoice(selected.id, conflictIndex, useImported)
              }
              onAppendTo={(storedId) => handleAppendTo(selected.id, storedId)}
              onUndoAppend={
                undoableAppendIds.includes(selected.id)
                  ? () => onUndoAppend(selected.id)
                  : undefined
              }
            />
          )}
        </StyledDraftBody>
      </StyledDrafts>
    </EntityEditingContext.Provider>
  );
};
