import { languageDict } from "@shared/dictionaries";
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
import { CEntity, CStatement, CTerritory } from "constructors";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { StyledNote } from "./EntityCreateModalStyles";

interface EntityCreateModal {
  closeModal: () => void;
  onMutationSuccess?: (entity: IEntity) => void;

  labelTyped?: string;
  categorySelected?: EntityEnums.Class;
}
export const EntityCreateModal: React.FC<EntityCreateModal> = ({
  closeModal,
  onMutationSuccess = () => {},
  labelTyped = "",
  categorySelected,
}) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const [label, setLabel] = useState(labelTyped);
  const [detailTyped, setDetailTyped] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EntityEnums.Class>(
    categorySelected || classesAll[0]
  );

  const [selectedLanguage, setSelectedLanguage] =
    useState<EntityEnums.Language>(EntityEnums.Language.Empty);

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
    if (user) {
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
    } = {
      label: label,
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
      width="auto"
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
              categoryTypes={classesAll}
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
          </ModalInputWrap>
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
