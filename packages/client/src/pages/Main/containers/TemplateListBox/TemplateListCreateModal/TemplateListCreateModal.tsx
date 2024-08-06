import { entitiesDict } from "@shared/dictionaries";
import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  TypeBar,
} from "components";
import Dropdown from "components/advanced";
import { CEntity, CStatement, CTemplateEntity } from "constructors";
import { useSearchParams } from "hooks";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { getShortLabelByLetterCount } from "utils/utils";

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
    useState<EntityEnums.Class>(entitiesDict[0].value);
  const [createModalEntityLabel, setCreateModalEntityLabel] =
    useState<string>("");
  const [createModalEntityDetail, setCreateModalEntityDetail] =
    useState<string>("");

  const resetCreateModal = () => {
    setCreateModalEntityLabel("");
    setCreateModalEntityDetail("");
    setCreateModalEntityClass(entitiesDict[0].value);
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

  const templateCreateMutation = useMutation({
    mutationFn: async (newEntity: IEntity) => await api.entityCreate(newEntity),
    onSuccess: (data, variables) => {
      toast.info(
        `Template [${variables.class}]: "${getShortLabelByLetterCount(
          variables.label,
          120
        )}" was created`
      );
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      if (selectedDetailId) {
        queryClient.invalidateQueries({ queryKey: ["entity-templates"] });
      }
      if (variables.class === EntityEnums.Class.Statement) {
        setStatementId(variables.id);
        queryClient.invalidateQueries({ queryKey: ["statement-templates"] });
      } else {
        appendDetailId(variables.id);
      }
      handleCloseCreateModal();
    },
  });

  const handleCreateNewStatementTemplate = (): IEntity | false => {
    if (user) {
      const newTemplate = CStatement(
        localStorage.getItem("userrole") as UserEnums.Role,
        user.options,
        createModalEntityLabel,
        createModalEntityDetail
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
        createModalEntityClass,
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
        createModalEntityClass === EntityEnums.Class.Statement
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
      width="auto"
      key="create"
      onEnterPress={() => {
        handleCreateTemplate();
      }}
      onClose={() => {
        handleCloseCreateModal();
      }}
      isLoading={templateCreateMutation.isPending}
    >
      <ModalHeader title="Create Template" />
      <ModalContent>
        <ModalInputForm>
          <ModalInputLabel>{"Entity type: "}</ModalInputLabel>
          <ModalInputWrap>
            <Dropdown.Single.Entity
              value={createModalEntityClass}
              options={entitiesDict}
              onChange={(selectedOption) => {
                setCreateModalEntityClass(selectedOption);
              }}
              width="full"
              disableTyping
              autoFocus
            />
            <TypeBar entityLetter={createModalEntityClass} />
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
