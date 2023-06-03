import { IDocument } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "api";
import React, { ChangeEvent } from "react";

export const DocumentsPage: React.FC = ({}) => {
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

  const uploadDocumentMutation = useMutation(
    async (doc: IDocument) => api.uploadDocument(doc),
    {
      onSuccess: (variables, data) => {
        console.log(variables);
      },
    }
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = (file: File) => {
    if (!file) {
      return;
    } else {
      console.log(file);
    }
  };

  return (
    <div>
      <h3>Documents</h3>
      {documents &&
        documents.map((doc: IDocument) => {
          return <>{doc.title}</>;
        })}
      <input type="file" accept=".txt" onChange={handleFileChange} />
    </div>
  );
};
