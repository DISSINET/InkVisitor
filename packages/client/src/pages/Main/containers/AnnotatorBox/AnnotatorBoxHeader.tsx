import { EntityEnums } from "@inkvisitor/shared/enums";
import { IDocument, IEntity } from "@inkvisitor/shared/types";
import { Button, Loader } from "components";
import { DocumentModalExport, EntitySuggester, EntityTag } from "components/advanced";
import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  StyledAnnotatorHeader,
  StyledAnnotatorHeaderResource,
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
}

/**
 * Resource identity for the annotator Box header: the suggester when no
 * resource is picked yet, otherwise the resource tag with its export/unlink
 * buttons. The document title itself is not rendered here — it is the Box's
 * label, so StyledLabel's own ellipsis handles it.
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

      {selectedDocumentIsFetching && !selectedDocument && (
        <StyledLoadingDocument>
          <Loader show size={16} />
          <StyledInfoText>Loading</StyledInfoText>
        </StyledLoadingDocument>
      )}

      {showExportModal && selectedDocument && (
        <DocumentModalExport
          document={selectedDocument}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </StyledAnnotatorHeader>
  );
};
