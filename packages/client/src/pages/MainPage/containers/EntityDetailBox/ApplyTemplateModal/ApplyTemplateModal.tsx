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
import { StyledContent } from "../../EntityBookmarkBox/EntityBookmarkBoxStyles";

interface ApplyTemplateModal {
  showModal: boolean;
  setApplyTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  entity?: IEntity;
  updateEntityMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    any,
    unknown
  >;
  templateToApply: false | IEntity;
  setTemplateToApply: React.Dispatch<React.SetStateAction<false | IEntity>>;
}
export const ApplyTemplateModal: React.FC<ApplyTemplateModal> = ({
  showModal,
  setApplyTemplateModal,
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
        setApplyTemplateModal(false);
        handleApplyTemplate();
      }}
      onClose={() => {
        setApplyTemplateModal(false);
      }}
    >
      <ModalHeader title="Create Template" />
      <ModalContent>
        <StyledContent>
          <ModalInputForm>{`Apply template?`}</ModalInputForm>
          <div>{templateToApply && <EntityTag entity={templateToApply} />}</div>
          {/* here goes the info about template #951 */}
        </StyledContent>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            key="cancel"
            label="Cancel"
            color="greyer"
            inverted
            onClick={() => {
              setApplyTemplateModal(false);
            }}
          />
          <Button
            key="submit"
            label="Apply"
            color="info"
            onClick={() => {
              setApplyTemplateModal(false);
              handleApplyTemplate();
            }}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
