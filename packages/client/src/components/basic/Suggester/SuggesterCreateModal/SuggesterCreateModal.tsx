import { EntityEnums, UserEnums } from "@shared/enums";
import { IOption } from "@shared/types";
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
  Tag,
  TypeBar,
} from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React, { useEffect, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { useQuery } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { toast } from "react-toastify";
import { DropdownAny } from "Theme/constants";
import { SuggesterItemToCreate } from "types";
import { StyledContent, StyledNote } from "./SuggesterCreateModalStyles";

interface SuggesterCreateModal {
  typed: string;
  category: IOption;
  categories: IOption[];
  onCreate: (item: SuggesterItemToCreate) => void;
  closeModal: () => void;
}
export const SuggesterCreateModal: React.FC<SuggesterCreateModal> = ({
  typed,
  category,
  categories,
  onCreate,
  closeModal,
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<any>(
    category.value !== DropdownAny ? category : categories[0]
  );

  const [label, setLabel] = useState<string>(typed);
  const [detail, setDetail] = useState<string>("");
  const [territoryId, setTerritoryId] = useState<string>("");

  const userRole = localStorage.getItem("userrole") as UserEnums.Role;

  const handleCreateActant = () => {
    onCreate({
      label: label,
      entityClass: selectedCategory.value,
      detail: detail,
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

  return (
    <Modal
      showModal={showModal}
      width="thin"
      onEnterPress={() => {
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
          closeModal();
        }
      }}
      onClose={() => closeModal()}
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
                onChange={(option: ValueType<OptionTypeBase, any>) => {
                  setSelectedCategory(option);
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
            {/* Suggester territory */}
            {(selectedCategory.value === "T" ||
              selectedCategory.value === "S") && (
              <>
                <ModalInputLabel>
                  {selectedCategory === "T"
                    ? "Parent territory: "
                    : "Territory: "}
                </ModalInputLabel>
                <ModalInputWrap>
                  {territory ? (
                    <EntityTag
                      entity={territory}
                      tooltipPosition="left"
                      button={
                        <Button
                          key="d"
                          icon={<FaUnlink />}
                          color="danger"
                          inverted
                          tooltipLabel="unlink actant"
                          onClick={() => {
                            setTerritoryId("");
                          }}
                        />
                      }
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
            onClick={() => {
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
                closeModal();
              }
            }}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
