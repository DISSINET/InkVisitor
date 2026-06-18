import { EntityEnums } from "@inkvisitor/shared/enums";
import { IDocument, IResponseEntity } from "@inkvisitor/shared/types";
import { UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { AxiosResponse } from "axios";
import { Button, ButtonGroup, Input } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import { useResizeObserver, useTheme } from "hooks";
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { FaDownload, FaTrash } from "react-icons/fa";
import { RiFileEditFill } from "react-icons/ri";
import { EntityColors } from "types";
import {
  StyledActionsCell,
  StyledCount,
  StyledCountTag,
  StyledDocumentRow,
  StyledReference,
  StyledTitle,
  StyledTitleWrap,
} from "../DocumentsPageStyles";

interface DocumentRow {
  document: IDocument;
  resource: IResponseEntity | false;
  // Owner/Admin always; Editor only when this document's Resource is assigned.
  // When false the row is view-only (no export/edit/delete/resource changes).
  canManage: boolean;
  handleDocumentEdit: (id: string) => void;
  handleDocumentExport: (id: string) => void;
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
  resource,
  canManage,
  handleDocumentEdit,
  handleDocumentExport,
  setDocToDelete,
  updateDocumentMutation,
  editMode,
  setEditMode,
  cancelEditMode,
}) => {
  const theme = useTheme();
  const [localTitle, setLocalTitle] = useState<string>("");

  const countTotal = useMemo(() => {
    let total = 0;
    Object.keys(document.entityIds).forEach((key) => {
      const classEntities = document.entityIds[key as keyof typeof document.entityIds];

      const classNo = classEntities && Array.isArray(classEntities) ? classEntities.length : 0;
      total += classNo;
    });
    return total;
  }, [document.entityIds]);

  useEffect(() => {
    if (document) {
      setLocalTitle(document.title);
    }
  }, [document]);

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

  const queryClient = useQueryClient();

  const updateResourceMutation = useMutation({
    mutationFn: async (resourceId: string) =>
      api.entityUpdate(resourceId, { data: { documentId: document.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resourcesWithDocuments"] });
    },
  });

  const removeResourceMutation = useMutation({
    mutationFn: async (resourceId: string) =>
      api.entityUpdate(resourceId, { data: { documentId: "" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resourcesWithDocuments"] });
    },
  });

  const { ref: titleRef, width: titleWidth = 0 } = useResizeObserver<HTMLDivElement>();

  return (
    <StyledDocumentRow>
      <StyledTitleWrap ref={titleRef} onClick={canManage ? setEditMode : undefined}>
        {canManage && editMode ? (
          <Input
            value={localTitle}
            onChangeFn={(value: string) => setLocalTitle(value)}
            changeOnType
            autoFocus
            onBlur={handleSave}
            width={titleWidth}
          />
        ) : (
          <StyledTitle>{localTitle}</StyledTitle>
        )}
      </StyledTitleWrap>
      <StyledActionsCell>
        <ButtonGroup>
          <Button
            icon={<FaDownload />}
            color="primary"
            inverted
            disabled={!canManage}
            tooltipLabel={canManage ? "export document" : "you are not assigned to this resource"}
            onClick={() => handleDocumentExport(document.id)}
          />
          {/* TODO: allow all users to open document on BE */}
          <Button
            icon={<RiFileEditFill />}
            color="warning"
            inverted
            onClick={() => handleDocumentEdit(document.id)}
            tooltipLabel={"open document"}
          />
          <Button
            icon={<FaTrash />}
            color="danger"
            inverted
            disabled={!canManage}
            onClick={() => setDocToDelete(document.id)}
            tooltipLabel={canManage ? "remove document" : "you are not assigned to this resource"}
          />
        </ButtonGroup>
      </StyledActionsCell>
      {/* reference / suggester */}
      <StyledReference>
        {resource ? (
          <EntityTag
            entity={resource}
            unlinkButton={
              canManage
                ? {
                    onClick: () => removeResourceMutation.mutate(resource.id),
                  }
                : undefined
            }
            fullWidth
            disableDoubleClick
          />
        ) : canManage ? (
          <EntitySuggester
            inputWidth={93}
            placeholder="add resource"
            categoryTypes={[EntityEnums.Class.Resource]}
            onSelected={(id: string) => updateResourceMutation.mutate(id)}
          />
        ) : null}
      </StyledReference>
      <StyledCount>
        {countTotal} anchors
        {Object.values(EntityEnums.Class)
          .filter((eClass) => {
            return document.entityIds[eClass]?.length;
          })
          .map((eClass) => {
            const entityClass = EntityColors[eClass as keyof typeof EntityColors];

            const classColorName = entityClass?.color;

            const classColor =
              (theme.color[classColorName as keyof typeof theme.color] as string) ??
              theme.color.primary;

            const count = document.entityIds[eClass]?.length || 0;

            return (
              <React.Fragment key={eClass}>
                <StyledCountTag
                  style={{ backgroundColor: classColor }}
                  title={`${count} ${entityClass.label}s anchors`}
                >
                  {eClass} {count}
                </StyledCountTag>
              </React.Fragment>
            );
          })}
      </StyledCount>
    </StyledDocumentRow>
  );
};
