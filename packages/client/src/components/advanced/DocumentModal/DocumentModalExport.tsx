import React, { useEffect, useMemo, useRef, useState } from "react";

import { EntityEnums } from "@shared/enums";
import { IResponseDocument } from "@shared/types";
import theme from "Theme/theme";
import {
  Button,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { useWindowSize } from "hooks/useWindowSize";
import {
  FaCheckSquare,
  FaCircle,
  FaRegSave,
  FaRegSquare,
} from "react-icons/fa";
import { MdLibraryAddCheck } from "react-icons/md";
import { EntityColors } from "types";
import { getShortLabelByLetterCount } from "utils/utils";
import {
  StyledExportDocumentClassCheckbox,
  StyledExportDocumentClassLabel,
  StyledExportDocumentClassReference,
  StyledExportDocumentContainer,
} from "./DocumentModalStyles";
import api from "api";

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

  const [exportedClasses, setExportedClasses] = useState<EntityEnums.Class[]>(
    Object.values(EntityEnums.Class)
  );

  const allClassesSelected =
    exportedClasses.length === Object.values(EntityEnums.Class).length;
  const atLeastOneSelected = exportedClasses.length > 0;

  const handleSelectAll = () => {
    setExportedClasses(Object.values(EntityEnums.Class));
  };

  const handleUnselectAll = () => {
    setExportedClasses([]);
  };

  const handleToggleSelectClass = (entityClass: EntityEnums.Class) => {
    if (exportedClasses.includes(entityClass)) {
      setExportedClasses(exportedClasses.filter((c) => c !== entityClass));
    } else {
      setExportedClasses([...exportedClasses, entityClass]);
    }
  };

  const sumAnchorsToExport = useMemo<number>(() => {
    return exportedClasses.reduce((acc, entityClass) => {
      const anchors = document?.referencedEntityIds[entityClass];
      if (anchors) {
        return acc + anchors.length;
      } else {
        return acc;
      }
    }, 0);
  }, [exportedClasses]);

  return (
    <Modal width={500} showModal={show} onClose={onClose}>
      <ModalHeader
        title={`Export ${
          document
            ? getShortLabelByLetterCount(document?.title, 90)
            : "no label"
        }`}
      />
      <ModalContent>
        <div>
          {document && (
            <div>
              <StyledExportDocumentContainer>
                {/* <StyledExportDocumentContainerTH key={"1"}>
                Entity type
              </StyledExportDocumentContainerTH>
              <StyledExportDocumentContainerTH
                key={"2"}
              ></StyledExportDocumentContainerTH>
              <StyledExportDocumentContainerTH key={"3"}>
                Document Anchors
              </StyledExportDocumentContainerTH> */}

                {Object.values(EntityEnums.Class).map((entityClassId) => {
                  const classItem = EntityColors[entityClassId];
                  const classLabel = classItem?.label || entityClassId;

                  const classColorName = classItem?.color || "black";
                  const classColor = theme.color[classColorName] as string;

                  const selected = exportedClasses.includes(entityClassId);
                  const classReferences =
                    document?.referencedEntityIds[entityClassId];

                  return (
                    <React.Fragment key={entityClassId}>
                      <StyledExportDocumentClassCheckbox>
                        {selected ? (
                          <FaCheckSquare
                            size={25}
                            onClick={() => {
                              handleToggleSelectClass(entityClassId);
                            }}
                          />
                        ) : (
                          <FaRegSquare
                            size={25}
                            onClick={() => {
                              handleToggleSelectClass(entityClassId);
                            }}
                          />
                        )}
                      </StyledExportDocumentClassCheckbox>
                      <StyledExportDocumentClassLabel
                        $selected={selected}
                        onClick={() => {
                          handleToggleSelectClass(entityClassId);
                        }}
                      >
                        {classLabel}
                      </StyledExportDocumentClassLabel>

                      <StyledExportDocumentClassReference>
                        <FaCircle
                          color={selected ? classColor : "transparent"}
                          size={16}
                        />
                        {classReferences.length}
                      </StyledExportDocumentClassReference>
                    </React.Fragment>
                  );
                })}

                <React.Fragment>
                  <MdLibraryAddCheck
                    onClick={() => {
                      !allClassesSelected
                        ? handleSelectAll()
                        : handleUnselectAll();
                    }}
                  />
                  <StyledExportDocumentClassLabel
                    $selected={false}
                    onClick={() => {
                      !allClassesSelected
                        ? handleSelectAll()
                        : handleUnselectAll();
                    }}
                  >
                    {!allClassesSelected ? "Select all" : "Deselect all"}
                  </StyledExportDocumentClassLabel>
                </React.Fragment>
                <span></span>
              </StyledExportDocumentContainer>
            </div>
          )}
          {!document && <div>Document not found</div>}
        </div>
      </ModalContent>
      <ModalFooter>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Button
            onClick={() => {
              if (document?.id) {
                api.documentExport(document.id, exportedClasses);
              }
            }}
            icon={<FaRegSave size={20} style={{ marginRight: "3px" }} />}
            fullWidth
            label={`export document with ${sumAnchorsToExport} anchors`}
            color="primary"
          />
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default DocumentModalExport;
