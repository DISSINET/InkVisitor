import { languageDict } from "@shared/dictionaries";
import { EntityEnums, UserEnums } from "@shared/enums";
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
  TypeBar,
} from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import { DropdownAny } from "Theme/constants";
import { DropdownItem, SuggesterItemToCreate } from "types";
import { StyledContent, StyledNote } from "./SuggesterCreateModalStyles";

interface SuggesterCreateModal {
  typed: string;
  category: DropdownItem;
  categories: DropdownItem[];
  defaultLanguage: EntityEnums.Language | false;
  onCreate: (item: SuggesterItemToCreate) => void;
  closeModal: () => void;
}
export const SuggesterCreateModal: React.FC<SuggesterCreateModal> = ({
  typed,
  category,
  categories,
  defaultLanguage,
  onCreate,
  closeModal,
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<DropdownItem>(
    category.value !== DropdownAny ? category : categories[0]
  );
  const [selectedLanguage, setSelectedLanguage] =
    useState<any>(defaultLanguage);

  const [label, setLabel] = useState<string>(typed);
  const [detail, setDetail] = useState<string>("");
  const [territoryId, setTerritoryId] = useState<string>("");

  const userRole = localStorage.getItem("userrole") as UserEnums.Role;

  const handleCreateActant = () => {
    onCreate({
      label: label,
      entityClass: selectedCategory.value as EntityEnums.Class,
      detail: detail,
      language: selectedLanguage,
      territoryId: territoryId,
    });
    closeModal();
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
    if (selectedCategory.value === "S" && !territoryId) {
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
      onEnterPress={handleCheckOnSubmit}
      onClose={closeModal}
    >
      <ModalHeader title="Create entity" />
      <ModalContent>
        <StyledContent>
          <ModalInputForm>
            <ModalInputLabel>{"Entity type: "}</ModalInputLabel>
            <ModalInputWrap>
              <Dropdown
                value={{
                  label: selectedCategory.label,
                  value: selectedCategory.value,
                }}
                options={categories}
                onChange={(option) => {
                  setSelectedCategory(option as DropdownItem);
                }}
                width={40}
                entityDropdown
                disableTyping
                autoFocus
              />
              <TypeBar entityLetter={selectedCategory.value} />
            </ModalInputWrap>
            <ModalInputLabel>{"Label: "}</ModalInputLabel>
            <ModalInputWrap>
              <Input
                value={label}
                onChangeFn={(newType: string) => setLabel(newType)}
                changeOnType
              />
            </ModalInputWrap>
            <ModalInputLabel>{"Detail: "}</ModalInputLabel>
            <ModalInputWrap>
              <Input
                value={detail}
                onChangeFn={(newType: string) => setDetail(newType)}
                changeOnType
              />
            </ModalInputWrap>
            <ModalInputLabel>{"Language: "}</ModalInputLabel>
            <ModalInputWrap>
              <Dropdown
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
                        color: "danger",
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
            onClick={() => {
              setTerritoryId("");
              closeModal();
            }}
          />
          <Button
            key="submit"
            label="Create"
            color="info"
            onClick={() => handleCheckOnSubmit()}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
