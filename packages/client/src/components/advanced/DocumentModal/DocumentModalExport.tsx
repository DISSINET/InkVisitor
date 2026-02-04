import React, { useCallback, useEffect, useMemo, useState } from "react";

import { EntityEnums } from "@shared/enums";
import { IDocument } from "@shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import {
  FaCheckSquare,
  FaCircle,
  FaDownload,
  FaRegSquare,
} from "react-icons/fa";
import { MdLibraryAddCheck, MdOutlineLibraryAddCheck } from "react-icons/md";
import { useTheme } from "styled-components";
import { EntityColors } from "types";
import { getShortLabelByLetterCount } from "utils/utils";
import {
  StyledExportDocumentClassCheckbox,
  StyledExportDocumentClassLabel,
  StyledExportDocumentClassReference,
  StyledExportDocumentContainer,
  StyledExportStatsSection,
} from "./DocumentModalStyles";
import { DocumentTitle } from "..";

interface DocumentModalExport {
  document: IDocument;
  onClose: () => void;
}
const DocumentModalExport: React.FC<DocumentModalExport> = ({
  onClose,
  document,
}) => {
  const theme = useTheme();
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
      const anchors = document?.entityIds[entityClass];
      if (anchors) {
        return acc + anchors.length;
      } else {
        return acc;
      }
    }, 0);
  }, [exportedClasses]);

  const SelectAllComponent = useCallback(() => {
    return (
      <React.Fragment>
        <>
          {!allClassesSelected ? (
            <MdLibraryAddCheck
              onClick={() => {
                handleSelectAll();
              }}
            />
          ) : (
            <MdOutlineLibraryAddCheck
              onClick={() => {
                handleUnselectAll();
              }}
            />
          )}
        </>
        <StyledExportDocumentClassLabel
          $selected={false}
          onClick={() => {
            !allClassesSelected ? handleSelectAll() : handleUnselectAll();
          }}
        >
          {!allClassesSelected ? "Select all" : "Deselect all"}
        </StyledExportDocumentClassLabel>
      </React.Fragment>
    );
  }, [allClassesSelected]);

  return (
    <Modal width={500} showModal={show} onClose={onClose}>
      <ModalHeader
        title={`Export document`}
        content={
          <div style={{ display: "grid" }}>
            <DocumentTitle title={document.title} />
          </div>
        }
      />
      <ModalContent enableScroll>
        <div>
          {document && (
            <div>
              <StyledExportDocumentContainer>
                <SelectAllComponent /> <span></span>
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
                  const classReferences = document?.entityIds[entityClassId];

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
                <SelectAllComponent />
                <span></span>
              </StyledExportDocumentContainer>
            </div>
          )}
          {!document && <div>Document not found</div>}
        </div>
      </ModalContent>
      <ModalFooter spaceBetween>
        <StyledExportStatsSection>
          <b>{sumAnchorsToExport}</b> anchors will be exported
        </StyledExportStatsSection>
        <ButtonGroup>
          <Button
            key="cancel"
            label="Cancel"
            color="greyer"
            inverted
            onClick={() => {
              onClose();
            }}
          />
          <Button
            onClick={() => {
              if (document?.id) {
                api.documentExport(
                  document.id,
                  exportedClasses,
                  document?.title || document.id
                );
              }
            }}
            icon={<FaDownload size={16} style={{ marginRight: "3px" }} />}
            label={`export`}
            color="info"
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};

export default DocumentModalExport;
