import React, { useEffect, useState } from "react";

import {
  Modal,
  ModalHeader,
  ModalContent,
  Input,
  ModalFooter,
  ButtonGroup,
  Button,
  Tag,
} from "components";
import { IOption } from "@shared/types";
import useKeypress from "hooks/useKeyPress";
import {
  StyledModalForm,
  StyledModalInputWrap,
  StyledModalLabel,
  StyledTypeBar,
} from "./SuggesterStyles";
import { EntitySuggester } from "pages/MainPage/containers";
import { ActantType, UserRole } from "@shared/enums";
import { AttributeButtonGroup } from "pages/MainPage/containers/AttributeButtonGroup/AttributeButtonGroup";
import { userRoleDict } from "@shared/dictionaries";
import { useQuery } from "react-query";
import api from "api";
import { FaUnlink } from "react-icons/fa";
import { toast } from "react-toastify";

interface SuggesterModal {
  show?: boolean;
  typed: string;
  category: string;
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
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0].label
  );
  const [label, setLabel] = useState<string>(typed);
  const [detail, setDetail] = useState<string>("");
  const [territoryId, setTerritoryId] = useState<string>("");

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
        <StyledModalForm>
          <StyledModalLabel>{"Category: "}</StyledModalLabel>
          <StyledModalInputWrap>
            <Input
              type="select"
              value={selectedCategory}
              options={categories}
              inverted
              suggester
              onChangeFn={(newCategory: string) =>
                setSelectedCategory(newCategory)
              }
            />
            <StyledTypeBar entity={`entity${selectedCategory}`}></StyledTypeBar>
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
          {(selectedCategory === "T" || selectedCategory === "S") && (
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
        <i>
          {selectedCategory === "T" && !territoryId
            ? "Territory will be added under root when nothing is selected"
            : ""}
        </i>
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
              if (selectedCategory === "S" && !territoryId) {
                toast.warning("Territory is required!");
              } else if (selectedCategory === "T" && !territoryId) {
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
