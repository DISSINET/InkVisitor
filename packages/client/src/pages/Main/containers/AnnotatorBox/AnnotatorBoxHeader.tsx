import { EntityEnums } from "@inkvisitor/shared/enums";
import { IDocument, IEntity } from "@inkvisitor/shared/types";
import { Button, Loader } from "components";
import {
  DocumentModalExport,
  DocumentTitle,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import { IcoLock } from "Theme/icons";
import {
  StyledAnnotatorHeader,
  StyledAnnotatorHeaderLock,
  StyledAnnotatorHeaderResource,
  StyledAnnotatorHeaderTitle,
  StyledInfoText,
  StyledLoadingDocument,
} from "./AnnotatorBoxStyles";

interface AnnotatorBoxHeader {
  selectedResource: IEntity | false;
  setSelectedResourceId: (id: string | false) => void;
  selectedDocument?: IDocument;
  selectedDocumentIsFetching: boolean;
  resources: IEntity[];
  onResourcePickerFocus?: () => void;
  canSelectResource: boolean;
  canEditDocument: boolean;
  /** Name of the user holding the document's edit lock, or null when it is free. */
  lockHolderName?: string | null;
}

/**
 * Document identity for the annotator Box header, sitting beside the box label:
 * the document title, then the resource — a suggester until one is picked,
 * after that the resource tag with its export/unlink buttons.
 */
export const AnnotatorBoxHeader: React.FC<AnnotatorBoxHeader> = ({
  selectedResource,
  setSelectedResourceId,
  selectedDocument,
  selectedDocumentIsFetching,
  resources,
  onResourcePickerFocus,
  canSelectResource,
  canEditDocument,
  lockHolderName = null,
}) => {
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  return (
    <StyledAnnotatorHeader>
      {!selectedResource && (
        <div onFocus={onResourcePickerFocus}>
          <EntitySuggester
            placeholder="select resource"
            categoryTypes={[EntityEnums.Class.Resource]}
            preSuggestions={resources}
            onPicked={(entity) => {
              if (resources.some((r) => r.id === entity.id)) {
                setSelectedResourceId(entity.id);
              } else {
                toast.warning("Resource does not have a document");
              }
            }}
            isHidden={!canSelectResource}
          />
        </div>
      )}
      {selectedResource && (
        <StyledAnnotatorHeaderResource>
          <EntityTag
            fullWidth
            entity={selectedResource}
            button={
              selectedDocument && canEditDocument ? (
                <Button
                  inverted
                  color="info"
                  icon={<FaDownload size={11} />}
                  onClick={() => {
                    setShowExportModal(true);
                  }}
                  tooltipLabel="export document"
                  tooltipPosition="top"
                  shape="sharp"
                />
              ) : undefined
            }
            unlinkButton={{
              onClick: () => {
                setSelectedResourceId(false);
              },
              tooltipLabel: "use different resource",
            }}
          />
        </StyledAnnotatorHeaderResource>
      )}

      {/* Both occupy the same slot after the resource: the loader stands in for
          the title until the document it names has arrived. */}
      <StyledAnnotatorHeaderTitle>
        {selectedDocument ? (
          <DocumentTitle title={selectedDocument.title} width="full" noMargin />
        ) : (
          selectedDocumentIsFetching && (
            <StyledLoadingDocument>
              <Loader show size={16} />
              <StyledInfoText>Loading</StyledInfoText>
            </StyledLoadingDocument>
          )
        )}
      </StyledAnnotatorHeaderTitle>

      {lockHolderName && (
        <StyledAnnotatorHeaderLock title={`${lockHolderName} is editing this document`}>
          <IcoLock size={11} />
          <span>{lockHolderName} is editing</span>
        </StyledAnnotatorHeaderLock>
      )}

      {showExportModal && selectedDocument && (
        <DocumentModalExport
          documents={[selectedDocument]}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </StyledAnnotatorHeader>
  );
};
