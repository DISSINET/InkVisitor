import { UserEnums } from "@inkvisitor/shared/enums";
import { EntityEditing, EntityEditingContext } from "hooks";
import { EntityDetail } from "../EntityDetailBox/EntityDetail/EntityDetail";
import { EntityDetailTab } from "../EntityDetailBox/EntityDetailTab/EntityDetailTab";
import {
  EntityDetailTabOverflow,
} from "../EntityDetailBox/EntityDetailTabOverflow/EntityDetailTabOverflow";
import { useTabOverflow } from "../EntityDetailBox/EntityDetailTabOverflow/useTabOverflow";
import { IEntity } from "@inkvisitor/shared/types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDraftDetail,
  createDraftWrites,
  ImportDraft,
  ImportIssue,
  searchCandidates,
  tabEntities,
} from "utils/entityImport";
import { getStoredUserRole } from "utils/userStorage";
import { canAppend, EntityImportAppendPanel } from "./EntityImportAppendPanel";
import { EntityImportIssueList } from "./EntityImportIssueList";
import {
  StyledDraftBody,
  StyledDraftDetail,
  StyledDraftMain,
  StyledDraftIssues,
  StyledDrafts,
  StyledDraftTabGroup,
} from "./EntityImportModalStyles";

// Detail decides its narrow layout from the width of this element
const DRAFT_DETAIL_ELEMENT_ID = "entity-import-draft-detail";

interface EntityImportDrafts {
  draft: ImportDraft;
  onDraftChange: (update: (draft: ImportDraft) => ImportDraft) => void;
  // leaves the entity out of the import
  onCloseTab: (entityId: string) => void;
  onMoveTab: (dragIndex: number, hoverIndex: number) => void;
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
 * The entities of an import as tabs, each shown and edited in Detail. Every
 * edit stays in the draft until the import creates the entities.
 */
export const EntityImportDrafts: React.FC<EntityImportDrafts> = ({
  draft,
  onDraftChange,
  onCloseTab,
  onMoveTab,
  onConflictChoice,
  onAppendTo,
  undoableAppendIds,
  onUndoAppend,
  errors,
  notes,
}) => {
  const tabs = useMemo(() => tabEntities(draft), [draft]);
  const [selectedId, setSelectedId] = useState<string | undefined>(tabs[0]?.id);

  // the import id of each draft appended in the tabs, by stored id
  const appendedFrom = useRef<Record<string, string>>({});

  // an undone append gives the tab its import id back; a closed tab hands the
  // selection to the first tab left
  useEffect(() => {
    if (!tabs.some((entity) => entity.id === selectedId)) {
      const restoredId = selectedId && appendedFrom.current[selectedId];
      setSelectedId(
        tabs.some((entity) => entity.id === restoredId) ? restoredId : tabs[0]?.id
      );
    }
  }, [tabs, selectedId]);

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

  const { tabGroupRef, visibleTabs, overflowEntities } = useTabOverflow(tabs, selectedId);

  // a tab picked in the caret list moves to the front, so two picks from the
  // list can sit side by side
  const handleOverflowSelect = (entityId: string) => {
    const index = tabs.findIndex((entity) => entity.id === entityId);
    if (index > 0) {
      onMoveTab(index, 0);
    }
    setSelectedId(entityId);
  };

  // the draft takes the id of the stored entity, so its tab stays selected
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
            />
            <EntityImportIssueList
              title="Changes the import made to the input"
              issues={notes}
              collapsible
            />
          </StyledDraftIssues>
        )}

        <StyledDraftBody>
          <StyledDraftMain>
            <StyledDraftTabGroup ref={tabGroupRef}>
              {visibleTabs.map(({ entity, index }) => (
                <EntityDetailTab
                  key={entity.id}
                  index={index}
                  entity={entity}
                  isSelected={entity.id === selectedId}
                  onClick={() => setSelectedId(entity.id)}
                  onClose={() => onCloseTab(entity.id)}
                  moveRow={onMoveTab}
                />
              ))}
              {overflowEntities.length > 0 && (
                <EntityDetailTabOverflow
                  entities={overflowEntities}
                  onSelect={handleOverflowSelect}
                  onClose={onCloseTab}
                />
              )}
            </StyledDraftTabGroup>

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
          </StyledDraftMain>

          {selected && (
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
