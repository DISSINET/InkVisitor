import { IEntity, IResponseEntity } from "@shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { StyledContent } from "../../EntityBookmarkBox/EntityBookmarkBoxStyles";
import { EntityTag } from "../../EntityTag/EntityTag";

interface TemplateListRemoveModal {
  showRemoveModal: boolean;
  setShowRemoveModal: React.Dispatch<React.SetStateAction<boolean>>;
  removeEntityId: string | false;
  setRemoveEntityId: (value: React.SetStateAction<string | false>) => void;
  templatesData: IResponseEntity[] | undefined;
}
export const TemplateListRemoveModal: React.FC<TemplateListRemoveModal> = ({
  showRemoveModal,
  setShowRemoveModal,
  removeEntityId,
  setRemoveEntityId,
  templatesData,
}) => {
  const queryClient = useQueryClient();
  const { detailIdArray, removeDetailId } = useSearchParams();

  const entityToRemove: false | IEntity = useMemo(() => {
    if (removeEntityId) {
      const templateToBeRemoved = templatesData?.find(
        (template: IEntity) => template.id === removeEntityId
      );
      return templateToBeRemoved || false;
    } else {
      return false;
    }
  }, [removeEntityId]);

  const templateRemoveMutation = useMutation(
    async (entityId: string) => await api.entityDelete(entityId),
    {
      onSuccess: () => {
        if (removeEntityId && detailIdArray.includes(removeEntityId)) {
          removeDetailId(removeEntityId);
        }
        entityToRemove &&
          toast.warning(
            `Template [${entityToRemove.class}]${entityToRemove.label} was removed`
          );
        setRemoveEntityId(false);
        queryClient.invalidateQueries(["templates"]);
        queryClient.invalidateQueries(["entity"]);
      },
    }
  );

  const handleRemoveTemplateCancel = () => {
    setRemoveEntityId(false);
    setShowRemoveModal(false);
  };

  // TODO: fix - lifecycle - removeEntityId is 2x, not work with shortcuts
  const handleRemoveTemplateAccept = () => {
    setShowRemoveModal(false);
    if (removeEntityId) {
      templateRemoveMutation.mutate(removeEntityId);
    }
    setRemoveEntityId(false);
  };

  return (
    <Modal
      key="remove"
      showModal={showRemoveModal}
      width="thin"
      onEnterPress={() => {
        handleRemoveTemplateAccept();
      }}
      onClose={() => {
        handleRemoveTemplateCancel();
      }}
    >
      <ModalHeader title="Remove Template" />
      <ModalContent>
        <StyledContent>
          Remove template entity?
          {entityToRemove && <EntityTag actant={entityToRemove} />}
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
              handleRemoveTemplateCancel();
            }}
          />
          <Button
            key="remove"
            label="Remove"
            color="danger"
            onClick={() => {
              handleRemoveTemplateAccept();
            }}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
