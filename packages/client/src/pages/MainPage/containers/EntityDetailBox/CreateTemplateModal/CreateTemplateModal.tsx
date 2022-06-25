import { UserRole, EntityClass } from "@shared/enums";
import { IStatement, IEntity, IResponseGeneric } from "@shared/types";
import api from "api";
import { AxiosResponse } from "axios";
import {
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
} from "components";
import { DStatement, DEntity } from "constructors";
import React, { useState } from "react";
import { UseMutationResult, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import {
  StyledDetailForm,
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
} from "../EntityDetailBoxStyles";

interface CreateTemplateModal {
  showModal: boolean;
  entity?: IEntity;
  userCanEdit: boolean;
  setCreateTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  updateEntityMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    any,
    unknown
  >;
}
export const CreateTemplateModal: React.FC<CreateTemplateModal> = ({
  entity,
  showModal = false,
  userCanEdit,
  setCreateTemplateModal,
  updateEntityMutation,
}) => {
  const queryClient = useQueryClient();
  const [createTemplateLabel, setCreateTemplateLabel] = useState<string>("");

  const handleCreateTemplate = () => {
    // create template as a copy of the entity
    if (entity) {
      const userRole = localStorage.getItem("userrole") as UserRole;
      const templateEntity =
        entity.class === EntityClass.Statement
          ? DStatement(entity as IStatement, userRole)
          : DEntity(entity as IEntity, userRole);

      if (entity.class === EntityClass.Statement) {
        delete templateEntity.data["territory"];
      }
      templateEntity.isTemplate = true;
      templateEntity.usedTemplate = "";
      templateEntity.label = createTemplateLabel;
      api.entityCreate(templateEntity);

      setTimeout(() => {
        queryClient.invalidateQueries(["templates"]);
      }, 1000);
      updateEntityMutation.mutate({ usedTemplate: templateEntity.id });

      setCreateTemplateModal(false);
      setCreateTemplateLabel("");

      toast.info(
        `Template "${templateEntity.label}" created from entity "${entity.label}"`
      );
    }
  };

  const handleCancelCreateTemplate = () => {
    setCreateTemplateModal(false);
    setCreateTemplateLabel("");
  };

  return (
    <Modal
      showModal={showModal}
      width="thin"
      onEnterPress={() => {
        handleCreateTemplate();
      }}
      onClose={() => {
        handleCancelCreateTemplate();
      }}
    >
      <ModalHeader title="Create Template" />
      <ModalContent>
        <ModalInputForm>
          <StyledDetailForm>
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>Label</StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <Input
                  disabled={!userCanEdit}
                  width="full"
                  value={createTemplateLabel}
                  onChangeFn={async (newLabel: string) => {
                    setCreateTemplateLabel(newLabel);
                  }}
                  changeOnType
                />
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          </StyledDetailForm>
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
              handleCancelCreateTemplate();
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
