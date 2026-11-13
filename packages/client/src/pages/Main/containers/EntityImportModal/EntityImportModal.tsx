import { RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Modal,
  Submit,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { useUserQuery } from "hooks/react-query";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { IcoArrow90DegLeft, IcoFileText } from "Theme/icons";
import {
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
  replaceEntityId,
  replaceUndoEntityId,
  setAllConflictChoices,
  setConflictChoice,
  toggleLeftOut,
  undoAppend,
  tabEntities,
  validateImport,
  writeImport,
} from "utils/entityImport";
import { getStoredUserRole } from "utils/userStorage";
import { EntityImportDrafts } from "./EntityImportDrafts";
import { EntityImportIssueList } from "./EntityImportIssueList";
import { EntityImportJsonEditor } from "./EntityImportJsonEditor";
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

// the drafts in the import format, in id order: moving a tab is no edit
const draftSnapshot = (draft: ImportDraft) =>
  JSON.stringify(
    [...draftToImportJson(draft)].sort((a, b) =>
      String((a as { id: string }).id).localeCompare(String((b as { id: string }).id)),
    ),
  );

const entityCount = (amount: number) => count(amount, "entity", "entities");

// one "append to it", with what undoing it needs
interface AppendRecord {
  undo: AppendUndo;
  storedLabel?: string;
}

interface EntityImportModal {
  closeModal: () => void;
  onImported: (entities: IEntity[]) => void;
}

export const EntityImportModal: React.FC<EntityImportModal> = ({ closeModal, onImported }) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const { data: user } = useUserQuery();

  const [step, setStep] = useState<Step>("input");
  const [text, setText] = useState("");
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

  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // cleared so loading the same file again fires a change
    event.target.value = "";
    if (file) {
      setText(await file.text());
      setInputErrors([]);
    }
  };

  const handleValidate = async () => {
    if (!user) {
      return;
    }
    setIsValidating(true);
    try {
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
    const replaced = replaceEntityId(draft, entityId, storedId);
    // the drafts left out are validated too, so they stay in the drafts
    const everyDraft = { ...replaced, leftOutIds: [] };
    const json = JSON.stringify(draftToImportJson(everyDraft));
    setIsValidating(true);
    try {
      const { errors, plan } = await validateImport(json, {
        ...validationContext(),
        appendTargets: appendTargetsOf(draft),
        fromDrafts: true,
        valueCopyIds: draft.valueCopyIds,
      });
      if (!plan) {
        setDraftErrors(issuesWithEntityIds(everyDraft, errors));
        return false;
      }
      const next = draftAfterAppend(replaced, plan);
      const storedLabel = plan.appends[storedId]?.stored.labels[0];
      setDraft(next);
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

  const handleCreate = async () => {
    if (!draft || !user) {
      return;
    }

    // the edited drafts go through the same checks as pasted JSON; an edit or
    // a closed tab can leave something the import cannot create
    setIsValidating(true);
    let plan;
    try {
      const result = await validateImport(JSON.stringify(draftToImportJson(draft)), {
        ...validationContext(),
        appendTargets: appendTargetsOf(draft),
        allowAppend: false,
        valueCopyIds: draft.valueCopyIds,
      });
      setDraftErrors(issuesWithEntityIds(draft, result.errors));
      plan = result.plan;
    } catch (error) {
      setDraftErrors([{ message: `Validation could not finish: ${errorMessage(error)}` }]);
    } finally {
      setIsValidating(false);
    }
    if (!plan || isClosedRef.current) {
      return;
    }

    setStep("writing");
    setProgress({ done: 0, total: plan.entities.length + plan.relations.length });

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
      onImported(plan.entities);
      // the Value copies were made by the import, not given in the input
      const copyCount = result.entityIds.filter((id) => draft.valueCopyIds?.includes(id)).length;
      const relations = count(result.relationCount, "relation", "relations");
      const appended = result.appendedIds.length
        ? `, appended to ${entityCount(result.appendedIds.length)}`
        : "";
      const copies = copyCount
        ? `; ${count(copyCount, "Value", "Values")} created`
        : "";
      toast.info(
        `Imported ${entityCount(result.entityIds.length - copyCount)}${appended}, ${relations}${copies}`,
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
  const draftCount = draft
    ? tabEntities(draft).filter((entity) => !leftOut.has(entity.id)).length
    : 0;

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
              value={text}
              onChange={setText}
              placeholder={INPUT_PLACEHOLDER}
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
              {`Rolled back: ${outcome.entityCount} entities, ${outcome.appendCount} appends, ${outcome.relationCount} relations. Nothing was imported.`}
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
                disabled={!text.trim() || text === refusedText || isValidating || !user}
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
        submitLabel="Back to JSON"
        show={showBackSubmit}
        onSubmit={goBackToJson}
        onCancel={() => setShowBackSubmit(false)}
      />
      <Submit
        title="Close the import"
        text="Nothing has been imported. Your changes in the drafts will be lost."
        submitLabel="Close"
        show={showCloseSubmit}
        onSubmit={closeNow}
        onCancel={() => setShowCloseSubmit(false)}
      />
    </Modal>
  );
};
