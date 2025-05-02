import { entitiesDictKeys } from "@shared/dictionaries";
import { UserEnums } from "@shared/enums";
import { IEntity, IResponseGeneric } from "@shared/types";
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
      const newRelations: Relation.IRelation[] = [];

      // Iterate through each relation type in IUsedRelations
      Object.entries(relations).forEach(([relationType, relationDetail]) => {
        if (relationDetail && relationDetail.connections) {
          // Process each connection in the relation detail
          relationDetail.connections.forEach(
            (connection: Relation.IConnection<Relation.IRelation>) => {
              // Create a new relation object for each connection
              const newRelation: Relation.IRelation = {
                id: uuidv4(),
                type: relationType as RelationEnums.Type,
                entityIds:
                  relationType === RelationEnums.Type.Synonym
                    ? [...connection.entityIds, entity.id] // For SYN type, add the entity ID
                    : connection.entityIds.map(
                        (
                          id: string // For other types, replace template ID
                        ) => (id === templateToApply.id ? entity.id : id)
                      ),
                order: connection.order,
              };

              newRelations.push(newRelation);
            }
          );
        }
      });

      console.log("newRelations", newRelations);
      setNewRelations(newRelations);
    }
  }, [templateDetail, entity.id, templateToApply.id]);

  const handleApplyTemplate = async (templateToApply: IEntity) => {
    try {
      const entityAfterTemplateApplied: IEntity = await applyTemplate(
        templateToApply,
        entity,
        localStorage.getItem("userrole") as UserEnums.Role
      );

      if (entityAfterTemplateApplied) {
        api.relationsCreate(newRelations);

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
        setShowApplyTemplateModal(false);
        handleApplyTemplate(templateToApply);
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
