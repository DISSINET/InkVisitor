import { UserEnums } from "@shared/enums";
import {
  IEntity,
  IResponseDetail,
  IResponseGeneric,
  IResponseStatement,
} from "@shared/types";
import { UseMutationResult } from "@tanstack/react-query";
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
import { toast } from "react-toastify";
import { getShortLabelByLetterCount } from "utils";

interface ApplyTemplateModal {
  showModal: boolean;
  setShowApplyTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  entity: IResponseDetail | IResponseStatement;
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
  const handleApplyTemplate = async () => {
    if (templateToApply) {
      const entityAfterTemplateApplied = await applyTemplate(
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
      <ModalContent column>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <ModalInputForm>{`Apply template?`}</ModalInputForm>
          <div style={{ marginLeft: "0.5rem" }}>
            {templateToApply && (
              <EntityTag disableDrag entity={templateToApply} />
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "1rem",
          }}
        >
          {/* here goes the info about template #951 */}
          <span>
            <i>Used as a template:</i>{" "}
            <b>{entity.usedAsTemplate && entity.usedAsTemplate.length}</b>
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {entity.usedAsTemplate &&
              entity.usedAsTemplate.map((entityId) => (
                <div
                  key={entityId}
                  style={{ display: "inline-grid", marginBottom: "0.5rem" }}
                >
                  <EntityTag entity={entity.entities[entityId]} fullWidth />
                </div>
              ))}
          </div>
        </div>
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
