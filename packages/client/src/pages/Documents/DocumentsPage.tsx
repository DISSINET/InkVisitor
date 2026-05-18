import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

import { EntityEnums } from "@shared/enums";
import { DropdownItem, IDocument } from "@shared/types";
import api from "api";
import { BaseDropdown, Button, Loader, Submit } from "components";
import { DocumentModalEdit, DocumentModalExport } from "components/advanced";
import React, { ChangeEvent, useMemo, useRef, useState } from "react";
import { FaArrowDownShortWide, FaArrowUpShortWide } from "react-icons/fa6";
import { DocumentRow } from "./DocumentRow/DocumentRow";
import {
  StyledBackground,
  StyledBoxWrap,
  StyledContent,
  StyledGrid,
  StyledGridScrollArea,
  StyledHeading,
  StyledInputWrap,
  StyledSortControls,
  StyledSortLabel,
  StyledSortRow,
} from "./DocumentsPageStyles";
import { compareDocuments } from "./utils";
import { DocumentSortDirection, DocumentSortField, DocumentWithResource } from "./types";

const sortFieldOptions: DropdownItem[] = [
  { value: "documentName", label: "Document name" },
  { value: "resourceLabel", label: "Resource label" },
  { value: "anchorCount", label: "Anchor count" },
];

export const DocumentsPage: React.FC = ({}) => {
  const queryClient = useQueryClient();

  const {
    data: documents,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await api.documentsGet({});
      return res.data ?? [];
    },
    enabled: api.isLoggedIn(),
  });

  const {
    data: resources,
    error: resourcesError,
    isFetching: resourcesIsFetching,
  } = useQuery({
    queryKey: ["resourcesWithDocuments"],
    queryFn: async () => {
      const res = await api.entitiesSearch({
        resourceHasDocument: true,
      });
      return res.data ?? [];
    },
    enabled: api.isLoggedIn(),
  });

  const documentsWithResources: DocumentWithResource[] = useMemo(() => {
    return documents
      ? documents.map((document) => {
          const resource =
            resources && resources.find((resource) => resource.data.documentId === document.id);
          return { document, resource: resource ?? false };
        })
      : [];
  }, [resources, documents]);

  const [sortField, setSortField] = useState<DocumentSortField>("documentName");
  const [sortDirection, setSortDirection] = useState<DocumentSortDirection>("asc");

  const selectedSortField = useMemo(
    () => sortFieldOptions.find((option) => option.value === sortField) ?? sortFieldOptions[0],
    [sortField]
  );

  const sortedDocumentsWithResources = useMemo(() => {
    return [...documentsWithResources].sort((a, b) =>
      compareDocuments(a, b, sortField, sortDirection)
    );
  }, [documentsWithResources, sortField, sortDirection]);

  const uploadDocumentMutation = useMutation({
    mutationFn: async (doc: IDocument) => api.documentUpload(doc),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (variables, data) => {
      setEditDocumentId(false);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (text) {
          handleUpload(file.name, text as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleUpload = (filename: string, text: string) => {
    const document: IDocument = {
      id: uuidv4(),
      title: filename.substring(0, filename.lastIndexOf(".")) || filename,
      content: text,
      entityIds: {
        [EntityEnums.Class.Action]: [],
        [EntityEnums.Class.Resource]: [],
        [EntityEnums.Class.Concept]: [],
        [EntityEnums.Class.Person]: [],
        [EntityEnums.Class.Location]: [],
        [EntityEnums.Class.Event]: [],
        [EntityEnums.Class.Object]: [],
        [EntityEnums.Class.Territory]: [],
        [EntityEnums.Class.Statement]: [],
        [EntityEnums.Class.Value]: [],
        [EntityEnums.Class.Being]: [],
        [EntityEnums.Class.Group]: [],
      },
      anchors: [],
    };
    uploadDocumentMutation.mutate(document);
    if (inputRef.current) inputRef.current.value = "";
  };

  const [exportedDocumentId, setExportedDocumentId] = useState<string | false>(false);
  const exportedDocument = documents?.find((doc) => doc.id === exportedDocumentId);

  const [editedDocumentId, setEditedDocumentId] = useState<string | false>(false);

  const handleDocumentEdit = (id: string) => {
    setEditedDocumentId(id);
  };
  const handleDocumentExport = (id: string) => {
    setExportedDocumentId(id);
  };

  const handleModalClose = () => {
    setEditedDocumentId(false);
    setExportedDocumentId(false);
  };

  const documentDeleteMutation = useMutation({
    mutationFn: async (id: string) => await api.documentDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDocToDelete(false);
    },
  });

  const [docToDelete, setDocToDelete] = useState<string | false>(false);
  const [editDocumentId, setEditDocumentId] = useState<string | false>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sortDirectionTooltip = sortDirection === "asc" ? "Sort ascending" : "Sort descending";

  return (
    <>
      <StyledContent>
        <StyledBoxWrap>
          <StyledBackground>
            <StyledHeading>Documents</StyledHeading>
            <StyledSortRow>
              <StyledSortLabel>Sort by</StyledSortLabel>
              <StyledSortControls>
                <BaseDropdown
                  options={sortFieldOptions}
                  value={selectedSortField}
                  onChange={(selected) => {
                    const nextField = selected[0]?.value as DocumentSortField | undefined;
                    if (nextField) {
                      setSortField(nextField);
                    }
                  }}
                  width={220}
                />
                <Button
                  icon={sortDirection === "asc" ? <FaArrowUpShortWide /> : <FaArrowDownShortWide />}
                  color="primary"
                  inverted
                  tooltipLabel={sortDirectionTooltip}
                  onClick={() =>
                    setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
                  }
                />
              </StyledSortControls>
            </StyledSortRow>
            <StyledGridScrollArea>
              <StyledGrid>
                {/* <DocumentsStyledScrollbar
                  style={{ height: "100%", width: "100%" }}
                > */}
                {sortedDocumentsWithResources.map((documentWithResource: DocumentWithResource) => {
                  const documentId = documentWithResource.document.id;
                  return (
                    <DocumentRow
                      key={documentId}
                      document={documentWithResource.document}
                      resource={documentWithResource.resource}
                      handleDocumentEdit={handleDocumentEdit}
                      handleDocumentExport={handleDocumentExport}
                      setDocToDelete={setDocToDelete}
                      updateDocumentMutation={updateDocumentMutation}
                      editMode={editDocumentId === documentId}
                      setEditMode={() => setEditDocumentId(documentId)}
                      cancelEditMode={() => setEditDocumentId(false)}
                    />
                  );
                })}
                {/* </DocumentsStyledScrollbar> */}
              </StyledGrid>
            </StyledGridScrollArea>
            <StyledInputWrap onClick={() => inputRef.current?.click()}>
              Upload document
              <input
                ref={inputRef}
                type="file"
                accept=".txt,.xml"
                title="x"
                onChange={handleFileChange}
                hidden
              />
            </StyledInputWrap>

            <Loader show={resourcesIsFetching} size={50} />
          </StyledBackground>
        </StyledBoxWrap>
      </StyledContent>

      {editedDocumentId && (
        <DocumentModalEdit documentId={editedDocumentId} onClose={handleModalClose} />
      )}
      {exportedDocumentId && exportedDocument && (
        <DocumentModalExport document={exportedDocument} onClose={handleModalClose} />
      )}

      <Submit
        title="Delete document"
        text="Do you really want to delete this document?"
        show={docToDelete !== false}
        onSubmit={() => docToDelete && documentDeleteMutation.mutate(docToDelete)}
        onCancel={() => setDocToDelete(false)}
      />
    </>
  );
};
