import { UserEnums } from "@inkvisitor/shared/enums";
import { EntityEditing, EntityEditingContext } from "hooks";
import { EntityDetail } from "../EntityDetailBox/EntityDetail/EntityDetail";
import { EntityDetailTab } from "../EntityDetailBox/EntityDetailTab/EntityDetailTab";
import React, { useEffect, useMemo, useState } from "react";
import { buildDraftDetail, createDraftWrites, ImportDraft, ImportIssue } from "utils/entityImport";
import { getStoredUserRole } from "utils/userStorage";
import { EntityImportIssueList } from "./EntityImportIssueList";
import {
  StyledDraftDetail,
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
  errors,
  notes,
}) => {
  const [selectedId, setSelectedId] = useState<string | undefined>(draft.entities[0]?.id);

  // a closed tab hands the selection to the first tab left
  useEffect(() => {
    if (!draft.entities.some((entity) => entity.id === selectedId)) {
      setSelectedId(draft.entities[0]?.id);
    }
  }, [draft.entities, selectedId]);

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

        <StyledDraftTabGroup>
          {draft.entities.map((entity, index) => (
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
      </StyledDrafts>
    </EntityEditingContext.Provider>
  );
};
