import React, { useEffect, useState } from "react";

import { IDocument, IDocumentMeta, IResponseDocument } from "@shared/types";
import { Modal, ModalContent, ModalHeader } from "components";
import { useWindowSize } from "hooks/useWindowSize";
import { getShortLabelByLetterCount } from "utils/utils";
import TextAnnotator from "../Annotator/Annotator";
import AnnotatorProvider from "../Annotator/AnnotatorProvider";

interface DocumentModalEdit {
  document: IResponseDocument | IDocumentMeta | IDocument | undefined;
  onClose: () => void;
}
const DocumentModalEdit: React.FC<DocumentModalEdit> = ({
  onClose,
  document,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  const [windowWidth, windowHeight] = useWindowSize();

  return (
    <Modal width={1000} showModal={show} onClose={onClose} fullHeight>
      <ModalHeader
        title={`Edit ${
          document
            ? getShortLabelByLetterCount(document?.title, 90)
            : "no label"
        }`}
        onClose={onClose}
      />

      <ModalContent>
        {document ? (
          <AnnotatorProvider>
            <TextAnnotator
              documentId={document?.id}
              width={965}
              height={windowHeight - 180}
              displayLineNumbers={true}
              hlEntities={[]}
              storedAnnotatorScroll={0}
            />
          </AnnotatorProvider>
        ) : (
          <div>Document not found</div>
        )}
      </ModalContent>
      {/* <ModalFooter>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        ></div>
      </ModalFooter> */}
    </Modal>
  );
};

export default DocumentModalEdit;
