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

type EntityDataType<T extends EntityEnums.Class> =
  T extends EntityEnums.Class.Statement ? IStatementData : any; // Add more mappings if needed

type EntityUpdate<T extends EntityEnums.Class> = Omit<
  IEntity,
  "data" | "class"
> & { data: Partial<EntityDataType<T>>; class: T };

interface ApplyTemplateModal<T extends EntityEnums.Class> {
  showModal: boolean;
  setShowApplyTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  entity: IEntity;
  updateEntityMutation: UseMutationResult<
    void | AxiosResponse<IResponseGeneric>,
    unknown,
    EntityUpdate<T>,
    unknown
  >;
  templateToApply: false | IEntity;
  setTemplateToApply: React.Dispatch<React.SetStateAction<false | IEntity>>;
}
export const ApplyTemplateModal = <T extends EntityEnums.Class>({
  showModal,
  setShowApplyTemplateModal,
  entity,
  updateEntityMutation,
  templateToApply,
  setTemplateToApply,
}: ApplyTemplateModal<T>) => {
  const handleApplyTemplate = async () => {
    if (templateToApply) {
      const entityAfterTemplateApplied: IEntity = await applyTemplate(
        templateToApply,
        entity,
        localStorage.getItem("userrole") as UserEnums.Role
      );

      // TODO: optimally react with toast only to succesfull creation
      toast.info(
        `Template "${getShortLabelByLetterCount(
          templateToApply.label,
          120
        )}" applied to Statement "${getShortLabelByLetterCount(
          entity.label,
          120
        )}"`
      );

      const entityUpdate: EntityUpdate<T> = {
        ...entityAfterTemplateApplied,
        data: entityAfterTemplateApplied.data as Partial<EntityDataType<T>>,
        class: entityAfterTemplateApplied.class as T,
      };

      updateEntityMutation.mutate(entityUpdate);
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
