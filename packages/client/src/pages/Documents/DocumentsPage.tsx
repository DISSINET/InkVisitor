import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IDocument } from "@inkvisitor/shared/types";
import api from "api";
import { Loader, Submit } from "components";
import { DocumentModalEdit, DocumentModalExport } from "components/advanced";
import { useUserQuery } from "hooks/react-query";
import React, { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
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

  const editedDocumentCanEdit = useMemo(() => {
    if (!editedDocumentId) {
      return false;
    }
    const editedResource = documentsWithResources.find(
      (d) => d.document.id === editedDocumentId
    )?.resource;
    return canManageDocument(editedResource ? editedResource.id : false);
  }, [editedDocumentId, documentsWithResources, canManageDocument]);

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

  return (
    <>
      <StyledContent>
        <StyledBoxWrap>
          <StyledBackground>
            <StyledHeading>Documents</StyledHeading>
            <StyledGridScrollArea>
              <StyledGrid>
                <DocumentsTableHeader sort={sort} onSort={handleSort} />
                {sortedDocumentsWithResources.map((documentWithResource: DocumentWithResource) => {
                  const documentId = documentWithResource.document.id;
                  return (
                    <DocumentRow
                      key={documentId}
                      document={documentWithResource.document}
                      resource={documentWithResource.resource}
                      canManage={canManageDocument(documentWithResource.resource ? documentWithResource.resource.id : false)}
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
          canEdit={editedDocumentCanEdit}
          onClose={handleModalClose}
        />
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
