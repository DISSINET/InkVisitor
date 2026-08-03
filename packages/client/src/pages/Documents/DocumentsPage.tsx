import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IDocument } from "@inkvisitor/shared/types";
import api from "api";
import { Button, Loader, Submit } from "components";
import { DocumentModalEdit, DocumentModalExport } from "components/advanced";
import {
  useDocumentsQuery,
  useResourcesWithDocumentsQuery,
  useUserQuery,
} from "hooks/react-query";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaDownload } from "react-icons/fa";
import { DocumentRow } from "./DocumentRow/DocumentRow";
import { DocumentsTableHeader } from "./DocumentsTableHeader";
import {
  StyledBackground,
  StyledBoxWrap,
  StyledContent,
  StyledGrid,
  StyledGridScrollArea,
  StyledHeading,
  StyledInputWrap,
  StyledSelectionBar,
  StyledSelectionCount,
} from "./DocumentsPageStyles";
import { compareDocuments } from "./utils";
import { DocumentSortField, DocumentSortState, DocumentWithResource } from "./types";

export const DocumentsPage: React.FC = ({}) => {
  const queryClient = useQueryClient();

  // Editors may only export/edit/delete documents whose linked Resource is
  // assigned to them (Manage Users). Owner/Admin manage everything; for an
  // Editor everything else is view-only (#2/#3).
  const { data: userData } = useUserQuery(true);
  const isAdminOrOwner =
    userData?.role === UserEnums.Role.Owner ||
    userData?.role === UserEnums.Role.Admin;
  const assignedResourceIds = useMemo(
    () => userData?.resourceRights?.map((r) => r.resource.id) ?? [],
    [userData]
  );
  const canManageDocument = useCallback(
    (resourceId: string | false): boolean => {
      if (isAdminOrOwner) {
        return true;
      }
      if (userData?.role !== UserEnums.Role.Editor) {
        return false;
      }
      return resourceId !== false && assignedResourceIds.includes(resourceId);
    },
    [isAdminOrOwner, userData, assignedResourceIds]
  );

  // documents page is the management hub - always refetch on entry so edits
  // made elsewhere (or by other users) show up regardless of staleTime
  const { data: documents, error, isFetching } = useDocumentsQuery(true, "always");

  const {
    data: resources,
    error: resourcesError,
    isFetching: resourcesIsFetching,
  } = useResourcesWithDocumentsQuery(true, "always");

  const documentsWithResources: DocumentWithResource[] = useMemo(() => {
    return documents
      ? documents.map((document) => {
          const resource =
            resources && resources.find((resource) => resource.data.documentId === document.id);
          return { document, resource: resource ?? false };
        })
      : [];
  }, [resources, documents]);

  const [sort, setSort] = useState<DocumentSortState>({
    field: "documentName",
    direction: "asc",
  });

  const handleSort = useCallback((field: DocumentSortField) => {
    setSort((current) => {
      if (!current || current.field !== field) {
        return { field, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { field, direction: "desc" };
      }
      return null;
    });
  }, []);

  const sortedDocumentsWithResources = useMemo(() => {
    if (!sort) {
      return documentsWithResources;
    }
    return [...documentsWithResources].sort((a, b) =>
      compareDocuments(a, b, sort.field, sort.direction)
    );
  }, [documentsWithResources, sort]);

  const uploadDocumentMutation = useMutation({
    mutationFn: async (doc: IDocument) => api.documentUpload(doc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: () => {
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

  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const exportableIds = useMemo(
    () =>
      sortedDocumentsWithResources
        .filter((item) => canManageDocument(item.resource ? item.resource.id : false))
        .map((item) => item.document.id),
    [sortedDocumentsWithResources, canManageDocument]
  );

  // a selected document may disappear (deleted here or elsewhere) or lose its
  // resource assignment, which takes the export right with it
  useEffect(() => {
    setSelectedDocumentIds((current) => {
      const kept = current.filter((id) => exportableIds.includes(id));
      return kept.length === current.length ? current : kept;
    });
  }, [exportableIds]);

  const handleToggleSelected = useCallback((id: string) => {
    setSelectedDocumentIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  }, []);

  const handleToggleSelectAll = useCallback(
    (selected: boolean) => {
      setSelectedDocumentIds(selected ? exportableIds : []);
    },
    [exportableIds]
  );

  const [exportedDocumentIds, setExportedDocumentIds] = useState<string[] | false>(false);
  const exportedDocuments = useMemo(
    () =>
      exportedDocumentIds
        ? exportedDocumentIds
            .map((id) => documents?.find((doc) => doc.id === id))
            .filter((doc): doc is IDocument => !!doc)
        : [],
    [exportedDocumentIds, documents]
  );

  const [editedDocumentId, setEditedDocumentId] = useState<string | false>(false);

  const handleDocumentEdit = (id: string) => {
    setEditedDocumentId(id);
  };
  const handleDocumentExport = (id: string) => {
    setExportedDocumentIds([id]);
  };

  const handleModalClose = () => {
    setEditedDocumentId(false);
    setExportedDocumentIds(false);
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

  const documentToDelete = documents?.find((doc) => doc.id === docToDelete);
  const documentToDeleteAnchorCount = useMemo(() => {
    if (!documentToDelete) {
      return 0;
    }
    return Object.values(documentToDelete.entityIds).reduce(
      (total, classEntities) => total + (Array.isArray(classEntities) ? classEntities.length : 0),
      0
    );
  }, [documentToDelete]);

  return (
    <>
      <StyledContent>
        <StyledBoxWrap>
          <StyledBackground>
            <StyledHeading>Documents</StyledHeading>
            <StyledSelectionBar>
              <Button
                icon={<FaDownload />}
                color="primary"
                inverted
                disabled={selectedDocumentIds.length === 0}
                label={`export selected (${selectedDocumentIds.length})`}
                tooltipLabel={
                  selectedDocumentIds.length > 1
                    ? "export the selected documents as one .zip"
                    : "export the selected document"
                }
                onClick={() => setExportedDocumentIds(selectedDocumentIds)}
              />
              {selectedDocumentIds.length > 0 && (
                <>
                  <StyledSelectionCount>
                    {selectedDocumentIds.length} of {exportableIds.length} selected
                  </StyledSelectionCount>
                  <Button
                    color="greyer"
                    inverted
                    label="clear"
                    onClick={() => setSelectedDocumentIds([])}
                  />
                </>
              )}
            </StyledSelectionBar>
            <StyledGridScrollArea>
              <StyledGrid>
                <DocumentsTableHeader
                  sort={sort}
                  onSort={handleSort}
                  allSelected={
                    exportableIds.length > 0 &&
                    selectedDocumentIds.length === exportableIds.length
                  }
                  someSelected={selectedDocumentIds.length > 0}
                  hasExportableDocuments={exportableIds.length > 0}
                  onToggleSelectAll={handleToggleSelectAll}
                />
                {sortedDocumentsWithResources.map((documentWithResource: DocumentWithResource) => {
                  const documentId = documentWithResource.document.id;
                  return (
                    <DocumentRow
                      key={documentId}
                      document={documentWithResource.document}
                      resource={documentWithResource.resource}
                      canManage={canManageDocument(documentWithResource.resource ? documentWithResource.resource.id : false)}
                      selected={selectedDocumentIds.includes(documentId)}
                      onToggleSelected={handleToggleSelected}
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
              </StyledGrid>
            </StyledGridScrollArea>
            {isAdminOrOwner && (
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
            )}

            <Loader show={resourcesIsFetching} size={50} />
          </StyledBackground>
        </StyledBoxWrap>
      </StyledContent>

      {editedDocumentId && (
        <DocumentModalEdit
          documentId={editedDocumentId}
          onClose={handleModalClose}
        />
      )}
      {exportedDocuments.length > 0 && (
        <DocumentModalExport documents={exportedDocuments} onClose={handleModalClose} />
      )}

      <Submit
        title={`Delete document "${documentToDelete?.title ?? ""}"`}
        text={`Do you really want to delete this document? It has ${documentToDeleteAnchorCount} anchor${
          documentToDeleteAnchorCount === 1 ? "" : "s"
        }.`}
        show={docToDelete !== false}
        onSubmit={() => docToDelete && documentDeleteMutation.mutate(docToDelete)}
        onCancel={() => setDocToDelete(false)}
      />
    </>
  );
};
