import { IDocument, IResponseDocument } from "@shared/types";
import { ButtonGroup, Button, Input } from "components";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { StyledItem } from "../DocumentsPageStyles";
import { BsCheckLg } from "react-icons/bs";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

interface DocumentRow {
  document: IResponseDocument;
  handleDocumentClick: (id: string) => void;
  setDocToDelete: Dispatch<SetStateAction<string | false>>;
  updateDocumentMutation: UseMutationResult<
    AxiosResponse<IDocument, any>,
    unknown,
    {
      id: string;
      doc: Partial<IDocument>;
    },
    unknown
  >;
  editMode: boolean;
  setEditMode: () => void;
  cancelEditMode: () => void;
}
export const DocumentRow: React.FC<DocumentRow> = ({
  document,
  handleDocumentClick,
  setDocToDelete,
  updateDocumentMutation,
  editMode,
  setEditMode,
  cancelEditMode,
}) => {
  const [localTitle, setLocalTitle] = useState<string>("");
  useEffect(() => {
    if (document) {
      setLocalTitle(document.title);
    }
  }, [document]);

  useEffect(() => {
    if (!editMode && document.title !== localTitle) {
      setLocalTitle(document.title);
    }
  }, [editMode]);

  return (
    <StyledItem>
      {editMode ? (
        <Input
          value={localTitle}
          onChangeFn={(value: string) => setLocalTitle(value)}
        />
      ) : (
        <div onClick={() => handleDocumentClick(document.id)}>
          {document.title}
        </div>
      )}
      <ButtonGroup>
        {!editMode ? (
          <Button
            icon={<FaEdit />}
            color="warning"
            inverted
            onClick={setEditMode}
          />
        ) : (
          <Button
            icon={<BsCheckLg />}
            color="success"
            inverted
            onClick={() => {
              if (document.title !== localTitle) {
                updateDocumentMutation.mutate({
                  id: document.id,
                  doc: { title: localTitle },
                });
              } else {
                cancelEditMode();
              }
            }}
          />
        )}
        <Button
          icon={<FaTrash />}
          color="danger"
          inverted
          onClick={() => setDocToDelete(document.id)}
        />
      </ButtonGroup>
    </StyledItem>
  );
};
