import { EntityClass, UserRole } from "@shared/enums";
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
} from "components";
import { EntitySuggester } from "pages/MainPage/containers";
import React, { useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { useQuery } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { toast } from "react-toastify";
import { DropdownAny } from "Theme/constants";
import { StyledContent, StyledNote, StyledTypeBar } from "./SuggesterStyles";

interface SuggesterModal {
  show?: boolean;
  typed: string;
  category: IOption;
  categories: IOption[];
  onCreate: Function;
  closeModal: Function;
}
export const SuggesterModal: React.FC<SuggesterModal> = ({
  show = false,
  typed,
  category,
  categories,
  onCreate,
  closeModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<any>(
    category.value !== DropdownAny ? category : categories[0]
  );

  const [label, setLabel] = useState<string>(typed);
  const [detail, setDetail] = useState<string>("");
  const [territoryId, setTerritoryId] = useState<string>("");

  const userRole = localStorage.getItem("userrole") as UserRole;

  const handleCreateActant = () => {
    onCreate({
      label: label,
      category: selectedCategory.value,
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
      showModal={show}
      width="thin"
      onEnterPress={() => {
        if (selectedCategory.value === "S" && !territoryId) {
          toast.warning("Territory is required!");
        } else if (
          selectedCategory.value === "T" &&
          !territoryId &&
          userRole !== UserRole.Admin
        ) {
          toast.warning("Parent territory is required!");
        } else {
          handleCreateActant();
          closeModal();
        }
      }}
      onClose={() => closeModal()}
    >
      <ModalHeader title="Create actant" />
      <ModalContent>
        <StyledContent>
          <ModalInputForm>
            <ModalInputLabel>{"Category: "}</ModalInputLabel>
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
                oneLetter
              />
              <StyledTypeBar
                entity={`entity${selectedCategory.value}`}
              ></StyledTypeBar>
            </ModalInputWrap>
            <ModalInputLabel>{"Label: "}</ModalInputLabel>
            <ModalInputWrap>
              <Input
                value={label}
                onChangeFn={(newType: string) => setLabel(newType)}
                changeOnType
                autoFocus
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
                    <Tag
                      propId={territory.id}
                      label={territory.label}
                      category={territory.class}
                      tooltipPosition={"left center"}
                      button={
                        <Button
                          key="d"
                          icon={<FaUnlink />}
                          color="danger"
                          inverted={true}
                          tooltip="unlink actant"
                          onClick={() => {
                            setTerritoryId("");
                          }}
                        />
                      }
                    />
                  ) : (
                    <EntitySuggester
                      filterEditorRights
                      inputWidth={96}
                      allowCreate={false}
                      categoryTypes={[EntityClass.Territory]}
                      onSelected={(newSelectedId: string) => {
                        setTerritoryId(newSelectedId);
                      }}
                    />
                  )}
                </ModalInputWrap>
              </>
            )}
          </ModalInputForm>
          {userRole === UserRole.Admin && (
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
            color="warning"
            onClick={() => {
              setTerritoryId("");
              closeModal();
            }}
          />
          <Button
            key="submit"
            label="Submit"
            color="primary"
            onClick={() => {
              if (selectedCategory.value === "S" && !territoryId) {
                toast.warning("Territory is required!");
              } else if (
                selectedCategory.value === "T" &&
                !territoryId &&
                userRole !== UserRole.Admin
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
