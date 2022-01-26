import { ActantType, UserRole } from "@shared/enums";
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
  Tag,
} from "components";
import { EntitySuggester } from "pages/MainPage/containers";
import React, { useEffect, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { useQuery } from "react-query";
import { ValueType, OptionTypeBase } from "react-select";
import { toast } from "react-toastify";
import { DropdownAny } from "types";
import {
  StyledContent,
  StyledModalForm,
  StyledModalInputWrap,
  StyledModalLabel,
  StyledNote,
  StyledTypeBar,
} from "./SuggesterStyles";

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
    category.value !== DropdownAny ? category.value : categories[0].label
  );

  const [label, setLabel] = useState<string>(typed);
  const [detail, setDetail] = useState<string>("");
  const [territoryId, setTerritoryId] = useState<string>("");

  const userRole = localStorage.getItem("userrole") as UserRole;

  const handleCreateActant = () => {
    onCreate({
      label: label,
      category: selectedCategory,
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
      onEnterPress={handleCreateActant}
      onClose={() => closeModal()}
    >
      <ModalHeader title="Create actant" />
      <ModalContent>
        <StyledContent>
          <StyledModalForm>
            <StyledModalLabel>{"Category: "}</StyledModalLabel>
            <StyledModalInputWrap>
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
              />
              <StyledTypeBar
                entity={`entity${selectedCategory}`}
              ></StyledTypeBar>
            </StyledModalInputWrap>
            <StyledModalLabel>{"Label: "}</StyledModalLabel>
            <StyledModalInputWrap>
              <Input
                value={label}
                onChangeFn={(newType: string) => setLabel(newType)}
                changeOnType
                autoFocus
              />
            </StyledModalInputWrap>
            <StyledModalLabel>{"Detail: "}</StyledModalLabel>
            <StyledModalInputWrap>
              <Input
                value={detail}
                onChangeFn={(newType: string) => setDetail(newType)}
                changeOnType
              />
            </StyledModalInputWrap>
            {/* Suggester territory */}
            {(selectedCategory.value === "T" ||
              selectedCategory.value === "S") && (
              <>
                <StyledModalLabel>
                  {selectedCategory === "T"
                    ? "Parent territory: "
                    : "Territory: "}
                </StyledModalLabel>
                <StyledModalInputWrap>
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
                      categoryTypes={[ActantType.Territory]}
                      onSelected={(newSelectedId: string) => {
                        setTerritoryId(newSelectedId);
                      }}
                    />
                  )}
                </StyledModalInputWrap>
              </>
            )}
          </StyledModalForm>
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
