import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Checkbox,
  Modal,
  Submit,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { useUserQuery } from "hooks/react-query";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { maxTabCount } from "Theme/constants";
import { IcoArrow90DegLeft, IcoFileText } from "Theme/icons";
import {
  addStoredRelations,
  appendTargetsOf,
  appendUndoOf,
  AppendUndo,
  count,
  draftAfterAppend,
  draftFromPlan,
  draftToImportJson,
  errorMessage,
  ImportDraft,
  ImportIssue,
  ImportWriteOutcome,
  issuesWithEntityIds,
  leftOutDrafts,
  importDataSource,
  importWriteApi,
  maxImportEntities,
  missingEntityIds,
  missingSynonymGroupIds,
  rebaseAppend,
  replaceEntityId,
  replaceUndoEntityId,
  setAllConflictChoices,
  setConflictChoice,
  storedRelationChanges,
  storedRelationsOf,
  toggleLeftOut,
  undoAppend,
  tabEntities,
  validateImport,
  withLoadedSince,
  writeImport,
} from "utils/entityImport";
import { getStoredUserRole } from "utils/userStorage";
import { EntityImportDrafts } from "./EntityImportDrafts";
import { EntityImportIssueList } from "./EntityImportIssueList";
import { EntityImportJsonEditor, EntityImportJsonEditorHandle } from "./EntityImportJsonEditor";
import {
  StyledDraftModeHint,
  StyledHiddenFileInput,
  StyledHint,
  StyledInputHint,
  StyledLoadArea,
  StyledProgress,
  StyledResult,
  StyledResultFailure,
  StyledStep,
} from "./EntityImportModalStyles";

type Step = "input" | "drafts" | "writing" | "result";

const INPUT_PLACEHOLDER = `[
  {
    "class": "C",
    "labels": ["dog"],
    "detail": "domestic canine",
    "relations": [{ "type": "SCL", "entityIds": ["<superclass id>"] }]
  }
]`;

// the drafts in the import format, in id order: moving a tab is no edit; with
// the edits to stored relations, which the import format leaves out
const draftSnapshot = (draft: ImportDraft) =>
  JSON.stringify([
    [...draftToImportJson(draft)].sort((a, b) =>
      String((a as { id: string }).id).localeCompare(String((b as { id: string }).id)),
    ),
    storedRelationChanges(draft),
  ]);

const entityCount = (amount: number) => count(amount, "entity", "entities");

// resolves once the browser has painted, so a loader set just before shows
// while the synchronous part of a validation runs
const afterPaint = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve)));

// one "append to it", with what undoing it needs
interface AppendRecord {
  undo: AppendUndo;
  storedLabel?: string;
}

// how many imported entities Import opens in Detail when asked to
const DETAIL_OPEN_COUNT = 10;

interface EntityImportModal {
  closeModal: () => void;
  // `detailOpenCount`: how many of the entities, Values not counted, to open
  // in Detail
  onImported: (entities: IEntity[], detailOpenCount: number) => void;
}

