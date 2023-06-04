import { IDocument, IResponseDocument } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import React, { ChangeEvent, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  StyledBoxWrap,
  StyledContent,
  StyledItem,
} from "./DocumentsPageStyles";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  Submit,
} from "components";
import { FaEdit, FaTrash } from "react-icons/fa";
import { DocumentRow } from "./DocumentRow/DocumentRow";

export const DocumentsPage: React.FC = ({}) => {
  const queryClient = useQueryClient();

  const {
    data: documents,
    error,
    isFetching,
  } = useQuery(
    ["documents"],
    async () => {
      const res = await api.documentsGet();
      return res.data;
    },
    {
      enabled: api.isLoggedIn(),
    }
  );

  const {
    data: resources,
    error: resourcesError,
    isFetching: resourcesIsFetching,
  } = useQuery(
    ["resourcesWithDocuments"],
    async () => {
      const res = await api.entitiesSearch({
        resourceHasDocument: true,
      });
      return res.data;
    },
    {
      enabled: api.isLoggedIn(),
    }
  );

  const uploadDocumentMutation = useMutation(
    async (doc: Partial<IDocument>) => api.documentUpload(doc),
    {
      onSuccess: (variables, data) => {
        queryClient.invalidateQueries(["documents"]);
      },
    }
  );

  const updateDocumentMutation = useMutation(
    async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    {
      onSuccess: (variables, data) => {
        setEditMode(false);
        queryClient.invalidateQueries(["documents"]);
      },
    }
  );

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
  };

  const [openedDocument, setOpenedDocument] = useState<string | false>(false);

  const {
    data: document,
    error: documentError,
    isFetching: documentIsFetching,
  } = useQuery(
    ["openedDocument"],
    async () => {
      if (openedDocument) {
        const res = await api.documentGet(openedDocument);
        return res.data;
      }
    },
    {
      enabled: api.isLoggedIn() && !!openedDocument,
    }
  );

  const handleDocumentClick = (id: string) => {
    setOpenedDocument(id);
  };

  const handleModalClose = () => {
    setOpenedDocument(false);
  };

  const documentDeleteMutation = useMutation(
    async (id: string) => await api.documentDelete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["documents"]);
        setDocToDelete(false);
      },
    }
  );

  const [docToDelete, setDocToDelete] = useState<string | false>(false);
  const [editMode, setEditMode] = useState<false | number>(false);

  return (
    <>
      <StyledContent>
        <StyledBoxWrap>
          <h3>Documents</h3>
          {documents &&
            documents.map((doc: IResponseDocument, key: number) => {
              return (
                <DocumentRow
                  key={key}
                  document={doc}
                  handleDocumentClick={handleDocumentClick}
                  setDocToDelete={setDocToDelete}
                  updateDocumentMutation={updateDocumentMutation}
                  editMode={editMode === key}
                  setEditMode={() => setEditMode(key)}
                  cancelEditMode={() => setEditMode(false)}
                />
              );
            })}
          <input type="file" accept=".txt" onChange={handleFileChange} />
        </StyledBoxWrap>
      </StyledContent>

      {/* MODAL */}
      <Modal showModal={openedDocument !== false} onClose={handleModalClose}>
        <ModalContent column>
          <div>{document?.content}</div>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              color="greyer"
              inverted
              onClick={handleModalClose}
            />
            <Button
              key="submit"
              label="Save"
              color="info"
              onClick={() => console.log("handle save")}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>

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
