import { UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { useUserQuery } from "hooks/react-query";
import update from "immutability-helper";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { IcoFileText } from "Theme/icons";
import {
  draftFromPlan,
  draftToImportJson,
  errorMessage,
  ImportDraft,
  ImportIssue,
  ImportWriteOutcome,
  importDataSource,
  importWriteApi,
  MAX_IMPORT_ENTITIES,
  missingEntityIds,
  removeDraftEntity,
  validateImport,
  writeImport,
} from "utils/entityImport";
import { getStoredUserRole } from "utils/userStorage";
import { EntityImportDrafts } from "./EntityImportDrafts";
import { EntityImportIssueList } from "./EntityImportIssueList";
import { EntityImportJsonEditor } from "./EntityImportJsonEditor";
import {
  StyledHiddenFileInput,
  StyledHint,
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
    "relations": [{ "type": "SCL", "entityIds": ["<this entity's id>", "<superclass id>"] }]
  }
]`;

const entityCount = (count: number) => `${count} ${count === 1 ? "entity" : "entities"}`;

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

  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [draftErrors, setDraftErrors] = useState<ImportIssue[]>([]);
  const [draftNotes, setDraftNotes] = useState<ImportIssue[]>([]);

  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [outcome, setOutcome] = useState<ImportWriteOutcome | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // a write in progress must finish or roll back before the modal can close
  const isWriting = step === "writing";

  const validationContext = () => ({
    role: getStoredUserRole() as UserEnums.Role,
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
        setDraft((current) =>
          current && {
            ...current,
            existing: {
              ...current.existing,
              ...Object.fromEntries(found.map((entity) => [entity.id, entity])),
            },
          }
        )
      )
      .catch(() => ids.forEach((id) => requestedIds.current.delete(id)));
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
      if (result.plan) {
        setDraft(draftFromPlan(result.plan));
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

  const handleDraftChange = useCallback(
    (change: (current: ImportDraft) => ImportDraft) =>
      setDraft((current) => current && change(current)),
    []
  );

  const handleCloseTab = (entityId: string) => {
    if (!draft) {
      return;
    }
    const entity = draft.entities.find((candidate) => candidate.id === entityId);
    const { draft: rest, removedRelations } = removeDraftEntity(draft, entityId);
    setDraft(rest);
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
    ]);
  };

  const handleMoveTab = useCallback(
    (dragIndex: number, hoverIndex: number) =>
      setDraft(
        (current) =>
          current && {
            ...current,
            entities: update(current.entities, {
              $splice: [
                [dragIndex, 1],
                [hoverIndex, 0, current.entities[dragIndex]],
              ],
            }),
          }
      ),
    []
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
      const result = await validateImport(
        JSON.stringify(draftToImportJson(draft)),
        validationContext()
      );
      setDraftErrors(result.errors);
      plan = result.plan;
    } catch (error) {
      setDraftErrors([{ message: `Validation could not finish: ${errorMessage(error)}` }]);
    } finally {
      setIsValidating(false);
    }
    if (!plan) {
      return;
    }

    setStep("writing");
    setProgress({ done: 0, total: plan.entities.length + plan.relations.length });

    let result: ImportWriteOutcome;
    try {
      result = await writeImport(plan, importWriteApi, (done, total) =>
        setProgress({ done, total })
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
      toast.info(
        `Imported ${entityCount(plan.entities.length)}, ${result.relationCount} ${
          result.relationCount === 1 ? "relation" : "relations"
        }`
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

  const draftCount = draft?.entities.length ?? 0;

  return (
    <Modal
      showModal={showModal}
      // wide enough for a relation line with two ids to fit unwrapped
      width="fat"
      // the JSON field and the Detail of the drafts fill the height; the
      // result keeps the height of its content
      fullHeight={step === "input" || step === "drafts"}
      onClose={isWriting ? undefined : closeModal}
      disableEscapeClose={isWriting}
      disableBgClick
      isLoading={isValidating}
    >
      <ModalHeader title="Import entities from JSON" />
      <ModalContent column enableScroll={step !== "drafts"}>
        {step === "input" && (
          <StyledStep>
            <StyledHint>
              {`Paste up to ${MAX_IMPORT_ENTITIES} entities as a JSON object or array, or load a .json file. Detail's JSON section shows this format; give a copy a new id.`}
            </StyledHint>
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
              onCloseTab={handleCloseTab}
              onMoveTab={handleMoveTab}
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
              {`Rolled back: ${outcome.entityCount} entities, ${outcome.relationCount} relations. Nothing was imported.`}
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

      <ModalFooter spaceBetween={step === "input"}>
        {step === "input" && (
          <>
            <Button
              label="load file"
              icon={<IcoFileText />}
              inverted
              onClick={() => fileInputRef.current?.click()}
            />
            <ButtonGroup>
              <CancelButton onClick={closeModal} />
              <Button
                label="Validate"
                color="info"
                disabled={!text.trim() || isValidating || !user}
                onClick={handleValidate}
              />
            </ButtonGroup>
          </>
        )}
        {step === "drafts" && (
          <ButtonGroup>
            <CancelButton onClick={closeModal} />
            <Button
              label={`Create ${entityCount(draftCount)}`}
              color="info"
              disabled={draftCount === 0 || isValidating}
              onClick={handleCreate}
            />
          </ButtonGroup>
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
            <Button label="Close" color="info" onClick={closeModal} />
          </ButtonGroup>
        )}
      </ModalFooter>
    </Modal>
  );
};
