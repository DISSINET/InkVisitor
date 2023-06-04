import { IDocument, IResponseDocument } from "@shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { Button, ButtonGroup, Input } from "components";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { BsCheckLg } from "react-icons/bs";
import { FaDotCircle, FaEdit, FaTrash } from "react-icons/fa";
import {
  StyledCount,
  StyledReference,
  StyledTitle,
} from "../DocumentsPageStyles";
import { EntitySuggester } from "components/advanced";
import { EntityEnums } from "@shared/enums";
import { RiFileEditFill } from "react-icons/ri";

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

  const handleSave = () => {
    if (document.title !== localTitle) {
      updateDocumentMutation.mutate({
        id: document.id,
        doc: { title: localTitle },
      });
    } else {
      cancelEditMode();
    }
  };

  const addDocumentToResource = (id: string) => {
    // updateResourceMutation.mutate
  };

  return (
    <>
      <FaDotCircle size={10} />
      <StyledTitle>
        {editMode ? (
          <Input
            value={localTitle}
            onChangeFn={(value: string) => setLocalTitle(value)}
            changeOnType
            autoFocus
            onBlur={handleSave}
            width={150}
          />
        ) : (
          <div style={{ padding: "0.3rem 0" }} onClick={setEditMode}>
            {document.title}
          </div>
        )}
      </StyledTitle>
      <ButtonGroup>
        <Button
          icon={<RiFileEditFill />}
          color="warning"
          inverted
          onClick={() => handleDocumentClick(document.id)}
        />
        <Button
          icon={<FaTrash />}
          color="danger"
          inverted
          onClick={() => setDocToDelete(document.id)}
        />
      </ButtonGroup>
      {/* reference / suggester */}
      <StyledReference>
        <EntitySuggester
          placeholder="add resource"
          categoryTypes={[EntityEnums.Class.Resource]}
          onSelected={(id: string) => addDocumentToResource(id)}
        />
      </StyledReference>
      <StyledCount>{document.referencedEntityIds.length}</StyledCount>
    </>
  );
};
