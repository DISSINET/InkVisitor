import { UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation } from "@inkvisitor/shared/types";
import { EntityDraft, EntityDraftContext } from "hooks";
import { EntityDetail } from "../EntityDetailBox/EntityDetail/EntityDetail";
import { StyledTabGroup } from "../EntityDetailBox/EntityDetailBoxStyles";
import { EntityDetailTab } from "../EntityDetailBox/EntityDetailTab/EntityDetailTab";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildDraftDetail,
  createDraftRelation,
  deleteDraftRelation,
  ImportDraft,
  ImportIssue,
  updateDraftEntity,
  updateDraftRelation,
} from "utils/entityImport";
import { getStoredUserRole } from "utils/userStorage";
import { EntityImportIssueList } from "./EntityImportIssueList";
import { StyledDraftDetail, StyledDraftIssues, StyledDrafts } from "./EntityImportModalStyles";

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

  const draftEntityIds = useMemo(
    () => new Set(draft.entities.map((entity) => entity.id)),
    [draft.entities]
  );

  const updateEntity = useCallback(
    (entityId: string, changes: Partial<IEntity>) =>
      onDraftChange((current) => updateDraftEntity(current, entityId, changes)),
    [onDraftChange]
  );
  const createRelation = useCallback(
    (relation: Relation.IRelation) =>
      onDraftChange((current) => createDraftRelation(current, relation)),
    [onDraftChange]
  );
  const updateRelation = useCallback(
    (relationId: string, changes: Partial<Relation.IRelation>) =>
      onDraftChange((current) => updateDraftRelation(current, relationId, changes)),
    [onDraftChange]
  );
  const deleteRelation = useCallback(
    (relationId: string) => onDraftChange((current) => deleteDraftRelation(current, relationId)),
    [onDraftChange]
  );

  const context = useMemo<EntityDraft>(
    () => ({
      draftEntityIds,
      updateEntity,
      createRelation,
      updateRelation,
      deleteRelation,
      widthElementId: DRAFT_DETAIL_ELEMENT_ID,
    }),
    [draftEntityIds, updateEntity, createRelation, updateRelation, deleteRelation]
  );

  const detail = selectedId ? buildDraftDetail(draft, selectedId, right) : undefined;

  return (
    <EntityDraftContext.Provider value={context}>
      <StyledDrafts>
        {(errors.length > 0 || notes.length > 0) && (
          <StyledDraftIssues>
            <EntityImportIssueList
              title="Invalid input, nothing was created"
              issues={errors}
              isError
            />
            <EntityImportIssueList title="Changes the import made to the input" issues={notes} />
          </StyledDraftIssues>
        )}

        <StyledTabGroup>
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
        </StyledTabGroup>

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
    </EntityDraftContext.Provider>
  );
};
