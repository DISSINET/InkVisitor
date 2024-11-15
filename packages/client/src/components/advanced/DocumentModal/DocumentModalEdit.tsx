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
  anchor?: { entityId: string; occurence?: number };
}
const DocumentModalEdit: React.FC<DocumentModalEdit> = ({
  onClose,
  document,
  anchor,
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
              forwardAnnotator={(newAnnotator) => {
                anchor?.entityId &&
                  newAnnotator?.scrollToAnchor(anchor?.entityId);
              }}
            />
          </AnnotatorProvider>
        ) : (
          <div>Document not found</div>
        )}
      </ModalContent>
    </Modal>
  );
};

export default DocumentModalEdit;
