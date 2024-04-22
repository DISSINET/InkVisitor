import { IResponseDocument } from "@shared/types";
import { Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import { useWindowSize } from "hooks/useWindowSize";
import React, { useEffect, useRef, useState } from "react";
import { getShortLabelByLetterCount } from "utils/utils";

interface DocumentModalExportProps {
  document: IResponseDocument | undefined;
  onClose: () => void;
}
const DocumentModalExport: React.FC<DocumentModalExportProps> = ({
  onClose,
  document,
}) => {
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
          <div>{document ? <>exporting</> : <div>Document not found</div>}</div>
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

export default DocumentModalExport;
