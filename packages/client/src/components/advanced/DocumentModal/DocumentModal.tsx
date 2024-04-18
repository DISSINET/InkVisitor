import { IDocument } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import theme, { ThemeFontSize } from "Theme/theme";
import api from "api";
import { Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getShortLabelByLetterCount } from "utils/utils";
import TextAnnotator from "../Annotator/Annotator";
import AnnotatorProvider from "../Annotator/AnnotatorProvider";

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

  const modalBodyRef = useRef(null);
  const [modalBodyWidth, setModalBodyWidth] = useState<number>(0);
  const [modalBodyHeight, setModalBodyHeight] = useState<number>(0);

  // set modalBodyWidth and modalBodyHeight based on the ref
  useEffect(() => {
    if (modalBodyRef.current) {
      console.log(modalBodyRef);
      // @ts-ignore
      setModalBodyWidth(modalBodyRef.current.offsetWidth);
      // @ts-ignore
      setModalBodyHeight(modalBodyRef.current.offsetHeight);
    }
  }, [modalBodyRef.current]);
  console.log(modalBodyWidth, modalBodyHeight);

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
    <Modal width={1000} showModal={show} onClose={onClose} fullHeight>
      <ModalHeader
        title={
          document?.title && getShortLabelByLetterCount(document.title, 90)
        }
      />
      <ModalContent>
        <div ref={modalBodyRef} style={{ height: "100%", width: 1000 }}>
          <AnnotatorProvider>
            <TextAnnotator
              width={modalBodyWidth}
              height={modalBodyHeight}
              displayLineNumbers={true}
              initialText={localContent}
            />
          </AnnotatorProvider>
        </div>
      </ModalContent>
      <ModalFooter>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        ></div>
      </ModalFooter>
    </Modal>
  );
};
