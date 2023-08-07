import { entitiesDict } from "@shared/dictionaries";
import { EntityEnums, UserEnums } from "@shared/enums";
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
import { CEntity, CStatement, CTemplateEntity } from "constructors";
import { useSearchParams } from "hooks";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { DropdownItem } from "types";

interface TemplateListCreateModal {
  showCreateModal: boolean;
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
}
export const TemplateListCreateModal: React.FC<TemplateListCreateModal> = ({
  showCreateModal,
  setShowCreateModal,
}) => {
  const queryClient = useQueryClient();
  const {
    setStatementId,
    appendDetailId,
    selectedDetailId,
    setSelectedDetailId,
  } = useSearchParams();

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

  // get user data
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

  const templateCreateMutation = useMutation(
    async (newEntity: IEntity) => await api.entityCreate(newEntity),
    {
      onSuccess: (data, variables) => {
        toast.info(
          `Template [${variables.class}]: "${variables.label}" was created`
        );
        queryClient.invalidateQueries(["templates"]);
        if (selectedDetailId) {
          queryClient.invalidateQueries(["entity-templates"]);
        }
        if (variables.class === EntityEnums.Class.Statement) {
          setStatementId(variables.id);
        } else {
          appendDetailId(variables.id);
        }
        handleCloseCreateModal();
      },
    }
  );

  const handleCreateNewStatementTemplate = (): IEntity | false => {
    if (user) {
      const newTemplate = CStatement(
        localStorage.getItem("userrole") as UserEnums.Role,
        user.options,
        createModalEntityLabel,
        createModalEntityDetail,
        undefined
      );
      return newTemplate;
    } else {
      return false;
    }
  };
  const handleCreateNewEntityTemplate = (): IEntity | false => {
    if (user) {
      const newTemplate = CEntity(
        user.options,
        createModalEntityClass.value as EntityEnums.Class,
        createModalEntityLabel,
        createModalEntityDetail
      );

      return newTemplate;
    } else {
      return false;
    }
  };

  const handleCreateTemplate = () => {
    if (user) {
      const entity =
        createModalEntityClass.value === EntityEnums.Class.Statement
          ? handleCreateNewStatementTemplate()
          : handleCreateNewEntityTemplate();

      if (entity) {
        const templateEntity = CTemplateEntity(
          localStorage.getItem("userrole") as UserEnums.Role,
          entity,
          createModalEntityLabel,
          createModalEntityDetail
        );
        templateCreateMutation.mutate(templateEntity);
      }
    }
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
      isLoading={templateCreateMutation.isLoading}
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
              onChange={(selectedOption) => {
                setCreateModalEntityClass(selectedOption[0]);
              }}
              width={100}
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
