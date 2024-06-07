import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity, IResponseGeneric, IStatementData } from "@shared/types";
import { AxiosResponse } from "axios";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
} from "components";
import { EntityTag } from "components/advanced";
import { applyTemplate } from "constructors";
import React from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getShortLabelByLetterCount } from "utils/utils";
import { entitiesDictKeys } from "@shared/dictionaries";

interface ApplyTemplateModal {
  showModal: boolean;
  setShowApplyTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  entity: IEntity;
  updateEntityMutation: UseMutationResult<
    void | AxiosResponse<IResponseGeneric>,
    unknown,
    // can be any entity class, thus this needs to create type to partially match with all data objects
    any,
    unknown
  >;
  templateToApply: false | IEntity;
  setTemplateToApply: React.Dispatch<React.SetStateAction<false | IEntity>>;
}
export const ApplyTemplateModal: React.FC<ApplyTemplateModal> = ({
  showModal,
  setShowApplyTemplateModal,
  entity,
  updateEntityMutation,
  templateToApply,
  setTemplateToApply,
}) => {
  const handleApplyTemplate = async () => {
    if (templateToApply) {
      try {
        const entityAfterTemplateApplied: IEntity = await applyTemplate(
          templateToApply,
          entity,
          localStorage.getItem("userrole") as UserEnums.Role
        );

        if (entityAfterTemplateApplied) {
          toast.info(
            `Template "${getShortLabelByLetterCount(
              templateToApply.label,
              120
            )}" applied to ${
              entitiesDictKeys[entity.class].label
            } "${getShortLabelByLetterCount(entity.label, 120)}"`
          );

          updateEntityMutation.mutate(entityAfterTemplateApplied);
        }
      } catch (e) {
        toast.error("Template was not applied");
      }
    }
    setTemplateToApply(false);
  };

  return (
    <Modal
      showModal={showModal}
      width="auto"
      onEnterPress={() => {
        setShowApplyTemplateModal(false);
        handleApplyTemplate();
      }}
      onClose={() => {
        setShowApplyTemplateModal(false);
      }}
    >
      <ModalHeader title="Apply Template" />
      <ModalContent>
        <ModalInputForm>{`Apply template?`}</ModalInputForm>
        <div style={{ marginLeft: "0.5rem" }}>
          {templateToApply && (
            <EntityTag disableDrag entity={templateToApply} />
          )}
        </div>
        {/* here goes the info about template #951 */}
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            key="cancel"
            label="Cancel"
            color="greyer"
            inverted
            onClick={() => {
              setShowApplyTemplateModal(false);
            }}
          />
          <Button
            key="submit"
            label="Apply"
            color="info"
            onClick={() => {
              setShowApplyTemplateModal(false);
              handleApplyTemplate();
            }}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
