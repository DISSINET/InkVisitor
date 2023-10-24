import { UserEnums } from "@shared/enums";
import {
  IResponseDetail,
  IResponseGeneric,
  IResponseSearchEntity,
  IResponseStatement,
} from "@shared/types";
import { UseMutationResult, useQuery } from "@tanstack/react-query";
import api from "api";
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
import {
  StyledApplyTemplate,
  StyledTagList,
  StyledUsedAsHeading,
  StyledUsedAsSection,
} from "./ApplyTemplateModalStyles";

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
  templateToApply: IResponseSearchEntity;
  setTemplateToApply: React.Dispatch<
    React.SetStateAction<false | IResponseSearchEntity>
  >;
}
export const ApplyTemplateModal: React.FC<ApplyTemplateModal> = ({
  showModal,
  setShowApplyTemplateModal,
  entity,
  updateEntityMutation,
  templateToApply,
  setTemplateToApply,
}) => {
  const { status, data, error, isFetching } = useQuery(
    ["usedAsTemplate"],
    async () => {
      const res = await api.entitiesSearch({
        entityIds: templateToApply.usedAsTemplate,
      });

      return res.data;
    },
    { enabled: !!templateToApply.usedAsTemplate.length && api.isLoggedIn() }
  );

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
        <StyledApplyTemplate>
          <ModalInputForm>{`Apply template?`}</ModalInputForm>
          <div style={{ marginLeft: "0.5rem" }}>
            {templateToApply && (
              <EntityTag disableDrag entity={templateToApply} />
            )}
          </div>
        </StyledApplyTemplate>
        <StyledUsedAsSection>
          <StyledUsedAsHeading>
            <i>Used as a template:</i>{" "}
            <b>{templateToApply.usedAsTemplate.length}</b>
          </StyledUsedAsHeading>
          <StyledTagList>
            {data &&
              data.map((entity) => (
                <div key={entity.id} style={{ marginBottom: "0.3rem" }}>
                  <EntityTag entity={entity} />
                </div>
              ))}
          </StyledTagList>
        </StyledUsedAsSection>
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
