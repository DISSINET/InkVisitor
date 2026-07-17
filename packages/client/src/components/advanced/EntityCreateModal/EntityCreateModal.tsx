import { getStoredUserRole } from "utils/userStorage";
import {
  actionPartOfSpeechDict,
  conceptPartOfSpeechDict,
} from "@inkvisitor/shared/dictionaries";
import { classesAll, entitiesDictKeys } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { DropdownItem, IEntity, IResponseEntity } from "@inkvisitor/shared/types";
import { useMutation } from "@tanstack/react-query";
import {
  MIN_LABEL_LENGTH_MESSAGE,
  excludedSuggesterEntities,
  rootTerritoryId,
} from "Theme/constants";
import api from "api";
import {
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
  ModalInputLabel,
  ModalInputWrap,
} from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import { CAction, CConcept, CEntity, CStatement, CTerritory, InstTemplate } from "constructors";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getEntityLabel, getShortLabelByLetterCount } from "utils/utils";
import { StyledNote } from "./EntityCreateModalStyles";
import { useOrderedLanguageDict, useTemplatesQuery, useUserQuery } from "hooks/react-query";

const defaultDropdownValue = "empty";
interface EntityCreateModal {
  closeModal: () => void;
  // not obligatory, only for specific creation like from annotator where calculation of order is needed
  onCreateStatement?: (entityCreateModalProps?: {
    label: string;
    detail: string;
    territoryId: string;
    language: EntityEnums.Language;
  }) => void;
  onMutationSuccess?: (entity: IEntity) => void;

  labelTyped?: string;
  categorySelected?: EntityEnums.Class;
  languageSelected?: EntityEnums.Language;
  // init for create T / S
  parentTerritory?: IEntity;
  entityCreateStatementOrder?: number;
  // order among sibling territories, computed by the annotator from the anchor
  // position so a new subT lands in the relevant place (like statements)
  entityCreateTerritoryOrder?: number;

