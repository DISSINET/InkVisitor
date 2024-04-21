import { EntityEnums } from "@shared/enums";
import { IDocument, IResponseDocument, IResponseEntity } from "@shared/types";
import {
  UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import api from "api";
import { AxiosResponse } from "axios";
import { Button, ButtonGroup, Input } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FaTrash } from "react-icons/fa";
import { RiFileEditFill } from "react-icons/ri";
import useResizeObserver from "use-resize-observer";
import {
  StyledCount,
  StyledCountTag,
  StyledFaDotCircle,
  StyledReference,
  StyledTitle,
  StyledTitleWrap,
} from "../DocumentsPageStyles";
import theme from "Theme/theme";
import { EntityColors } from "types";

interface DocumentRow {
  document: IResponseDocument;
  resource: IResponseEntity | false;
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
  resource,
  handleDocumentClick,
  setDocToDelete,
  updateDocumentMutation,
  editMode,
  setEditMode,
  cancelEditMode,
}) => {
  const [localTitle, setLocalTitle] = useState<string>("");

  const countTotal = useMemo(() => {
    let total = 0;
    Object.keys(document.referencedEntityIds).forEach((key) => {
      const classEntities =
        document.referencedEntityIds[
          key as keyof typeof document.referencedEntityIds
        ];

      const classNo =
        classEntities && Array.isArray(classEntities)
          ? classEntities.length
          : 0;
      total += classNo;
    });
    return total;
  }, [document.referencedEntityIds]);

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

  const { ref: titleRef, width: titleWidth = 0 } =
    useResizeObserver<HTMLDivElement>();

  return (
    <>
      <StyledFaDotCircle size={10} />
      <StyledTitleWrap ref={titleRef} onClick={setEditMode}>
        {editMode ? (
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
        {resource ? (
          <EntityTag
            entity={resource}
            unlinkButton={{
              onClick: () => removeResourceMutation.mutate(resource.id),
            }}
            fullWidth
          />
        ) : (
          <EntitySuggester
            placeholder="add resource"
            categoryTypes={[EntityEnums.Class.Resource]}
            onSelected={(id: string) => updateResourceMutation.mutate(id)}
          />
        )}
      </StyledReference>
      <StyledCount>
        {countTotal} anchors
        {Object.values(EntityEnums.Class)
          .filter((eClass) => {
            return document.referencedEntityIds[eClass]?.length;
          })
          .map((eClass) => {
            const classColorName =
              EntityColors[eClass as keyof typeof EntityColors]?.color ?? "";

            const classColor =
              (theme.color[
                classColorName as keyof typeof theme.color
              ] as string) ?? theme.color.primary;

            return (
              <StyledCountTag
                key={eClass}
                style={{ backgroundColor: classColor }}
              >
                {eClass} {document.referencedEntityIds[eClass]?.length || 0}
              </StyledCountTag>
            );
          })}
      </StyledCount>
    </>
  );
};
