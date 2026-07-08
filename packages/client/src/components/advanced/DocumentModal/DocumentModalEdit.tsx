import React, { useEffect, useState } from "react";

import { EntityEnums } from "@inkvisitor/shared/enums";
import { Modal, ModalContent, ModalHeader } from "components";
import { useDocumentQuery } from "hooks/react-query";
import { useWindowSize } from "hooks/useWindowSize";
import { getShortLabelByLetterCount } from "utils/utils";
import TextAnnotator from "../Annotator/Annotator";
import AnnotatorProvider from "../Annotator/AnnotatorProvider";

interface DocumentModalEdit {
  documentId: string;
  onClose: () => void;
  anchor?: { entityId: string; occurence?: number };
  // When false the annotator opens read-only (view/search only). Editors get
  // this for documents whose Resource is not assigned to them.
  canEdit?: boolean;
}
const DocumentModalEdit: React.FC<DocumentModalEdit> = ({
  documentId,
  onClose,
  anchor,
  canEdit = true,
}) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
  }, []);
  const [windowWidth, windowHeight] = useWindowSize();

  const {
    data: dataDocument,
    error: errorDocument,
    isFetching: dataDocumentIsFetching,
  } = useDocumentQuery(documentId);

  return (
    <Modal
      width={1000}
      showModal={show}
      onClose={onClose}
      fullHeight
      lowerZIndex
    >
      <ModalHeader
        title={
          dataDocumentIsFetching
            ? "Loading..."
            : `Edit ${
                dataDocument
                  ? getShortLabelByLetterCount(dataDocument.title, 90)
                  : "no label"
              }`
        }
        onClose={onClose}
      />

      <ModalContent column>
        {document ? (
          <AnnotatorProvider>
            <TextAnnotator
              documentId={documentId}
              dataDocument={dataDocument}
              dataDocumentIsFetching={dataDocumentIsFetching}
              dataDocumentError={errorDocument}
              width={965}
              height={windowHeight - 203}
              displayLineNumbers={true}
              hlEntities={[EntityEnums.Class.Territory]}
              forwardAnnotator={(newAnnotator) => {
                anchor?.entityId &&
                  newAnnotator?.scrollToAnchor(
                    anchor?.entityId,
                    anchor?.occurence || 0
                  );
              }}
              thisTerritoryEntityId={anchor?.entityId}
              canEditDocument={canEdit}
              disableCreate
              // Annotator lives inside this modal; lift its body-appended
              // overlays above the modal (default lib values sit under it).
              overlayZIndex={{ contextMenu: 700, settingsOverlay: 650 }}
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
