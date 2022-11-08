import { IEntity, IResponseGeneric } from "@shared/types";
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
import React from "react";
import { UseMutationResult } from "react-query";
import { toast } from "react-toastify";

interface ApplyTemplateModal {
  showModal: boolean;
  setShowApplyTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  entity?: IEntity;
  // TODO: check consistency of mutations from different containers
  updateEntityMutation: UseMutationResult<
    void | AxiosResponse<IResponseGeneric>,
    unknown,
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
  const handleApplyTemplate = () => {
    if (templateToApply && entity) {
      // TODO #952 handle conflicts in Templates application
      const entityAfterTemplateApplied = {
        ...{
          data: templateToApply.data,
          notes: templateToApply.notes,
          props: templateToApply.props,
          references: templateToApply.references,
          usedTemplate: templateToApply.id,
        },
      };

      toast.info(
        `Template "${templateToApply.label}" applied to Statement "${entity.label}"`
      );

      updateEntityMutation.mutate(entityAfterTemplateApplied);
    }
    setTemplateToApply(false);
  };

  return (
    <Modal
      showModal={showModal}
      width="thin"
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
