import {
  actionPartOfSpeechDict,
  conceptPartOfSpeechDict,
  languageDict,
} from "@shared/dictionaries";
import { classesAll, entitiesDictKeys } from "@shared/dictionaries/entity";
import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity, IResponseEntity, ITerritory } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import Dropdown, {
  ApplyTemplateModal,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import {
  CAction,
  CConcept,
  CEntity,
  CStatement,
  CTerritory,
  InstTemplate,
} from "constructors";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { StyledNote } from "./EntityCreateModalStyles";
import { DropdownItem } from "types";
import { getEntityLabel, getShortLabelByLetterCount } from "utils/utils";

interface EntityCreateModal {
  closeModal: () => void;
  onMutationSuccess?: (entity: IEntity) => void;

  labelTyped?: string;
  categorySelected?: EntityEnums.Class;
  languageSelected?: EntityEnums.Language;
  // init for create T / S
  parentTerritory?: IEntity;

  allowedEntityClasses?: EntityEnums.Class[];
}
export const EntityCreateModal: React.FC<EntityCreateModal> = ({
  closeModal,
  onMutationSuccess = () => {},
  labelTyped = "",
  categorySelected,
  languageSelected,
  parentTerritory,
  allowedEntityClasses,
}) => {
  const entityClasses = allowedEntityClasses
    ? allowedEntityClasses
    : classesAll;

  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const [label, setLabel] = useState(labelTyped);
  const [detailTyped, setDetailTyped] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EntityEnums.Class>(
    categorySelected || entityClasses[0]
  );
  const [selectedLanguage, setSelectedLanguage] =
    useState<EntityEnums.Language>(
      languageSelected || EntityEnums.Language.Empty
    );
  const [actionPos, setActionPos] = useState<EntityEnums.ActionPartOfSpeech>(
    EntityEnums.ActionPartOfSpeech.Verb
  );
  const [conceptPos, setConceptPos] = useState<EntityEnums.ConceptPartOfSpeech>(
    EntityEnums.ConceptPartOfSpeech.Empty
  );
  const [territoryEntity, setTerritoryEntity] = useState<false | IEntity>(
    parentTerritory || false
  );

  const userId = localStorage.getItem("userid");

  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    enabled: !!userId && api.isLoggedIn(),
  });

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

  const userRole = localStorage.getItem("userrole") as UserEnums.Role;

  const handleCreateActant = () => {
    const newCreated: {
      label: string;
      entityClass: EntityEnums.Class;
      detail?: string;
      language: EntityEnums.Language | null;
      territoryId?: string;
      partOfSpeech?:
        | EntityEnums.ActionPartOfSpeech
        | EntityEnums.ActionPartOfSpeech;
    } = {
      label: label.trim(),
      entityClass: selectedCategory,
      detail: detailTyped,
      language: selectedLanguage,
      territoryId: territoryEntity ? territoryEntity.id : undefined,
    };

    if (user) {
      if (
        newCreated.entityClass === EntityEnums.Class.Statement &&
        newCreated.territoryId
      ) {
        const newStatement = CStatement(
          userRole,
          {
            ...user.options,
            defaultLanguage:
              newCreated.language || user.options.defaultLanguage,
          },
          newCreated.label,
          newCreated.detail,
          newCreated.territoryId
        );
        entityCreateMutation.mutate(newStatement);
      } else if (newCreated.entityClass === EntityEnums.Class.Territory) {
        const newTerritory = CTerritory(
          userRole,
          {
            ...user.options,
            defaultLanguage:
              newCreated.language || user.options.defaultLanguage,
          },
          newCreated.label,
          newCreated.detail || "",
          newCreated.territoryId ? newCreated.territoryId : rootTerritoryId,
          EntityEnums.Order.Last
        );
        entityCreateMutation.mutate(newTerritory);
      } else if (newCreated.entityClass === EntityEnums.Class.Action) {
        const newAction = CAction(
          {
            ...user.options,
            defaultLanguage:
              newCreated.language || user.options.defaultLanguage,
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
            defaultLanguage:
              newCreated.language || user.options.defaultLanguage,
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
            defaultLanguage:
              newCreated.language || user.options.defaultLanguage,
          },
          newCreated.entityClass,
          newCreated.label,
          newCreated.detail
        );
        entityCreateMutation.mutate(newEntity);
      }
    }
  };

  // TODO: check if user has rights to the territoryEntity
  const handleCheckOnSubmit = () => {
    if (userRole === UserEnums.Role.Viewer) {
      toast.warning("You don't have permission to create entities");
    } else if (label.length < 1) {
      toast.info(MIN_LABEL_LENGTH_MESSAGE);
    } else if (
      selectedCategory === EntityEnums.Class.Statement &&
      !territoryEntity
    ) {
      toast.warning("Territory is required!");
    } else if (
      selectedCategory === EntityEnums.Class.Territory &&
      !territoryEntity &&
      userRole !== UserEnums.Role.Admin &&
      userRole !== UserEnums.Role.Owner
    ) {
      toast.warning("Parent territory is required!");
    } else {
      handleCreateActant();
    }
  };

  const {
    status: templateStatus,
    data: templates,
    error: templateError,
    isFetching: isFetchingTemplates,
  } = useQuery({
    queryKey: ["entity-templates", "templates", selectedCategory],
    queryFn: async () => {
      if (selectedCategory) {
        const res = await api.entitiesSearch({
          onlyTemplates: true,
          class: selectedCategory,
        });

        const templates = res.data;
        templates.sort((a: IEntity, b: IEntity) =>
          a.labels[0].toLocaleLowerCase() > b.labels[0].toLocaleLowerCase()
            ? 1
            : -1
        );
        return templates;
      }
    },
    enabled: !!selectedCategory && api.isLoggedIn(),
  });

  const templateOptions: DropdownItem[] & { template: IEntity }[] =
    useMemo(() => {
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
  const [templateToApply, setTemplateToApply] = useState<
    IResponseEntity | false
  >(false);

  const createEntityFromTemplate = async (templateToApply: IEntity) => {
    const newEntity = await InstTemplate(
      templateToApply,
      userRole,
      parentTerritory?.id,
      label
    );
    if (newEntity) {
      onMutationSuccess(newEntity);
      closeModal();
    } else {
      toast.warning("Failed to create entity from template");
    }
  };

  const [selectedTemplate, setSelectedTemplate] = useState<string>("empty");
  useEffect(() => {
    setSelectedTemplate("empty");
  }, [selectedCategory]);

  return (
    <>
      <Modal
        showModal={showModal}
        width={800}
        isLoading={entityCreateMutation.isPending}
        onEnterPress={handleCheckOnSubmit}
        onClose={closeModal}
      >
        <ModalHeader
          title={`Create ${
            entityClasses.length === 1
              ? entitiesDictKeys[selectedCategory].label
              : "entity"
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
                  { value: "empty", label: "Select template..." },
                  ...templateOptions,
                ]}
                onChange={(templateToApply) => {
                  if (templateToApply !== "empty") {
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
            <ModalInputLabel>{"Language: "}</ModalInputLabel>
            <ModalInputWrap>
              <Dropdown.Single.Basic
                width="full"
                options={languageDict}
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
          {(userRole === UserEnums.Role.Admin ||
            userRole === UserEnums.Role.Owner) && (
            <>
              {selectedCategory === EntityEnums.Class.Territory &&
              !territoryEntity ? (
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
            <Button
              key="cancel"
              label="Cancel"
              color="greyer"
              inverted
              onClick={closeModal}
            />
            <Button
              key="submit"
              label="Create"
              color="info"
              onClick={handleCheckOnSubmit}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>

      {/* CREATE ENTITY FROM TEMPLATE */}
      {templateToApply && (
        <Modal
          showModal={showApplyTemplateModal}
          width="auto"
          onEnterPress={() => {
            createEntityFromTemplate(templateToApply);
            setShowApplyTemplateModal(false);
          }}
          onClose={() => {
            setShowApplyTemplateModal(false);
            setTemplateToApply(false);
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
                }}
              />
              <Button
                key="submit"
                label="Create"
                color="info"
                onClick={() => {
                  createEntityFromTemplate(templateToApply);
                  setShowApplyTemplateModal(false);
                }}
              />
            </ButtonGroup>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};
