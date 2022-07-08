import { EntityClass } from "@shared/enums";
import { IEntity, IResponseEntity } from "@shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { EntityTag } from "../..";
import { StyledModalContent } from "../TemplateListBoxStyles";

interface TemplateListRemoveModal {
  removeEntityId: string | false;
  setRemoveEntityId: (value: React.SetStateAction<string | false>) => void;
  entityToRemove: false | IEntity;
}
export const TemplateListRemoveModal: React.FC<TemplateListRemoveModal> = ({
  removeEntityId = false,
  setRemoveEntityId,
  entityToRemove,
}) => {
  const queryClient = useQueryClient();
  const { detailIdArray, removeDetailId, statementId, selectedDetailId } =
    useSearchParams();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  const templateRemoveMutation = useMutation(
    async (entityId: string) => await api.entityDelete(entityId),
    {
      onSuccess: (data, variables) => {
        if (removeEntityId && detailIdArray.includes(removeEntityId)) {
          removeDetailId(removeEntityId);
        }
        entityToRemove &&
          toast.warning(
            `Template [${entityToRemove.class}]: ${entityToRemove.label} was removed`
          );
        queryClient.invalidateQueries(["templates"]);
        if (selectedDetailId) {
          // TODO: check if entity class is the same as opened detail
          queryClient.invalidateQueries("entity-templates");
        }
        if (
          statementId &&
          entityToRemove &&
          entityToRemove.class === EntityClass.Statement
        ) {
          queryClient.invalidateQueries("statement-templates");
        }
        queryClient.invalidateQueries(["entity"]);
        setRemoveEntityId(false);
      },
    }
  );

  const handleRemoveTemplateAccept = () => {
    if (removeEntityId) {
      templateRemoveMutation.mutate(removeEntityId);
    }
  };

  return (
    <Modal
      key="remove"
      showModal={showModal}
      width="thin"
      onEnterPress={() => {
        handleRemoveTemplateAccept();
      }}
      onClose={() => {
        setRemoveEntityId(false);
      }}
    >
      <ModalHeader title="Remove Template" />
      <ModalContent>
        <StyledModalContent>
          Remove template entity?
          {entityToRemove && <EntityTag actant={entityToRemove} />}
        </StyledModalContent>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            key="cancel"
            label="Cancel"
            color="greyer"
            inverted
            onClick={() => {
              setRemoveEntityId(false);
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
      <Loader show={templateRemoveMutation.isLoading} />
    </Modal>
  );
};
