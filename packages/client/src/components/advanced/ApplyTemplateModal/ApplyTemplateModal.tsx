import { entitiesDictKeys } from "@shared/dictionaries";
import { UserEnums } from "@shared/enums";
import { IEntity, IResponseGeneric } from "@shared/types";
import {
  UseMutationResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
import { applyTemplate, InstRelations } from "constructors";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getShortLabelByLetterCount } from "utils/utils";
import { Relation } from "@shared/types";
import { RelationEnums } from "@shared/enums";
import { v4 as uuidv4 } from "uuid";

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
  templateToApply: IEntity;
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
  const {
    status,
    data: templateDetail,
    error: templateDetailError,
    isFetching: templateDetailIsFetching,
  } = useQuery({
    queryKey: ["entity", templateToApply.id],
    queryFn: async () => {
      const res = await api.detailGet(templateToApply.id);
      return res.data;
    },
    enabled: !!templateToApply.id && api.isLoggedIn(),
  });

  const [newRelations, setNewRelations] = useState<Relation.IRelation[]>([]);

  // instantiate relations from template
  useEffect(() => {
    if (templateDetail) {
      const { relations } = templateDetail;
      const newRelations: Relation.IRelation[] = InstRelations(
        relations,
        templateToApply.id,
        entity.id
      );

      setNewRelations(newRelations);
    }
  }, [templateDetail, entity.id, templateToApply.id]);

  const queryClient = useQueryClient();

  const handleApplyTemplate = async (templateToApply: IEntity) => {
    try {
      const entityAfterTemplateApplied: IEntity = await applyTemplate(
        templateToApply,
        entity,
        localStorage.getItem("userrole") as UserEnums.Role
      );

      if (entityAfterTemplateApplied) {
        api
          .relationsCreate(newRelations)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["entity"] });
          })
          .catch((error) => {
            console.error("Failed to create relations:", error);
          });

        toast.info(
          `Template "${getShortLabelByLetterCount(
            templateToApply.labels[0] || "",
            120
          )}" applied to ${
            entitiesDictKeys[entity.class].label
          } "${getShortLabelByLetterCount(entity.labels[0] || "", 120)}"`
        );

        updateEntityMutation.mutate(entityAfterTemplateApplied);
      }
    } catch (e) {
      toast.error("Template was not applied");
    }
    setTemplateToApply(false);
  };

  return (
    <Modal
      showModal={showModal}
      width="auto"
      onEnterPress={() => {
        handleApplyTemplate(templateToApply);
        setShowApplyTemplateModal(false);
      }}
      onClose={() => {
        setShowApplyTemplateModal(false);
      }}
    >
      <ModalHeader title="Apply Template" />
      <ModalContent>
        <ModalInputForm>{`Apply template?`}</ModalInputForm>
        <div style={{ marginLeft: "0.5rem" }}>
          <EntityTag disableDrag entity={templateToApply} />
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
              handleApplyTemplate(templateToApply);
              setShowApplyTemplateModal(false);
            }}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
