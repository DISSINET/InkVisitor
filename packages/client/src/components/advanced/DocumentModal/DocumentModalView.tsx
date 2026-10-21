import React, { useCallback, useEffect, useRef, useState } from "react";

import { EntityEnums } from "@inkvisitor/shared/enums";
import { Modal, ModalContent, ModalHeader, Submit } from "components";
import { useDocumentQuery } from "hooks/react-query";
import { getShortLabelByLetterCount } from "utils/utils";
import TextAnnotator from "../Annotator/Annotator";
import AnnotatorProvider from "../Annotator/AnnotatorProvider";
import { CANVAS_WRAPPER_PADDING_PX } from "../Annotator/styles";
import {
  StyledDocumentModalAnnotator,
  StyledDocumentModalAnnotatorFill,
} from "./DocumentModalStyles";

interface DocumentModalView {
  documentId: string;
  onClose: () => void;
  anchor?: { entityId: string; occurence?: number };
  /** Allows editing the text and the XML; anchors stay read-only either way. */
  canEditDocument?: boolean;
}
const DocumentModalView: React.FC<DocumentModalView> = ({
  documentId,
  onClose,
  anchor,
  canEditDocument = false,
}) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
  }, []);

  const [hasUnsavedTextEdits, setHasUnsavedTextEdits] = useState(false);
  const [showDiscardSubmit, setShowDiscardSubmit] = useState(false);
  const handleClose = () => (hasUnsavedTextEdits ? setShowDiscardSubmit(true) : onClose());

  // The size the canvas has is the modal body's, which only the body knows, so
  // it is measured rather than restated here as the window size less an
  // allowance.
  //
  // Measured through a callback ref rather than by element id: Modal renders
  // nothing until showModal turns true, so an id lookup on mount finds no
  // element, and an effect keyed on the id alone never retries. A callback ref
  // fires when the node itself appears.
  const [slotWidth, setSlotWidth] = useState(0);
  const [slotHeight, setSlotHeight] = useState(0);
  const slotObserverRef = useRef<ResizeObserver | null>(null);
  const slotRef = useCallback((node: HTMLDivElement | null) => {
    slotObserverRef.current?.disconnect();
    slotObserverRef.current = null;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        // Rounded down, never up: a size measured a pixel over hands that
        // pixel to the canvas, and the box it sits in then overflows.
        setSlotWidth(Math.floor(entry.contentRect.width));
        setSlotHeight(Math.floor(entry.contentRect.height));
      }
    });
    observer.observe(node);
    slotObserverRef.current = observer;
  }, []);
  useEffect(() => () => slotObserverRef.current?.disconnect(), []);

  const {
    data: dataDocument,
    error: errorDocument,
    isFetching: dataDocumentIsFetching,
  } = useDocumentQuery(documentId);

  return (
    <Modal width={900} showModal={show} onClose={handleClose} fullHeight narrowGutter lowerZIndex>
      <ModalHeader
        title={
          dataDocumentIsFetching
            ? "Loading..."
            : `${dataDocument ? getShortLabelByLetterCount(dataDocument.title, 90) : "no label"}`
        }
        onClose={handleClose}
      />

      <ModalContent column noPadding>
        <StyledDocumentModalAnnotator ref={slotRef}>
          <StyledDocumentModalAnnotatorFill>
            {document ? (
              <AnnotatorProvider>
                <TextAnnotator
                  documentId={documentId}
                  dataDocument={dataDocument}
                  dataDocumentIsFetching={dataDocumentIsFetching}
                  dataDocumentError={errorDocument}
                  width={Math.max(0, slotWidth)}
                  height={Math.max(0, slotHeight - 2 * CANVAS_WRAPPER_PADDING_PX)}
                  displayLineNumbers={true}
                  hlEntities={[EntityEnums.Class.Territory]}
                  forwardAnnotator={(newAnnotator) => {
                    anchor?.entityId &&
                      newAnnotator?.scrollToAnchor(anchor?.entityId, anchor?.occurence || 0);
                  }}
                  thisTerritoryEntityId={anchor?.entityId}
                  // Anchors are added and removed in the Main page annotator box,
                  // where the territory and statement context is at hand.
                  canEditDocument={canEditDocument}
                  canEditAnchors={false}
                  disableCreate
                  noBorderRadius
                  onUnsavedTextEditsChange={setHasUnsavedTextEdits}
                />
              </AnnotatorProvider>
            ) : (
              <div>Document not found</div>
            )}
          </StyledDocumentModalAnnotatorFill>
        </StyledDocumentModalAnnotator>
      </ModalContent>

      <Submit
        title="Unsaved text changes"
        text="You have unsaved text edits. Close the document and discard them?"
        submitLabel="Discard"
        show={showDiscardSubmit}
        onSubmit={onClose}
        onCancel={() => setShowDiscardSubmit(false)}
      />
    </Modal>
  );
};

export default DocumentModalView;
