import React, { useEffect, useMemo, useState } from "react";

import { EntityEnums } from "@inkvisitor/shared/enums";
import { IDocument } from "@inkvisitor/shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Checkbox,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { FaCircle, FaDownload } from "react-icons/fa";
import { MdLibraryAddCheck, MdOutlineLibraryAddCheck } from "react-icons/md";
import { useTheme } from "styled-components";
import { EntityColors } from "types";
import { zipFileNameForDate } from "utils/documentExportZip";
import { DocumentTitle } from "..";
import { IcoChevronDown, IcoChevronRight } from "Theme/icons";
import {
  StyledExportDocumentClassCheckbox,
  StyledExportDocumentClassLabel,
  StyledExportDocumentClassReference,
  StyledExportDocumentContainer,
  StyledExportDocumentsToggle,
  StyledExportFooterActions,
  StyledExportHeaderTitle,
  StyledExportInfoText,
  StyledExportStatsSection,
  StyledExportTitleList,
} from "./DocumentModalStyles";

interface DocumentModalExport {
  // one shared class selection applies to every document of the batch
  documents: IDocument[];
  onClose: () => void;
}
const DocumentModalExport: React.FC<DocumentModalExport> = ({ onClose, documents }) => {
  const theme = useTheme();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  const [exportedClasses, setExportedClasses] = useState<EntityEnums.Class[]>(
    Object.values(EntityEnums.Class),
  );

  const isBatch = documents.length > 1;
  const [showDocumentList, setShowDocumentList] = useState(false);

  const allClassesSelected = exportedClasses.length === Object.values(EntityEnums.Class).length;

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

  const anchorsPerClass = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    Object.values(EntityEnums.Class).forEach((entityClass) => {
      counts[entityClass] = documents.reduce(
        (acc, document) => acc + (document.entityIds[entityClass]?.length ?? 0),
        0,
      );
    });
    return counts;
  }, [documents]);

  const sumAnchorsToExport = useMemo<number>(() => {
    return exportedClasses.reduce(
      (acc, entityClass) => acc + (anchorsPerClass[entityClass] ?? 0),
      0,
    );
  }, [exportedClasses, anchorsPerClass]);

  const handleExport = () => {
    if (!documents.length) {
      return;
    }
    if (documents.length === 1) {
      const [document] = documents;
      api.documentExport(document.id, exportedClasses, document.title || document.id);
    } else {
      api.documentsExportZip(
        documents.map((document) => document.id),
        exportedClasses,
        zipFileNameForDate(new Date()),
      );
    }
  };

  const selectAllToggle = (
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

  return (
    <Modal width={500} showModal={show} onClose={onClose}>
      <ModalHeader
        title={isBatch ? `Export ${documents.length} documents` : `Export document`}
        content={
          isBatch ? undefined : (
            <StyledExportHeaderTitle>
              <DocumentTitle title={documents[0].title} />
            </StyledExportHeaderTitle>
          )
        }
      />
      <ModalContent enableScroll>
        <div>
          {isBatch && (
            <>
              <StyledExportDocumentsToggle
                type="button"
                onClick={() => setShowDocumentList(!showDocumentList)}
              >
                {showDocumentList ? <IcoChevronDown /> : <IcoChevronRight />}
                {showDocumentList ? "hide document titles" : "show document titles"}
              </StyledExportDocumentsToggle>
              {showDocumentList && (
                <StyledExportTitleList>
                  {documents.map((document) => (
                    <DocumentTitle
                      key={document.id}
                      title={document.title}
                      size="sm"
                      width={220}
                      noMargin
                    />
                  ))}
                </StyledExportTitleList>
              )}
              <StyledExportInfoText>
                The same anchor selection applies to all {documents.length} documents.
                <br />
                The counts below are summed across them.
              </StyledExportInfoText>
            </>
          )}
          <StyledExportDocumentContainer>
            {selectAllToggle} <span></span>
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

              return (
                <React.Fragment key={entityClassId}>
                  <StyledExportDocumentClassCheckbox>
                    <Checkbox
                      value={selected}
                      onChangeFn={() => {
                        handleToggleSelectClass(entityClassId);
                      }}
                      noFill
                    />
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
                    <FaCircle color={selected ? classColor : "transparent"} size={16} />
                    {anchorsPerClass[entityClassId]}
                  </StyledExportDocumentClassReference>
                </React.Fragment>
              );
            })}
            {selectAllToggle}
            <span></span>
          </StyledExportDocumentContainer>
        </div>
      </ModalContent>
      <ModalFooter spaceBetween>
        <StyledExportStatsSection>
          {isBatch ? (
            <>
              <b>{sumAnchorsToExport}</b> anchors from <b>{documents.length}</b> documents
            </>
          ) : (
            <>
              <b>{sumAnchorsToExport}</b> anchors will be exported
            </>
          )}
        </StyledExportStatsSection>
        <StyledExportFooterActions>
          <ButtonGroup>
            <CancelButton
              key="cancel"
              onClick={() => {
                onClose();
              }}
            />
            <Button
              onClick={handleExport}
              icon={<FaDownload size={14} style={{ marginRight: "3px" }} />}
              label={isBatch ? `export .zip` : `export`}
              color="info"
            />
          </ButtonGroup>
        </StyledExportFooterActions>
      </ModalFooter>
    </Modal>
  );
};

export default DocumentModalExport;
