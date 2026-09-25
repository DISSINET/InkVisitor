import { UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { useUserQuery } from "hooks/react-query";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { IcoFileText } from "Theme/icons";
import {
  errorMessage,
  ImportValidation,
  ImportWriteOutcome,
  importDataSource,
  importWriteApi,
  MAX_IMPORT_ENTITIES,
  validateImport,
  writeImport,
} from "utils/entityImport";
import { getStoredUserRole } from "utils/userStorage";
import { EntityImportIssueList } from "./EntityImportIssueList";
import {
  StyledHiddenFileInput,
  StyledHint,
  StyledJsonInput,
  StyledProgress,
  StyledResult,
  StyledResultFailure,
  StyledStep,
} from "./EntityImportModalStyles";
import { EntityImportPreview } from "./EntityImportPreview/EntityImportPreview";

type Step = "input" | "preview" | "writing" | "result";

// room for the placeholder example; longer input grows the field
const MIN_INPUT_ROWS = 10;

const INPUT_PLACEHOLDER = `[
  {
    "class": "C",
    "labels": ["dog"],
    "detail": "domestic canine",
    "relations": [{ "type": "SCL", "entityIds": ["<this entity's id>", "<superclass id>"] }]
  }
]`;

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
  const [validation, setValidation] = useState<ImportValidation | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [outcome, setOutcome] = useState<ImportWriteOutcome | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // a write in progress must finish or roll back before the modal can close
  const isWriting = step === "writing";

  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // cleared so loading the same file again fires a change
    event.target.value = "";
    if (file) {
      setText(await file.text());
      setValidation(null);
    }
  };

  const handleValidate = async () => {
    if (!user) {
      return;
    }
    setIsValidating(true);
    try {
      const result = await validateImport(text, {
        role: getStoredUserRole() as UserEnums.Role,
        defaultLanguage: user.options.defaultLanguage,
        source: importDataSource,
      });
      setValidation(result);
      if (result.plan) {
        setStep("preview");
      }
    } catch (error) {
      setValidation({
        errors: [{ message: `Validation could not finish: ${errorMessage(error)}` }],
        notes: [],
        plan: null,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreate = async () => {
    const plan = validation?.plan;
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
        `Imported ${plan.entities.length} ${plan.entities.length === 1 ? "entity" : "entities"}, ${
          result.relationCount
        } ${result.relationCount === 1 ? "relation" : "relations"}`
      );
      closeModal();
    } else if (result.status === "conflict") {
      setValidation({ errors: result.errors, notes: [], plan: null });
      setStep("input");
    } else {
      setOutcome(result);
      setStep("result");
    }
  };

  const plan = validation?.plan;

  return (
    <Modal
      showModal={showModal}
      width={900}
      onClose={isWriting ? undefined : closeModal}
      disableEscapeClose={isWriting}
      disableBgClick
      isLoading={isValidating}
    >
      <ModalHeader title="Import entities from JSON" />
      <ModalContent column enableScroll>
        {step === "input" && (
          <StyledStep>
            <StyledHint>
              {`Paste up to ${MAX_IMPORT_ENTITIES} entities as a JSON object or array, or load a .json file. "Copy as import JSON" in the JSON section of Detail gives an example.`}
            </StyledHint>
            <StyledJsonInput>
              <Input
                type="textarea"
                value={text}
                onChangeFn={(newText) => {
                  setText(newText);
                }}
                changeOnType
                width="full"
                rows={Math.max(MIN_INPUT_ROWS, text.split("\n").length + 1)}
                placeholder={INPUT_PLACEHOLDER}
              />
            </StyledJsonInput>
            <StyledHiddenFileInput
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileLoad}
            />
            {validation && (
              <EntityImportIssueList
                title="Invalid input, nothing was created"
                issues={validation.errors}
                isError
              />
            )}
          </StyledStep>
        )}

        {step === "preview" && plan && validation && (
          <EntityImportPreview plan={plan} notes={validation.notes} />
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
        {step === "preview" && plan && (
          <ButtonGroup>
            <CancelButton label="Back" onClick={() => setStep("input")} />
            <Button
              label={`Create ${plan.entities.length} ${
                plan.entities.length === 1 ? "entity" : "entities"
              }`}
              color="info"
              onClick={handleCreate}
            />
          </ButtonGroup>
        )}
        {step === "result" && (
          <ButtonGroup>
            <CancelButton
              label="Back"
              onClick={() => {
                setOutcome(null);
                setValidation(null);
                setStep("input");
              }}
            />
            <Button label="Close" color="info" onClick={closeModal} />
          </ButtonGroup>
        )}
      </ModalFooter>
    </Modal>
  );
};
