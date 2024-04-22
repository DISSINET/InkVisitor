import { IDocument, IResponseDocument } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import theme, { ThemeFontSize } from "Theme/theme";
import api from "api";
import { Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getShortLabelByLetterCount } from "utils/utils";
import TextAnnotator from "../Annotator/Annotator";
import AnnotatorProvider from "../Annotator/AnnotatorProvider";
import { useContainerDimensions } from "hooks/useContainerDimensions";
import { useWindowSize } from "hooks/useWindowSize";

interface DocumentModal {
  document: IResponseDocument | undefined;
  onClose: () => void;
}
const DocumentModalEdit: React.FC<DocumentModal> = ({ onClose, document }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  const modalBodyRef = useRef(null);

  const [windowWidth, windowHeight] = useWindowSize();

  return (
    <Modal width={1000} showModal={show} onClose={onClose} fullHeight>
      <ModalHeader
        title={`Export ${
          document
            ? getShortLabelByLetterCount(document?.title, 90)
            : "no label"
        }`}
      />
      <ModalContent>
        <div ref={modalBodyRef} style={{ height: "300px", width: "1000px" }}>
          <div>
            {document ? (
              <AnnotatorProvider>
                <TextAnnotator
                  documentId={document?.id}
                  width={965}
                  height={windowHeight - 200}
                  displayLineNumbers={true}
                />
              </AnnotatorProvider>
            ) : (
              <div>Document not found</div>
            )}
          </div>
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

export default DocumentModalEdit;
