import {
  actionPartOfSpeechDict,
  conceptPartOfSpeechDict,
  languageDict,
} from "@shared/dictionaries";
import { classesAll } from "@shared/dictionaries/entity";
import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { excludedSuggesterEntities, rootTerritoryId } from "Theme/constants";
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
import {
  CAction,
  CConcept,
  CEntity,
  CStatement,
  CTerritory,
} from "constructors";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { StyledNote } from "./EntityCreateModalStyles";

interface EntityCreateModal {
  closeModal: () => void;
  onMutationSuccess?: (entity: IEntity) => void;

  labelTyped?: string;
  categorySelected?: EntityEnums.Class;
  languageSelected?: EntityEnums.Language;

  allowedEntityClasses?: EntityEnums.Class[];
}
export const EntityCreateModal: React.FC<EntityCreateModal> = ({
  closeModal,
  onMutationSuccess = () => {},
  labelTyped = "",
  categorySelected,
  languageSelected,
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

  const [territoryId, setTerritoryId] = useState<string>("");

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
      territoryId: territoryId,
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
          -1
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

  const {
    status,
    data: territory,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["territory", territoryId],
    queryFn: async () => {
      if (territoryId) {
        const res = await api.territoryGet(territoryId);
        return res.data;
      }
    },
    enabled: !!territoryId && api.isLoggedIn(),
  });

  const handleCheckOnSubmit = () => {
    if (label.length < 2) {
      toast.info("fill at least 2 characters");
    } else if (
      selectedCategory === EntityEnums.Class.Statement &&
      !territoryId
    ) {
      toast.warning("Territory is required!");
    } else if (
      selectedCategory === EntityEnums.Class.Territory &&
      !territoryId &&
      userRole !== UserEnums.Role.Admin
    ) {
      toast.warning("Parent territory is required!");
    } else {
      handleCreateActant();
    }
  };

  return (
    <Modal
      showModal={showModal}
      // width="auto"
      width={350}
      isLoading={entityCreateMutation.isPending}
      onEnterPress={handleCheckOnSubmit}
      onClose={closeModal}
    >
      <ModalHeader title="Create entity" />
      <ModalContent column>
        <ModalInputForm>
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
              inputWidth={96}
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
                {territory ? (
                  <EntityTag
                    entity={territory}
                    tooltipPosition="left"
                    unlinkButton={{
                      onClick: () => {
                        setTerritoryId("");
                      },
                    }}
                  />
                ) : (
                  <EntitySuggester
                    disableTemplatesAccept
                    filterEditorRights
                    inputWidth={96}
                    disableCreate
                    categoryTypes={[EntityEnums.Class.Territory]}
                    onSelected={(newSelectedId: string) => {
                      setTerritoryId(newSelectedId);
                    }}
                  />
                )}
              </ModalInputWrap>
            </>
          )}
        </ModalInputForm>
        {userRole === UserEnums.Role.Admin && (
          <>
            {selectedCategory === EntityEnums.Class.Territory &&
            !territoryId ? (
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
  );
};
