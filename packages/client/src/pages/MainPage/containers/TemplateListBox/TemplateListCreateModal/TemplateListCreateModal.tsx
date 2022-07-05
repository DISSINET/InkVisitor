import { entitiesDict } from "@shared/dictionaries";
import { EntityClass, UserRole } from "@shared/enums";
import { IEntity } from "@shared/types";
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
import { CEntity, CStatement } from "constructors";
import { useSearchParams } from "hooks";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { DropdownItem } from "types";
import { toast } from "react-toastify";

interface TemplateListCreateModal {
  showCreateModal: boolean;
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
}
export const TemplateListCreateModal: React.FC<TemplateListCreateModal> = ({
  showCreateModal,
  setShowCreateModal,
}) => {
  const queryClient = useQueryClient();
  const { setStatementId, appendDetailId } = useSearchParams();

  const [createModalEntityClass, setCreateModalEntityClass] =
    useState<DropdownItem>(entitiesDict[0]);
  const [createModalEntityLabel, setCreateModalEntityLabel] =
    useState<string>("");
  const [createModalEntityDetail, setCreateModalEntityDetail] =
    useState<string>("");

  const resetCreateModal = () => {
    setCreateModalEntityLabel("");
    setCreateModalEntityDetail("");
    setCreateModalEntityClass(entitiesDict[0]);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    resetCreateModal();
  };

  const templateCreateMutation = useMutation(
    async (newEntity: IEntity) => await api.entityCreate(newEntity),
    {
      onSuccess: (data, variables) => {
        toast.info(
          `Template [${variables.class}]${variables.label} was created`
        );
        queryClient.invalidateQueries(["templates"]);
        if (variables.class === EntityClass.Statement) {
          setStatementId(variables.id);
        } else {
          appendDetailId(variables.id);
        }
      },
    }
  );

  const handleCreateNewStatementTemplate = () => {
    const newTemplate = CStatement(
      localStorage.getItem("userrole") as UserRole,
      undefined,
      createModalEntityLabel,
      createModalEntityDetail
    );
    newTemplate.isTemplate = true;
    templateCreateMutation.mutate(newTemplate);
  };
  const handleCreateNewEntityTemplate = () => {
    const newTemplate = CEntity(
      createModalEntityClass.value as EntityClass,
      createModalEntityLabel,
      localStorage.getItem("userrole") as UserRole,
      createModalEntityDetail
    );
    newTemplate.isTemplate = true;
    templateCreateMutation.mutate(newTemplate);
  };

  const handleCreateTemplate = () => {
    if (createModalEntityClass.value === EntityClass.Statement) {
      handleCreateNewStatementTemplate();
    } else {
      handleCreateNewEntityTemplate();
    }
    handleCloseCreateModal();
  };

  return (
    <Modal
      showModal={showCreateModal}
      width="thin"
      key="create"
      onEnterPress={() => {
        handleCreateTemplate();
      }}
      onClose={() => {
        handleCloseCreateModal();
      }}
    >
      <ModalHeader title="Create Template" />
      <ModalContent>
        <ModalInputForm>
          <ModalInputLabel>{"Entity type: "}</ModalInputLabel>
          <ModalInputWrap>
            <Dropdown
              value={{
                label: createModalEntityClass.label,
                value: createModalEntityClass.value,
              }}
              options={entitiesDict}
              onChange={(option: ValueType<OptionTypeBase, any>) => {
                setCreateModalEntityClass(option as DropdownItem);
              }}
              width={80}
              entityDropdown
              disableTyping
              autoFocus
            />
            <TypeBar entityLetter={createModalEntityClass.value} />
          </ModalInputWrap>
          <ModalInputLabel>{"Label: "}</ModalInputLabel>
          <ModalInputWrap>
            <Input
              value={createModalEntityLabel}
              onChangeFn={(newType: string) =>
                setCreateModalEntityLabel(newType)
              }
              changeOnType
            />
          </ModalInputWrap>
          <ModalInputLabel>{"Detail: "}</ModalInputLabel>
          <ModalInputWrap>
            <Input
              value={createModalEntityDetail}
              onChangeFn={(newType: string) =>
                setCreateModalEntityDetail(newType)
              }
              changeOnType
            />
          </ModalInputWrap>
        </ModalInputForm>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            key="cancel"
            label="Cancel"
            color="greyer"
            inverted
            onClick={() => {
              handleCloseCreateModal();
            }}
          />
          <Button
            key="submit"
            label="Create"
            color="info"
            onClick={() => {
              handleCreateTemplate();
            }}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
