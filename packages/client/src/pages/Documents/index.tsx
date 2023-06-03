import { IDocument, IResponseDocument } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "api";
import React, { ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";

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
    async (doc: IDocument) => api.documentUpload(doc),
    {
      onSuccess: (variables, data) => {
        console.log(variables);
      },
    }
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        console.log(text);
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

  return (
    <div>
      <h3>Documents</h3>
      {documents &&
        documents.map((doc: IResponseDocument, key: number) => {
          return <div key={key}>{doc.title}</div>;
        })}
      <input type="file" accept=".txt" onChange={handleFileChange} />
    </div>
  );
};
