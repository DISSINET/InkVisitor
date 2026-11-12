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
import update from "immutability-helper";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { IcoArrow90DegLeft, IcoFileText } from "Theme/icons";
import {
  appendTargetsOf,
  count,
  draftAfterAppend,
  draftFromPlan,
  draftToImportJson,
  errorMessage,
  ImportDraft,
  ImportIssue,
  ImportWriteOutcome,
  importDataSource,
  importWriteApi,
  maxImportEntities,
  missingEntityIds,
  missingSynonymGroupIds,
  removeDraftEntity,
  replaceEntityId,
  setConflictChoice,
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
  StyledEditorArea,
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

// one "append to it", with the drafts and notes from just before it
interface AppendStep {
  storedId: string;
  storedLabel?: string;
  before: ImportDraft;
  notesBefore: ImportIssue[];
  // the drafts right after it, to tell whether anything changed since
  after: string;
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
  // every "append to it" still in the drafts, oldest first
  const [appendSteps, setAppendSteps] = useState<AppendStep[]>([]);
  // the undo waiting for the user to accept losing the changes made since
  const [undoSubmitStep, setUndoSubmitStep] = useState<AppendStep | null>(null);

  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [outcome, setOutcome] = useState<ImportWriteOutcome | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // a write in progress must finish or roll back before the modal can close
  const isWriting = step === "writing";

  // Closing the modal while Import still checks the drafts cancels the
  // import: the check runs on, but nothing is written once it is done.
  const isClosedRef = useRef(false);
  const handleClose = () => {
    isClosedRef.current = true;
    closeModal();
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
    setAppendSteps([]);
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

  const handleCloseTab = (entityId: string) => {
    if (!draft) {
      return;
    }
    const entity = draft.entities.find((candidate) => candidate.id === entityId);
    const { draft: rest, removedRelations, cleanups } = removeDraftEntity(draft, entityId);
    setDraft(rest);
    const labelOf = (id: string) =>
      draft.entities.find((candidate) => candidate.id === id)?.labels[0];
    setDraftNotes((notes) => [
      ...notes,
      {
        label: entity?.labels[0],
        message: `left out of the import${
          removedRelations.length
            ? `, with ${removedRelations.length} ${
                removedRelations.length === 1 ? "relation" : "relations"
              }`
            : ""
        }`,
      },
      // the other drafts no longer point at it
      ...cleanups.map((cleanup) => ({
        label: labelOf(cleanup.entityId),
        message: `${cleanup.changes.join(", ")} (they pointed at "${entity?.labels[0]}")`,
      })),
    ]);
  };

  const handleConflictChoice = (entityId: string, conflictIndex: number, useImported: boolean) =>
    setDraft((current) => current && setConflictChoice(current, entityId, conflictIndex, useImported));

  // The draft takes the id of the stored entity everywhere in the drafts, and
  // the drafts are validated again: the draft is merged into the stored
  // entity, the drafts already appended keep their final state.
  const handleAppendTo = async (entityId: string, storedId: string): Promise<boolean> => {
    if (!draft || !user) {
      return false;
    }
    const label = draft.entities.find((entity) => entity.id === entityId)?.labels[0];
    const json = JSON.stringify(draftToImportJson(replaceEntityId(draft, entityId, storedId)));
    setIsValidating(true);
    try {
      const { errors, plan } = await validateImport(json, {
        ...validationContext(),
        appendTargets: appendTargetsOf(draft),
      });
      if (!plan) {
        setDraftErrors(errors);
        return false;
      }
      const next = draftAfterAppend(draft, plan);
      const storedLabel = plan.appends[storedId]?.stored.labels[0];
      setDraft(next);
      setAppendSteps((steps) => [
        ...steps,
        {
          storedId,
          storedLabel,
          before: draft,
          notesBefore: draftNotes,
          after: draftSnapshot(next),
        },
      ]);
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

  // The drafts go back to how they were just before the append, so the
  // changes made since are lost, later appends included; the user is asked
  // first when there are any.
  const handleUndoAppend = (storedId: string) => {
    const step = appendSteps.find((candidate) => candidate.storedId === storedId);
    if (!step || !draft) {
      return;
    }
    if (draftSnapshot(draft) === step.after) {
      undoAppend(step);
    } else {
      setUndoSubmitStep(step);
    }
  };
  const undoAppend = (step: AppendStep) => {
    setUndoSubmitStep(null);
    // the entities and synonym groups loaded since stay known
    setDraft(
      (current) =>
        current && {
          ...step.before,
          existing: { ...step.before.existing, ...current.existing },
          storedSynonyms: { ...step.before.storedSynonyms, ...current.storedSynonyms },
        },
    );
    setDraftNotes(step.notesBefore);
    setDraftErrors([]);
    setAppendSteps((steps) => steps.slice(0, steps.indexOf(step)));
  };

  // the indexes count tabs; the Value copies, which have none, stay first
  const handleMoveTab = useCallback(
    (dragIndex: number, hoverIndex: number) =>
      setDraft((current) => {
        if (!current) {
          return current;
        }
        const tabs = tabEntities(current);
        const copies = current.entities.filter((entity) => !tabs.includes(entity));
        return {
          ...current,
          entities: [
            ...copies,
            ...update(tabs, {
              $splice: [
                [dragIndex, 1],
                [hoverIndex, 0, tabs[dragIndex]],
              ],
            }),
          ],
        };
      }),
    [],
  );

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
      });
      setDraftErrors(result.errors);
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

  const draftCount = draft ? tabEntities(draft).length : 0;

  return (
    <Modal
      showModal={showModal}
      // wide enough for a relation line with two ids to fit unwrapped
      width="fat"
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
      <ModalContent column enableScroll={step !== "drafts"}>
        {step === "input" && (
          <StyledStep>
            <StyledEditorArea>
              <EntityImportJsonEditor
                value={text}
                onChange={setText}
                placeholder={INPUT_PLACEHOLDER}
              />
              <StyledLoadArea type="button" onClick={() => fileInputRef.current?.click()}>
                <IcoFileText />
                {"Load a .json file"}
              </StyledLoadArea>
            </StyledEditorArea>
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
              onCloseTab={handleCloseTab}
              onMoveTab={handleMoveTab}
              onConflictChoice={handleConflictChoice}
              onAppendTo={handleAppendTo}
              undoableAppendIds={appendSteps.map((step) => step.storedId)}
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
                "Draft mode. Nothing is saved until Import, so suggesters can't create new entities. Close a tab to leave its entity out."
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
        text="The JSON field shows the input as you pasted it. Your changes in the tabs will be lost."
        submitLabel="Back to JSON"
        show={showBackSubmit}
        onSubmit={goBackToJson}
        onCancel={() => setShowBackSubmit(false)}
      />
      <Submit
        title="Undo append"
        text={`The tabs go back to how they were before the append to "${undoSubmitStep?.storedLabel}". The changes made in the tabs since then will be lost.`}
        submitLabel="Undo append"
        show={!!undoSubmitStep}
        onSubmit={() => undoSubmitStep && undoAppend(undoSubmitStep)}
        onCancel={() => setUndoSubmitStep(null)}
      />
    </Modal>
  );
};