export const EntityImportModal: React.FC<EntityImportModal> = ({ closeModal, onImported }) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const { data: user } = useUserQuery();

  const [step, setStep] = useState<Step>("input");
  const [text, setText] = useState("");
  const [openInDetail, setOpenInDetail] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [inputErrors, setInputErrors] = useState<ImportIssue[]>([]);
  // the text Validate last refused; Validate stays off until it is changed
  const [refusedText, setRefusedText] = useState<string | null>(null);

  const [draft, setDraft] = useState<ImportDraft | null>(null);
  // the drafts as Validate opened them, to tell whether they were edited
  const validatedSnapshot = useRef("");
  const [draftErrors, setDraftErrors] = useState<ImportIssue[]>([]);
  const [draftNotes, setDraftNotes] = useState<ImportIssue[]>([]);
  // every "append to it" still in the drafts, by stored id
  const [appendRecords, setAppendRecords] = useState<Record<string, AppendRecord>>({});

  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [outcome, setOutcome] = useState<ImportWriteOutcome | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<EntityImportJsonEditorHandle>(null);

  // a write in progress must finish or roll back before the modal can close
  const isWriting = step === "writing";

  // Closing the modal while Import still checks the drafts cancels the
  // import: the check runs on, but nothing is written once it is done.
  const isClosedRef = useRef(false);
  // drafts changed since Validate are lost on close, so the user is asked first
  const [showCloseSubmit, setShowCloseSubmit] = useState(false);
  const closeNow = () => {
    setShowCloseSubmit(false);
    isClosedRef.current = true;
    closeModal();
  };
  const handleClose = () => {
    if (step === "drafts" && draft && draftSnapshot(draft) !== validatedSnapshot.current) {
      setShowCloseSubmit(true);
    } else {
      closeNow();
    }
  };

  const role = getStoredUserRole() as UserEnums.Role;
  const validationContext = () => ({
    role,
    defaultLanguage: user!.options.defaultLanguage,
    source: importDataSource,
  });

  // entities an edit links to are loaded, so Detail can show them as tags
  const requestedIds = useRef(new Set<string>());
  useEffect(() => {
    if (!draft) {
      return;
    }
    const ids = missingEntityIds(draft).filter((id) => !requestedIds.current.has(id));
    if (!ids.length) {
      return;
    }
    ids.forEach((id) => requestedIds.current.add(id));
    importDataSource
      .getEntities(ids)
      .then((found) =>
        setDraft(
          (current) =>
            current && {
              ...current,
              existing: {
                ...current.existing,
                ...Object.fromEntries(found.map((entity) => [entity.id, entity])),
              },
            },
        ),
      )
      .catch(() => ids.forEach((id) => requestedIds.current.delete(id)));
  }, [draft]);

  // the stored synonym groups a draft synonym joins, so Detail shows them whole
  const requestedSynonymIds = useRef(new Set<string>());
  useEffect(() => {
    if (!draft) {
      return;
    }
    const ids = missingSynonymGroupIds(draft).filter((id) => !requestedSynonymIds.current.has(id));
    if (!ids.length) {
      return;
    }
    ids.forEach((id) => requestedSynonymIds.current.add(id));
    Promise.all(
      ids.map(async (id) => {
        const groups = await importDataSource.getForwardRelations(id, RelationEnums.Type.Synonym);
        return [id, groups[0]?.entityIds ?? []] as const;
      }),
    )
      .then((found) =>
        setDraft(
          (current) =>
            current && {
              ...current,
              storedSynonyms: { ...current.storedSynonyms, ...Object.fromEntries(found) },
            },
        ),
      )
      .catch(() => ids.forEach((id) => requestedSynonymIds.current.delete(id)));
  }, [draft]);

  // the stored relations of each appended draft, so Detail shows and edits
  // them; loaded once per stored entity
  const requestedRelationIds = useRef(new Set<string>());
  useEffect(() => {
    if (!draft) {
      return;
    }
    const ids = Object.keys(draft.appends ?? {}).filter(
      (id) => !requestedRelationIds.current.has(id),
    );
    if (!ids.length) {
      return;
    }
    ids.forEach((id) => requestedRelationIds.current.add(id));
    Promise.all(ids.map(storedRelationsOf))
      .then((found) =>
        setDraft((current) => current && addStoredRelations(current, found.flat())),
      )
      .catch(() => ids.forEach((id) => requestedRelationIds.current.delete(id)));
  }, [draft]);

  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // cleared so loading the same file again fires a change
    event.target.value = "";
    if (file) {
      setText(await file.text());
      setInputErrors([]);
    }
  };

  const canValidate = !!text.trim() && text !== refusedText && !isValidating && !!user;
  const handleValidate = async () => {
    if (!user) {
      return;
    }
    setIsValidating(true);
    try {
      await afterPaint();
      const result = await validateImport(text, validationContext());
      setInputErrors(result.errors);
      setRefusedText(result.plan ? null : text);
      if (result.plan) {
        const validatedDraft = draftFromPlan(result.plan);
        validatedSnapshot.current = draftSnapshot(validatedDraft);
        setDraft(validatedDraft);
        setDraftNotes(result.notes);
        setDraftErrors([]);
        setStep("drafts");
      }
    } catch (error) {
      setInputErrors([{ message: `Validation could not finish: ${errorMessage(error)}` }]);
    } finally {
      setIsValidating(false);
    }
  };

  // the JSON field gets the drafts as they are now, edits included, to be
  // changed or replaced and validated again
  // the JSON field still holds the validated text; going back shows it again
  // and drops the drafts, so edited drafts ask first
  const [showBackSubmit, setShowBackSubmit] = useState(false);
  const handleBackToJson = () => {
    if (draft && draftSnapshot(draft) !== validatedSnapshot.current) {
      setShowBackSubmit(true);
    } else {
      goBackToJson();
    }
  };
  const goBackToJson = () => {
    setShowBackSubmit(false);
    setDraft(null);
    setDraftErrors([]);
    setDraftNotes([]);
    setAppendRecords({});
    setInputErrors([]);
    requestedIds.current.clear();
    requestedRelationIds.current.clear();
    requestedSynonymIds.current.clear();
    setStep("input");
  };

  const handleDraftChange = useCallback(
    (change: (current: ImportDraft) => ImportDraft) =>
      setDraft((current) => current && change(current)),
    [],
  );

  const handleToggleLeftOut = (entityId: string) =>
    setDraft((current) => current && toggleLeftOut(current, entityId));

  const handleConflictChoice = (entityId: string, conflictIndex: number, useImported: boolean) =>
    setDraft((current) => current && setConflictChoice(current, entityId, conflictIndex, useImported));
  const handleAllConflictChoices = (useImported: boolean) =>
    setDraft((current) => current && setAllConflictChoices(current, useImported));

  // The draft takes the id of the stored entity everywhere in the drafts, and
  // the drafts are validated again: the draft is merged into the stored
  // entity, the drafts already appended keep their final state.
  const handleAppendTo = async (entityId: string, storedId: string): Promise<boolean> => {
    if (!draft || !user) {
      return false;
    }
    const label = draft.entities.find((entity) => entity.id === entityId)?.labels[0];
    // the left-out drafts skip the validation, so an error in them blocks
    // nothing; draftAfterAppend brings them back unchanged
    setIsValidating(true);
    try {
      await afterPaint();
      const replaced = replaceEntityId(draft, entityId, storedId);
      const json = JSON.stringify(draftToImportJson(replaced));
      const { errors, plan } = await validateImport(json, {
        ...validationContext(),
        appendTargets: appendTargetsOf(draft),
        fromDrafts: true,
        valueCopyIds: draft.valueCopyIds,
        storedRelationChanges: storedRelationChanges(replaced),
      });
      if (!plan) {
        setDraftErrors(issuesWithEntityIds(replaced, errors));
        return false;
      }
      const next = draftAfterAppend(replaced, plan);
      const storedLabel = plan.appends[storedId]?.stored.labels[0];
      // next comes from the draft before the check; what loaded meanwhile joins it
      setDraft((current) => (current ? withLoadedSince(next, draft, current) : next));
      // the earlier appends' undos follow the draft to its stored id
      setAppendRecords((records) => ({
        ...Object.fromEntries(
          Object.entries(records).map(([id, record]) => [
            id,
            { ...record, undo: replaceUndoEntityId(record.undo, entityId, storedId) },
          ])
        ),
        [storedId]: { undo: appendUndoOf(draft, entityId, storedId), storedLabel },
      }));
      setDraftErrors([]);
      setDraftNotes((notes) => [
        ...notes,
        { label, message: `appended to "${storedLabel}" in the database` },
      ]);
      return true;
    } catch (error) {
      setDraftErrors([{ message: `Validation could not finish: ${errorMessage(error)}` }]);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // only the appended draft goes back to how it was; the other drafts keep
  // every change made since
  const handleUndoAppend = (storedId: string) => {
    const record = appendRecords[storedId];
    if (!record) {
      return;
    }
    setDraft((current) => current && undoAppend(current, record.undo));
    // its stored relations load again if it is appended again
    requestedRelationIds.current.delete(storedId);
    setAppendRecords((records) => {
      const rest = { ...records };
      delete rest[storedId];
      return rest;
    });
    setDraftErrors([]);
    setDraftNotes((notes) => [
      ...notes,
      {
        label: record.undo.entity.labels[0],
        message: `no longer appended to "${record.storedLabel}"`,
      },
    ]);
  };

  // The appended draft moves onto its stored entity and stored relations as
  // the database holds them now; what it can't keep is listed in the notes.
  const handleRebase = async (entityId: string) => {
    if (!draft) {
      return;
    }
    const entityOf = (id: string) =>
      draft.entities.find((entity) => entity.id === id) ?? draft.existing[id];
    const labelOf = (id: string) => entityOf(id)?.labels[0] ?? id;
    const label = labelOf(entityId);
    const withoutStale = (issues: ImportIssue[]) =>
      issues.filter((issue) => !(issue.stale && issue.entityId === entityId));
    setIsValidating(true);
    try {
      await afterPaint();
      const [[current], relations] = await Promise.all([
        importDataSource.getEntities([entityId]),
        storedRelationsOf(entityId),
      ]);
      if (!current) {
        setDraftErrors((errors) => [
          ...withoutStale(errors),
          {
            entityId,
            label,
            message: `"${label}" is no longer in the database; leave it out, or go back to JSON`,
          },
        ]);
        return;
      }
      const rebased = rebaseAppend(draft, entityId, current, relations, labelOf);
      setDraft((currentDraft) =>
        currentDraft ? withLoadedSince(rebased.draft, draft, currentDraft, entityId) : rebased.draft
      );
      setDraftErrors(withoutStale);
      setDraftNotes((notes) => [
        ...notes,
        { label, entityId, message: "moved onto its current database version" },
        ...rebased.notes.map((message) => ({ label, entityId, message })),
      ]);
    } catch (error) {
      setDraftErrors((errors) => [
        ...errors,
        { message: `The database version could not load: ${errorMessage(error)}` },
      ]);
    } finally {
      setIsValidating(false);
    }
  };

  // Import removes the stored relations the drafts unlinked, so it asks first
  const [showRemoveSubmit, setShowRemoveSubmit] = useState(false);
  const relationChanges = draft ? storedRelationChanges(draft) : { updated: [], deleted: [] };
  const handleCreate = () => {
    if (relationChanges.deleted.length) {
      setShowRemoveSubmit(true);
    } else {
      createDrafts();
    }
  };

  const createDrafts = async () => {
    setShowRemoveSubmit(false);
    if (!draft || !user) {
      return;
    }

    // the edited drafts go through the same checks as pasted JSON; an edit or
    // a closed tab can leave something the import cannot create
    setIsValidating(true);
    let plan;
    try {
      await afterPaint();
      const result = await validateImport(JSON.stringify(draftToImportJson(draft)), {
        ...validationContext(),
        appendTargets: appendTargetsOf(draft),
        allowAppend: false,
        valueCopyIds: draft.valueCopyIds,
        storedRelationChanges: relationChanges,
      });
      setDraftErrors(issuesWithEntityIds(draft, result.errors));
      plan = result.plan && { ...result.plan, storedRelationChanges: relationChanges };
    } catch (error) {
      setDraftErrors([{ message: `Validation could not finish: ${errorMessage(error)}` }]);
    } finally {
      setIsValidating(false);
    }
    if (!plan || isClosedRef.current) {
      return;
    }

    setStep("writing");
    setProgress({
      done: 0,
      total:
        plan.entities.length +
        plan.relations.length +
        relationChanges.updated.length +
        relationChanges.deleted.length,
    });

    let result: ImportWriteOutcome;
    try {
      result = await writeImport(plan, importWriteApi, (done, total) =>
        setProgress({ done, total }),
      );
    } catch (error) {
      // only the check before the first write can throw; nothing was written
      result = {
        status: "conflict",
        errors: [{ message: `The import could not start: ${errorMessage(error)}` }],
      };
    }

    if (result.status === "created") {
      onImported(plan.entities, detailOpenCount);
      // the Value copies were made by the import, not given in the input
      const copyCount = result.entityIds.filter((id) => draft.valueCopyIds?.includes(id)).length;
      const relations = count(result.relationCount, "relation", "relations");
      const appended = result.appendedIds.length
        ? `, appended to ${entityCount(result.appendedIds.length)}`
        : "";
      const copies = copyCount
        ? `; ${count(copyCount, "Value", "Values")} created`
        : "";
      const stored = [
        result.updatedRelationCount ? `${result.updatedRelationCount} changed` : "",
        result.deletedRelationCount ? `${result.deletedRelationCount} unlinked` : "",
      ]
        .filter(Boolean)
        .join(", ");
      toast.info(
        `Imported ${entityCount(result.entityIds.length - copyCount)}${appended}, ${relations}${copies}${
          stored ? `; stored relations: ${stored}` : ""
        }`,
      );
      closeModal();
    } else if (result.status === "conflict") {
      setDraftErrors(result.errors);
      setStep("drafts");
    } else {
      setOutcome(result);
      setStep("result");
    }
  };

  const leftOut = draft ? leftOutDrafts(draft) : new Map<string, string>();
  const included = draft ? tabEntities(draft).filter((entity) => !leftOut.has(entity.id)) : [];
  const draftCount = included.length;
  // Values never open in Detail, and Detail holds at most maxTabCount tabs
  const detailOpenMax = Math.min(
    included.filter((entity) => entity.class !== EntityEnums.Class.Value).length,
    maxTabCount
  );
  const detailOpenCount = openInDetail ? Math.min(DETAIL_OPEN_COUNT, detailOpenMax) : 0;

  return (
    <Modal
      showModal={showModal}
      // the list, Detail and the append column side by side, up to 1300px,
      // past which Detail only gets wider lines
      width="full"
      maxWidth={1300}
      // the JSON field and the Detail of the drafts fill the height; the
      // result keeps the height of its content
      fullHeight={step === "input" || step === "drafts"}
      narrowGutter
      onClose={isWriting ? undefined : handleClose}
      disableEscapeClose={isWriting}
      disableBgClick
      isLoading={isValidating}
    >
      <ModalHeader
        title="Import entities from JSON"
        onClose={isWriting ? undefined : handleClose}
      />
      {/* only a scrolling body shrinks below its content, so the Detail of the
          drafts fits the window instead of pushing the footer out of it */}
      <ModalContent column enableScroll>
        {step === "input" && (
          <StyledStep>
            <StyledLoadArea type="button" onClick={() => fileInputRef.current?.click()}>
              <IcoFileText />
              {"Load a .json file"}
            </StyledLoadArea>
            <EntityImportJsonEditor
              ref={editorRef}
              value={text}
              onChange={setText}
              placeholder={INPUT_PLACEHOLDER}
              onSubmit={() => canValidate && handleValidate()}
            />
            <StyledHiddenFileInput
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileLoad}
            />
            <EntityImportIssueList
              title="Invalid input, nothing was created"
              issues={inputErrors}
              isError
              onSelectOffset={(offset) => editorRef.current?.reveal(offset)}
            />
          </StyledStep>
        )}

        {step === "drafts" && draft && (
          <>
            {draftCount === 0 && (
              <StyledHint>{"Every entity was left out; there is nothing to create."}</StyledHint>
            )}
            <EntityImportDrafts
              draft={draft}
              onDraftChange={handleDraftChange}
              onToggleLeftOut={handleToggleLeftOut}
              onConflictChoice={handleConflictChoice}
              onAllConflictChoices={handleAllConflictChoices}
              onAppendTo={handleAppendTo}
              undoableAppendIds={Object.keys(appendRecords)}
              onUndoAppend={handleUndoAppend}
              onRebase={handleRebase}
              errors={draftErrors}
              notes={draftNotes}
            />
          </>
        )}

        {step === "writing" && (
          <StyledProgress>{`Creating ${progress.done}/${progress.total}…`}</StyledProgress>
        )}

        {step === "result" && outcome && outcome.status === "rolledBack" && (
          <StyledResult>
            <StyledResultFailure>{outcome.failure}</StyledResultFailure>
            <p>
              {`Rolled back: ${outcome.entityCount} entities, ${outcome.appendCount} appends, ${outcome.relationCount} relations, ${outcome.storedRelationCount} stored relations put back. Nothing was imported.`}
            </p>
          </StyledResult>
        )}
        {step === "result" && outcome && outcome.status === "rollbackFailed" && (
          <StyledResult>
            <StyledResultFailure>{outcome.failure}</StyledResultFailure>
            <EntityImportIssueList
              title="The rollback could not undo everything. Still in the database:"
              issues={outcome.leftovers.map((leftover) => ({ message: leftover }))}
              isError
            />
          </StyledResult>
        )}
      </ModalContent>

      <ModalFooter spaceBetween={step === "input" || step === "drafts"}>
        {step === "input" && (
          <>
            <StyledInputHint>
              {`Load a .json file or paste up to ${maxImportEntities(role)} entities as a JSON object or array. Detail's JSON section shows this format. An entity whose id is in the database is appended to it.`}
            </StyledInputHint>
            <ButtonGroup>
              <CancelButton onClick={handleClose} />
              <Button
                label="Validate"
                color="info"
                disabled={!canValidate}
                onClick={handleValidate}
              />
            </ButtonGroup>
          </>
        )}
        {step === "drafts" && (
          <>
            <Button
              label="back to JSON"
              icon={<IcoArrow90DegLeft />}
              inverted
              disabled={isValidating}
              onClick={handleBackToJson}
            />
            <StyledDraftModeHint>
              {
                "Draft mode. Nothing is saved until Import, so suggesters can't create new entities. The × on a row leaves its entity out until you bring it back."
              }
            </StyledDraftModeHint>
            <ButtonGroup>
              <Checkbox
                label="open in Detail"
                value={openInDetail && detailOpenMax > 0}
                disabled={detailOpenMax === 0}
                tooltipLabel={`Import opens up to ${DETAIL_OPEN_COUNT} of the imported entities in Detail; Values never open`}
                onChangeFn={setOpenInDetail}
              />
              <CancelButton onClick={handleClose} />
              <Button
                label={`Import ${entityCount(draftCount)}`}
                color="info"
                disabled={draftCount === 0 || isValidating}
                onClick={handleCreate}
              />
            </ButtonGroup>
          </>
        )}
        {step === "result" && (
          <ButtonGroup>
            {/* the drafts are kept, so the import can be tried again */}
            <CancelButton
              label="Back"
              onClick={() => {
                setOutcome(null);
                setStep("drafts");
              }}
            />
            <Button label="Close" color="info" onClick={handleClose} />
          </ButtonGroup>
        )}
      </ModalFooter>

      <Submit
        title="Back to JSON"
        text="The JSON field shows the input as you pasted it. Your changes in the drafts will be lost."
        submitLabel="Discard changes and go back"
        cancelLabel="Keep editing"
        show={showBackSubmit}
        onSubmit={goBackToJson}
        onCancel={() => setShowBackSubmit(false)}
      />
      <Submit
        title="Remove stored relations"
        text={`The import also removes ${count(
          relationChanges.deleted.length,
          "stored relation",
          "stored relations",
        )} you unlinked${
          relationChanges.updated.length
            ? ` and changes ${count(
                relationChanges.updated.length,
                "stored relation",
                "stored relations",
              )}`
            : ""
        }, in the database.`}
        submitLabel="Import"
        show={showRemoveSubmit}
        onSubmit={createDrafts}
        onCancel={() => setShowRemoveSubmit(false)}
      />
      <Submit
        title="Close the import"
        text="Nothing has been imported. Your changes in the drafts will be lost."
        submitLabel="Discard changes and close"
        cancelLabel="Keep editing"
        show={showCloseSubmit}
        onSubmit={closeNow}
        onCancel={() => setShowCloseSubmit(false)}
      />
    </Modal>
  );
};
