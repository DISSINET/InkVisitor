import React, { useCallback, useEffect, useRef, useState } from "react";

import { EntityEnums } from "@inkvisitor/shared/enums";
import { Modal, ModalContent, ModalHeader } from "components";
import { useDocumentQuery } from "hooks/react-query";
import { useWindowSize } from "hooks/useWindowSize";
import { getShortLabelByLetterCount } from "utils/utils";
import TextAnnotator from "../Annotator/Annotator";
import AnnotatorProvider from "../Annotator/AnnotatorProvider";
import { StyledDocumentModalAnnotator } from "./DocumentModalStyles";

interface DocumentModalEdit {
  documentId: string;
  onClose: () => void;
  anchor?: { entityId: string; occurence?: number };
}
const DocumentModalEdit: React.FC<DocumentModalEdit> = ({ documentId, onClose, anchor }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
  }, []);

  // The width the canvas has is the modal body's, which only the body knows, so
  // it is measured rather than restated here as the modal width less an
  // allowance.
  //
  // Measured through a callback ref rather than by element id: Modal renders
  // nothing until showModal turns true, so an id lookup on mount finds no
  // element, and an effect keyed on the id alone never retries. A callback ref
  // fires when the node itself appears.
  const [slotWidth, setSlotWidth] = useState(0);
  const slotObserverRef = useRef<ResizeObserver | null>(null);
  const slotRef = useCallback((node: HTMLDivElement | null) => {
    slotObserverRef.current?.disconnect();
    slotObserverRef.current = null;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        // Rounded down, never up: a width measured a pixel over hands that
        // pixel to the canvas, and the row it sits in then overflows.
        setSlotWidth(Math.floor(entry.contentRect.width));
      }
    });
    observer.observe(node);
    slotObserverRef.current = observer;
  }, []);
  useEffect(() => () => slotObserverRef.current?.disconnect(), []);
  const [windowWidth, windowHeight] = useWindowSize();

  const {
    data: dataDocument,
    error: errorDocument,
    isFetching: dataDocumentIsFetching,
  } = useDocumentQuery(documentId);

  return (
    <Modal width={800} showModal={show} onClose={onClose} fullHeight lowerZIndex>
      <ModalHeader
        title={
          dataDocumentIsFetching
            ? "Loading..."
            : `${dataDocument ? getShortLabelByLetterCount(dataDocument.title, 90) : "no label"}`
        }
        onClose={onClose}
      />

      <ModalContent column noPadding>
        <StyledDocumentModalAnnotator ref={slotRef}>
          {document ? (
            <AnnotatorProvider>
              <TextAnnotator
                documentId={documentId}
                dataDocument={dataDocument}
                dataDocumentIsFetching={dataDocumentIsFetching}
                dataDocumentError={errorDocument}
                width={Math.max(0, slotWidth)}
                height={windowHeight - 135}
                displayLineNumbers={true}
                hlEntities={[EntityEnums.Class.Territory]}
                forwardAnnotator={(newAnnotator) => {
                  anchor?.entityId &&
                    newAnnotator?.scrollToAnchor(anchor?.entityId, anchor?.occurence || 0);
                }}
                thisTerritoryEntityId={anchor?.entityId}
                // Documents page annotator is view/search only; editing anchors
                // and content happens in the Main page annotator box.
                canEditDocument={false}
                disableCreate
                // Annotator lives inside this modal; lift its body-appended
                // overlays above the modal (default lib values sit under it).
                overlayZIndex={{ contextMenu: 700, settingsOverlay: 650 }}
                noBorderRadius
              />
            </AnnotatorProvider>
          ) : (
            <div>Document not found</div>
          )}
        </StyledDocumentModalAnnotator>
      </ModalContent>
    </Modal>
  );
};

export default DocumentModalEdit;
