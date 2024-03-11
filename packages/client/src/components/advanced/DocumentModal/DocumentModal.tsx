import { IDocument } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import theme, { ThemeFontSize } from "Theme/theme";
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
import { FaMinus, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { getShortLabelByLetterCount } from "utils/utils";

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
  } = useQuery({
    queryKey: ["openedDocument"],
    queryFn: async () => {
      const res = await api.documentGet(documentId);
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });

  const queryClient = useQueryClient();

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["openedDocument"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.info("Document saved");
    },
  });

  const [localContent, setLocalContent] = useState<string>("");
  useEffect(() => {
    setLocalContent(document?.content ?? "");
  }, [document]);

  const fontSizeArray = Object.keys(theme.fontSize) as (keyof ThemeFontSize)[];

  const [fontSize, setFontSize] = useState<number>(2);

  return (
    <Modal width={550} showModal={show} onClose={onClose} fullHeight>
      <ModalHeader
        title={
          document?.title && getShortLabelByLetterCount(document.title, 90)
        }
      />
      <ModalContent column>
        <Input
          type="textarea"
          fullHeightTextArea
          fontSizeTextArea={fontSizeArray[fontSize]}
          onChangeFn={(value: string) => setLocalContent(value)}
          value={localContent}
          cols={120}
          changeOnType
        />
      </ModalContent>
      <ModalFooter>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <ButtonGroup>
            <Button
              key="minus"
              icon={<FaMinus size={11} />}
              color="success"
              inverted
              disabled={fontSize === 0}
              onClick={() => setFontSize(fontSize - 1)}
              tooltipLabel="zoom out"
            />
            <Button
              key="plus"
              icon={<FaPlus size={11} />}
              color="success"
              inverted
              disabled={fontSize > 5}
              onClick={() => setFontSize(fontSize + 1)}
              tooltipLabel="zoom in"
            />
          </ButtonGroup>
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
        </div>
      </ModalFooter>
    </Modal>
  );
};
