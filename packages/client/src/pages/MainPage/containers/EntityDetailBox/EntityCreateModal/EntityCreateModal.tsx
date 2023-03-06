import { entitiesDictKeys, languageDict } from "@shared/dictionaries";
import { classesAll } from "@shared/dictionaries/entity";
import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity, IOption } from "@shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  Dropdown,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
  ModalInputLabel,
  ModalInputWrap,
} from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import { CEntity, CStatement, CTerritory } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { toast } from "react-toastify";
import { excludedSuggesterEntities, rootTerritoryId } from "Theme/constants";
import { StyledContent, StyledNote } from "./EntityCreateModalStyles";

interface EntityCreateModal {
  closeModal: () => void;
}
export const EntityCreateModal: React.FC<EntityCreateModal> = ({
  closeModal,
}) => {
  const allowedEntityClasses: EntityEnums.Class[] = classesAll.filter(
    (c) => c !== EntityEnums.Class.Value
  );
  const userRole = localStorage.getItem("userrole") as UserEnums.Role;

  const [detailTyped, setDetailTyped] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<any>(false);
  const [selectedCategory, setSelectedCategory] = useState<IOption>({
    value: entitiesDictKeys[allowedEntityClasses[0]].value,
    label: entitiesDictKeys[allowedEntityClasses[0]].label,
  });
  const [labelTyped, setLabelTyped] = useState("");
  const [territoryId, setTerritoryId] = useState<string>("");
  const { appendDetailId, setSelectedDetailId } = useSearchParams();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

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
      } else {
        return false;
      }
    },
    { enabled: !!userId && api.isLoggedIn() }
  );

  useEffect(() => {
    if (user) {
      setSelectedLanguage(user.options.defaultLanguage);
    }
  }, [user]);

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

  const queryClient = useQueryClient();

  const entityCreateMutation = useMutation(
    async (newEntity: IEntity) => await api.entityCreate(newEntity),
    {
      onSuccess: (data, variables) => {
        closeModal();
        appendDetailId(variables.id);
        setSelectedDetailId(variables.id);
        if (variables.class === EntityEnums.Class.Territory) {
          queryClient.invalidateQueries("tree");
        }
      },
    }
  );

  const handleCreateActant = () => {
    const newCreated: {
      label: string;
      entityClass: EntityEnums.Class;
      detail?: string;
      language?: EntityEnums.Language;
      territoryId?: string;
    } = {
      label: labelTyped,
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
          localStorage.getItem("userrole") as UserEnums.Role,
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
          localStorage.getItem("userrole") as UserEnums.Role,
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

  const handleCheckOnSubmit = () => {
    if (labelTyped.length < 2) {
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
                categoryTypes={allowedEntityClasses}
                excludedEntities={excludedSuggesterEntities}
                onSelected={() => console.log("cannot select")}
                onChangeCategory={(
                  selectedOption: ValueType<OptionTypeBase, any>
                ) => {
                  if (selectedOption)
                    setSelectedCategory(selectedOption as IOption);
                }}
                onTyped={(newType: string) => setLabelTyped(newType)}
                disableCreate
                disableTemplatesAccept
                disableWildCard
                disableTemplateInstantiation
                inputWidth={96}
                disableButtons
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
              <Dropdown
                isMulti={false}
                width="full"
                options={languageDict}
                value={languageDict.find(
                  (i: any) => i.value === selectedLanguage
                )}
                onChange={(newValue: any) => {
                  setSelectedLanguage(newValue.value);
                }}
              />
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
