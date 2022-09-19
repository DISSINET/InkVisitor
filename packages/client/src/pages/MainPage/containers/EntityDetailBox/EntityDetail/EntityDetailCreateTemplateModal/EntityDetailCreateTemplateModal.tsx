import { EntityEnums } from "@shared/enums";
import { IEntity, IResponseGeneric } from "@shared/types";
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
import { CTemplateEntity } from "constructors";
import { useSearchParams } from "hooks";
import React, { useState } from "react";
import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import {
  StyledDetailForm,
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
} from "../EntityDetailStyles";

interface EntityDetailCreateTemplateModal {
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
export const EntityDetailCreateTemplateModal: React.FC<
  EntityDetailCreateTemplateModal
> = ({
  entity,
  showModal = false,
  userCanEdit,
  setCreateTemplateModal,
  updateEntityMutation,
}) => {
  const queryClient = useQueryClient();
  const [createTemplateLabel, setCreateTemplateLabel] = useState<string>("");

  const { statementId, selectedDetailId } = useSearchParams();

  const templateCreateMutation = useMutation(
    async (templateEntity: IEntity) => await api.entityCreate(templateEntity),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(["templates"]);
        if (statementId && variables.class === EntityEnums.Class.Statement) {
          queryClient.invalidateQueries("statement-templates");
        }
        if (selectedDetailId) {
          queryClient.invalidateQueries("entity-templates");
        }
        updateEntityMutation.mutate({ usedTemplate: variables.id });

        setCreateTemplateModal(false);
        setCreateTemplateLabel("");

        toast.info(
          `Template [${variables.class}]: "${variables.label}" created from entity "${entity?.label}"`
        );
      },
    }
  );

  const handleCreateTemplate = () => {
    // create template as a copy of the entity
    if (entity) {
      const templateEntity = CTemplateEntity(entity, createTemplateLabel);
      templateCreateMutation.mutate(templateEntity);
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
                  autoFocus
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
