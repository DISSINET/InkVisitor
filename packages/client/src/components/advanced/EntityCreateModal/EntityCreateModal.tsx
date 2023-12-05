import { entitiesDictKeys, languageDict } from "@shared/dictionaries";
import { classesAll, entitiesDict } from "@shared/dictionaries/entity";
import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DropdownAny,
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
import { CEntity, CStatement, CTerritory } from "constructors";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DropdownItem } from "types";
import { StyledContent, StyledNote } from "./EntityCreateModalStyles";

interface EntityCreateModal {
  closeModal: () => void;
  onMutationSuccess?: (entity: IEntity) => void;

  labelTyped?: string;
  categorySelected?: DropdownItem;
  categories?: DropdownItem[];
}
export const EntityCreateModal: React.FC<EntityCreateModal> = ({
  closeModal,
  onMutationSuccess = () => {},
  labelTyped = "",
  categorySelected,
  categories = entitiesDict,
}) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const [label, setLabel] = useState(labelTyped);
  const [detailTyped, setDetailTyped] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DropdownItem>(
    categorySelected && categorySelected.value !== DropdownAny
      ? categorySelected
      : { value: categories[0].value, label: categories[0].value }
  );

  const [selectedLanguage, setSelectedLanguage] =
    useState<EntityEnums.Language>(EntityEnums.Language.Empty);

  const userId = localStorage.getItem("userid");
  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
  } = useQuery(
    ["user", userId],
    async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    { enabled: !!userId && api.isLoggedIn() }
  );
  useEffect(() => {
    if (user) {
      setSelectedLanguage(user.options.defaultLanguage);
    }
  }, [user]);

  const [territoryId, setTerritoryId] = useState<string>("");

  const entityCreateMutation = useMutation(
    async (newEntity: IEntity) => await api.entityCreate(newEntity),
    {
      onSuccess: (data, variables) => {
        onMutationSuccess(variables);
        closeModal();
      },
    }
  );

  const userRole = localStorage.getItem("userrole") as UserEnums.Role;

  const handleCreateActant = () => {
    const newCreated: {
      label: string;
      entityClass: EntityEnums.Class;
      detail?: string;
      language: EntityEnums.Language | null;
      territoryId?: string;
    } = {
      label: label,
      entityClass:
        entitiesDictKeys[selectedCategory.value as EntityEnums.Class].value,
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
  } = useQuery(
    ["territory", territoryId],
    async () => {
      if (territoryId) {
        const res = await api.territoryGet(territoryId);
        return res.data;
      }
    },
    {
      enabled: !!territoryId && api.isLoggedIn(),
    }
  );

  const handleCheckOnSubmit = () => {
    if (label.length < 2) {
      toast.info("fill at least 2 characters");
    } else if (selectedCategory.value === "S" && !territoryId) {
      toast.warning("Territory is required!");
    } else if (
      selectedCategory.value === "T" &&
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
      width="thin"
      isLoading={entityCreateMutation.isLoading}
      onEnterPress={handleCheckOnSubmit}
      onClose={closeModal}
    >
      <ModalHeader title="Create entity" />
      <ModalContent>
        <StyledContent>
          <ModalInputForm>
            <ModalInputLabel>{"Class & Label: "}</ModalInputLabel>
            <ModalInputWrap>
              <EntitySuggester
                initTyped={label}
                initCategory={selectedCategory}
                categoryTypes={classesAll}
                excludedEntityClasses={excludedSuggesterEntities}
                onChangeCategory={(selectedOption) => {
                  if (selectedOption)
                    setSelectedCategory(selectedOption as DropdownItem);
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
            <ModalInputLabel>{"Detail: "}</ModalInputLabel>
            <ModalInputWrap>
              <Input
                value={detailTyped}
                onChangeFn={(newType: string) => setDetailTyped(newType)}
                changeOnType
              />
            </ModalInputWrap>
            <ModalInputLabel>{"Language: "}</ModalInputLabel>
            <ModalInputWrap>
              <Dropdown.Single.Basic
                width="full"
                options={languageDict}
                value={selectedLanguage}
                onChange={(newValue) => {
                  setSelectedLanguage(newValue as EntityEnums.Language);
                }}
              />
              {/* <Dropdown
                width="full"
                options={languageDict}
                value={languageDict.find((i) => i.value === selectedLanguage)}
                onChange={(newValue) => {
                  setSelectedLanguage(
                    newValue[0].value as EntityEnums.Language
                  );
                }}
              /> */}
            </ModalInputWrap>
            {/* Suggester territory */}
            {(selectedCategory.value === "T" ||
              selectedCategory.value === "S") && (
              <>
                <ModalInputLabel>
                  {selectedCategory.value === "T"
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
              {selectedCategory.value === "T" && !territoryId ? (
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
        </StyledContent>
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
