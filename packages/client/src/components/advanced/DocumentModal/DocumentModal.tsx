import { IDocument } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ButtonGroup,
  Button,
  Input,
  ModalHeader,
} from "components";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface DocumentModal {
  entityId?: string;
  documentId: string;
  onClose: () => void;
}
export const DocumentModal: React.FC<DocumentModal> = ({
  onClose,
  entityId,
  documentId,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  const {
    data: document,
    error: documentError,
    isFetching: documentIsFetching,
  } = useQuery(
    ["openedDocument"],
    async () => {
      const res = await api.documentGet(documentId);
      return res.data;
    },
    {
      enabled: api.isLoggedIn(),
    }
  );

  const queryClient = useQueryClient();

  const updateDocumentMutation = useMutation(
    async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    {
      onSuccess: (variables, data) => {
        queryClient.invalidateQueries(["openedDocument"]);
        queryClient.invalidateQueries(["documents"]);
        toast.info("Document saved");
      },
    }
  );

  const [localContent, setLocalContent] = useState<string>("");
  useEffect(() => {
    setLocalContent(document?.content ?? "");
  }, [document]);

  return (
    <Modal showModal={show} onClose={onClose} fullHeight>
      <ModalHeader title={document?.title} />
      <ModalContent column>
        <Input
          type="textarea"
          fullHeightTextArea
          onChangeFn={(value: string) => setLocalContent(value)}
          value={localContent}
          cols={120}
          changeOnType
        />
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            key="cancel"
            label="Cancel"
            color="greyer"
            inverted
            onClick={onClose}
          />
          <Button
            key="submit"
            label="Save"
            color="info"
            disabled={document?.content === localContent}
            onClick={() => {
              updateDocumentMutation.mutate({
                id: documentId,
                doc: { content: localContent },
              });
            }}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