  allowedEntityClasses?: EntityEnums.Class[];
}
export const EntityCreateModal: React.FC<EntityCreateModal> = ({
  closeModal,
  onCreateStatement = undefined,
  onMutationSuccess = () => {},
  labelTyped = "",
  categorySelected,
  languageSelected,
  parentTerritory,
  entityCreateStatementOrder,
  entityCreateTerritoryOrder,
  allowedEntityClasses,
}) => {
  const entityClasses = allowedEntityClasses ? allowedEntityClasses : classesAll;

  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  // Statements are not meant to carry a label — start empty so the hint
  // placeholder shows instead of prefilling the selected text.
  const [label, setLabel] = useState(
    categorySelected === EntityEnums.Class.Statement ? "" : labelTyped
  );
  const [detailTyped, setDetailTyped] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EntityEnums.Class>(
    categorySelected || entityClasses[0]
  );
  const [selectedLanguage, setSelectedLanguage] = useState<EntityEnums.Language>(
    languageSelected || EntityEnums.Language.Empty
  );
  const [actionPos, setActionPos] = useState<EntityEnums.ActionPartOfSpeech>(
    EntityEnums.ActionPartOfSpeech.Verb
  );
  const [conceptPos, setConceptPos] = useState<EntityEnums.ConceptPartOfSpeech>(
    EntityEnums.ConceptPartOfSpeech.Empty
  );
  const [territoryEntity, setTerritoryEntity] = useState<false | IEntity>(parentTerritory || false);

  const { data: user } = useUserQuery();

  const orderedLanguageDict = useOrderedLanguageDict();

  useEffect(() => {
    if (user && !languageSelected) {
      setSelectedLanguage(user.options.defaultLanguage);
    }
  }, [user]);

  const entityCreateMutation = useMutation({
    mutationFn: async (newEntity: IEntity) => await api.entityCreate(newEntity),
    onSuccess: (data, variables) => {
      onMutationSuccess(variables);
      closeModal();
    },
  });

  const userRole = getStoredUserRole() as UserEnums.Role;

  // User rights validation for the parent territory is filtered in Suggester for parent territory
  const validateEntityCreation = (skipLabelCheck = false) => {
    if (userRole === UserEnums.Role.Viewer) {
      toast.warning("You don't have permission to create entities");
      return false;
    } else if (
      !skipLabelCheck &&
      selectedCategory !== EntityEnums.Class.Statement &&
      label.length < 1
    ) {
      toast.info(MIN_LABEL_LENGTH_MESSAGE);
      return false;
    } else if (selectedCategory === EntityEnums.Class.Statement && !territoryEntity) {
      toast.warning("Territory is required!");
      return false;
    } else if (
      selectedCategory === EntityEnums.Class.Territory &&
      !territoryEntity &&
      userRole !== UserEnums.Role.Admin &&
      userRole !== UserEnums.Role.Owner
    ) {
      toast.warning("Parent territory is required!");
      return false;
    }
    return true;
  };

  const handleCreateActant = () => {
    const newCreated: {
      label: string;
      entityClass: EntityEnums.Class;
      detail?: string;
      language: EntityEnums.Language | null;
      territoryId?: string;
      partOfSpeech?: EntityEnums.ActionPartOfSpeech | EntityEnums.ActionPartOfSpeech;
    } = {
      label: label.trim(),
      entityClass: selectedCategory,
      detail: detailTyped,
      language: selectedLanguage,
      territoryId: territoryEntity ? territoryEntity.id : undefined,
    };

    if (user) {
      if (newCreated.entityClass === EntityEnums.Class.Statement && newCreated.territoryId) {
        if (onCreateStatement) {
          onCreateStatement({
            label: newCreated.label,
            detail: newCreated.detail || "",
            territoryId: newCreated.territoryId,
            language: newCreated.language || user.options.defaultLanguage,
          });
          // when onCreateStatement is defined, we handle the statement creation in the parent component
          // e.g. in the annotator suggester where we need to make additional calculations (like the order of the statement)
          // so we need to close the modal here (is not done in onMutationSuccess)
          closeModal();
        } else {
          const newStatement = CStatement(
            userRole,
            {
              ...user.options,
              defaultLanguage: newCreated.language || user.options.defaultLanguage,
            },
            newCreated.label,
            newCreated.detail,
            newCreated.territoryId,
            undefined,
            entityCreateStatementOrder ?? EntityEnums.Order.Last
          );
          entityCreateMutation.mutate(newStatement);
        }
      } else if (newCreated.entityClass === EntityEnums.Class.Territory) {
        const newTerritory = CTerritory(
          userRole,
          {
            ...user.options,
            defaultLanguage: newCreated.language || user.options.defaultLanguage,
          },
          newCreated.label,
          newCreated.detail || "",
          newCreated.territoryId ? newCreated.territoryId : rootTerritoryId,
          entityCreateTerritoryOrder ?? EntityEnums.Order.Last
        );
        entityCreateMutation.mutate(newTerritory);
      } else if (newCreated.entityClass === EntityEnums.Class.Action) {
        const newAction = CAction(
          {
            ...user.options,
            defaultLanguage: newCreated.language || user.options.defaultLanguage,
          },
          newCreated.label,
          actionPos,
          newCreated.detail
        );
        entityCreateMutation.mutate(newAction);
      } else if (newCreated.entityClass === EntityEnums.Class.Concept) {
        const newConcept = CConcept(
          {
            ...user.options,
            defaultLanguage: newCreated.language || user.options.defaultLanguage,
          },
          newCreated.label,
          conceptPos,
          newCreated.detail
        );
        entityCreateMutation.mutate(newConcept);
      } else {
        const newEntity = CEntity(
          {
            ...user.options,
            defaultLanguage: newCreated.language || user.options.defaultLanguage,
          },
          newCreated.entityClass,
          newCreated.label,
          newCreated.detail
        );
        entityCreateMutation.mutate(newEntity);
      }
    }
  };

  const handleSubmit = () => {
    if (validateEntityCreation()) {
      handleCreateActant();
    }
  };

  const { data: allTemplates } = useTemplatesQuery();

  const templates = useMemo(
    () => allTemplates?.filter((template) => template.class === selectedCategory),
    [allTemplates, selectedCategory]
  );

  const templateOptions: DropdownItem[] & { template: IEntity }[] = useMemo(() => {
    const options = templates
      ? templates.map((template) => ({
          value: template.id,
          label: getShortLabelByLetterCount(getEntityLabel(template), 200),
          template: template,
        }))
      : [];

    return options;
  }, [templates]);

  const handleAskForTemplateApply = (templateId: string) => {
    setShowApplyTemplateModal(true);
    const template = templates?.find((template) => template.id === templateId);
    if (template) {
      setTemplateToApply(template);
    }
  };

  const [showApplyTemplateModal, setShowApplyTemplateModal] = useState(false);
  const [templateToApply, setTemplateToApply] = useState<IResponseEntity | false>(false);

  const createEntityFromTemplate = async (templateToApply: IEntity) => {
    let newEntity: IEntity | false;
    if (selectedCategory === EntityEnums.Class.Territory) {
      newEntity = await InstTemplate(
        templateToApply,
        userRole,
        // TODO: rights
        territoryEntity ? territoryEntity.id : rootTerritoryId,
        label
      );
    } else {
      newEntity = await InstTemplate(templateToApply, userRole, undefined, label);
    }
    if (newEntity) {
      onMutationSuccess(newEntity);
      closeModal();
    } else {
      toast.warning("Failed to create entity from template");
    }
  };

  const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultDropdownValue);
  useEffect(() => {
    setSelectedTemplate(defaultDropdownValue);
  }, [selectedCategory]);

  return (
    <>
      <Modal
        showModal={showModal}
        width={800}
        isLoading={entityCreateMutation.isPending}
        onEnterPress={handleSubmit}
        onClose={closeModal}
      >
        <ModalHeader
          title={`Create ${
            entityClasses.length === 1 ? entitiesDictKeys[selectedCategory].label : "entity"
          }`}
        />
        <ModalContent column>
          <ModalInputForm alignLeft>
            <ModalInputLabel>{"Apply Template: "}</ModalInputLabel>
            <ModalInputWrap>
              <Dropdown.Single.Basic
                placeholder="select template.."
                disabled={templateOptions.length === 0}
                width="full"
                value={selectedTemplate}
                options={[
                  { value: defaultDropdownValue, label: "Select template..." },
                  ...templateOptions,
                ]}
                onChange={(templateToApply) => {
                  if (templateToApply !== defaultDropdownValue) {
                    setSelectedTemplate(templateToApply);
                    handleAskForTemplateApply(templateToApply);
                  }
                }}
              />
            </ModalInputWrap>
            <ModalInputLabel>{"Class & Label: "}</ModalInputLabel>
            <ModalInputWrap>
              <EntitySuggester
                initTyped={label}
                initCategory={selectedCategory}
                categoryTypes={entityClasses}
                excludedEntityClasses={excludedSuggesterEntities}
                onChangeCategory={(selectedOption) => {
                  // Any not allowed here - this condition makes it type safe
                  if (selectedOption !== EntityEnums.Extension.Any) {
                    setSelectedCategory(selectedOption);
                  }
                }}
                onTyped={(newType: string) => setLabel(newType)}
                statementLabelHint
                disableCreate
                disableTemplatesAccept
                disableWildCard
                disableTemplateInstantiation
                inputWidth="full"
                autoFocus
                disableButtons
                disableEnter
              />
            </ModalInputWrap>

            {/* Detail */}
            <ModalInputLabel>{"Detail: "}</ModalInputLabel>
            <ModalInputWrap>
              <Input
                value={detailTyped}
                onChangeFn={(newType: string) => setDetailTyped(newType)}
                changeOnType
                width="full"
                disabled={!!templateToApply}
              />
            </ModalInputWrap>

            {/* Language */}
            <ModalInputLabel>{"Label language: "}</ModalInputLabel>
            <ModalInputWrap>
              <Dropdown.Single.Basic
                width="full"
                options={orderedLanguageDict}
                value={selectedLanguage}
                onChange={(newValue) => {
                  setSelectedLanguage(newValue);
                }}
                disabled={!!templateToApply}
              />
            </ModalInputWrap>

            {/* Part of speech */}
            {selectedCategory === EntityEnums.Class.Action && (
              <>
                <ModalInputLabel>{"Part of Speech: "}</ModalInputLabel>
                <ModalInputWrap>
                  <Dropdown.Single.Basic
                    width="full"
                    value={actionPos}
                    options={actionPartOfSpeechDict}
                    onChange={(newValue) => {
                      setActionPos(newValue);
                    }}
                    disabled={!!templateToApply}
                  />
                </ModalInputWrap>
              </>
            )}
            {selectedCategory === EntityEnums.Class.Concept && (
              <>
                <ModalInputLabel>{"Part of Speech: "}</ModalInputLabel>
                <ModalInputWrap>
                  <Dropdown.Single.Basic
                    width="full"
                    value={conceptPos}
                    options={conceptPartOfSpeechDict}
                    onChange={(newValue) => {
                      setConceptPos(newValue);
                    }}
                    disabled={!!templateToApply}
                  />
                </ModalInputWrap>
              </>
            )}

            {/* Suggester territory */}
            {(selectedCategory === EntityEnums.Class.Territory ||
              selectedCategory === EntityEnums.Class.Statement) && (
              <>
                <ModalInputLabel>
                  {selectedCategory === EntityEnums.Class.Territory
                    ? "Parent territory: "
                    : "Territory: "}
                </ModalInputLabel>
                <ModalInputWrap>
                  {territoryEntity ? (
                    <EntityTag
                      fullWidth
                      entity={territoryEntity}
                      tooltipPosition="left"
                      unlinkButton={{
                        onClick: () => {
                          setTerritoryEntity(false);
                        },
                      }}
                    />
                  ) : (
                    <EntitySuggester
                      disableTemplatesAccept
                      filterEditorRights
                      inputWidth="full"
                      disableCreate
                      categoryTypes={[EntityEnums.Class.Territory]}
                      onPicked={(entity: IEntity) => {
                        setTerritoryEntity(entity);
                      }}
                    />
                  )}
                </ModalInputWrap>
              </>
            )}
          </ModalInputForm>
          {(userRole === UserEnums.Role.Admin || userRole === UserEnums.Role.Owner) && (
            <>
              {selectedCategory === EntityEnums.Class.Territory && !territoryEntity ? (
                <StyledNote>
                  {"Territory will be added under root"}
                  <br />
                  {"when nothing is selected"}
                </StyledNote>
              ) : (
                <div />
              )}
            </>
          )}
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button key="cancel" label="Cancel" color="greyer" inverted onClick={closeModal} />
            <Button key="submit" label="Create" color="info" onClick={handleSubmit} />
          </ButtonGroup>
        </ModalFooter>
      </Modal>

      {/* CREATE ENTITY FROM TEMPLATE */}
      {templateToApply && (
        <Modal
          showModal={showApplyTemplateModal}
          width="auto"
          onEnterPress={() => {
            if (validateEntityCreation(true)) {
              createEntityFromTemplate(templateToApply);
              setShowApplyTemplateModal(false);
            }
          }}
          onClose={() => {
            setShowApplyTemplateModal(false);
            setTemplateToApply(false);
            setSelectedTemplate(defaultDropdownValue);
          }}
        >
          <ModalHeader title="Create entity from Template" />
          <ModalContent>
            <ModalInputForm>{`Create entity from template?`}</ModalInputForm>
            <div style={{ marginLeft: "0.5rem" }}>
              <EntityTag disableDrag entity={templateToApply} />
            </div>
            {/* here goes the info about template #951 */}
          </ModalContent>
          <ModalFooter>
            <ButtonGroup>
              <Button
                key="cancel"
                label="Cancel"
                color="greyer"
                inverted
                onClick={() => {
                  setShowApplyTemplateModal(false);
                  setTemplateToApply(false);
                  setSelectedTemplate(defaultDropdownValue);
                }}
              />
              <Button
                key="submit"
                label="Create"
                color="info"
                onClick={() => {
                  if (validateEntityCreation(true)) {
                    createEntityFromTemplate(templateToApply);
                    setShowApplyTemplateModal(false);
                  }
                }}
              />
            </ButtonGroup>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};
