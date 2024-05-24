import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

import { IDocument, IResponseDocument, IResponseEntity } from "@shared/types";
import api from "api";
import { Loader, Submit } from "components";
import React, { ChangeEvent, useMemo, useRef, useState } from "react";
import { DocumentModalEdit, DocumentModalExport } from "components/advanced";
import { DocumentRow } from "./DocumentRow/DocumentRow";
import {
  StyledBackground,
  StyledBoxWrap,
  StyledContent,
  StyledGrid,
  StyledHeading,
  StyledInputWrap,
} from "./DocumentsPageStyles";

type DocumentWithResource = {
  document: IResponseDocument;
  resource: false | IResponseEntity;
};

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
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });

  console.log(documents);

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
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });

  const documentsWithResources: DocumentWithResource[] = useMemo(() => {
    return documents
      ? documents.map((document) => {
          const resource =
            resources &&
            resources.find(
              (resource) => resource.data.documentId === document.id
            );
          return { document, resource: resource ?? false };
        })
      : [];
  }, [resources, documents]);

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
      setEditMode(false);
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
    };
    uploadDocumentMutation.mutate(document);
    if (inputRef.current) inputRef.current.value = "";
  };

  const [exportedDocumentId, setExportedDocumentId] = useState<string | false>(
    false
  );
  const exportedDocument = documents?.find(
    (doc) => doc.id === exportedDocumentId
  );

  const [editedDocumentId, setEditedDocumentId] = useState<string | false>(
    false
  );
  const editedDocument = documents?.find((doc) => doc.id === editedDocumentId);

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
  const [editMode, setEditMode] = useState<false | number>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <StyledContent>
        <StyledBoxWrap>
          <StyledBackground>
            <StyledHeading>Documents</StyledHeading>
            <StyledGrid>
              {documentsWithResources.map(
                (documentWithResource: DocumentWithResource, key: number) => {
                  return (
                    <DocumentRow
                      key={key}
                      document={documentWithResource.document}
                      resource={documentWithResource.resource}
                      handleDocumentEdit={handleDocumentEdit}
                      handleDocumentExport={handleDocumentExport}
                      setDocToDelete={setDocToDelete}
                      updateDocumentMutation={updateDocumentMutation}
                      editMode={editMode === key}
                      setEditMode={() => setEditMode(key)}
                      cancelEditMode={() => setEditMode(false)}
                    />
                  );
                }
              )}
            </StyledGrid>
            <StyledInputWrap onClick={() => inputRef.current?.click()}>
              Upload document
              <input
                ref={inputRef}
                type="file"
                accept=".txt"
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
        <DocumentModalEdit
          document={editedDocument}
          onClose={handleModalClose}
        />
      )}
      {exportedDocumentId && (
        <DocumentModalExport
          document={exportedDocument}
          onClose={handleModalClose}
        />
      )}

      <Submit
        title="Delete document"
        text="Do you really want to delete this document?"
        show={docToDelete !== false}
        onSubmit={() =>
          docToDelete && documentDeleteMutation.mutate(docToDelete)
        }
        onCancel={() => setDocToDelete(false)}
      />
    </>
  );
};
