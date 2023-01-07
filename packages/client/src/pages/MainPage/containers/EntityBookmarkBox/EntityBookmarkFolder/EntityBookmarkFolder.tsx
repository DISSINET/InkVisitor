import { EntityEnums } from "@shared/enums";
import { IBookmarkFolder, IResponseBookmarkFolder } from "@shared/types";
import api from "api";
import { Button, ButtonGroup, Tooltip } from "components";
import { EntitySuggester } from "components/advanced";
import React, { useState } from "react";
import { DragObjectWithType, DropTargetMonitor, useDrop } from "react-dnd";
import {
  FaEdit,
  FaFolder,
  FaFolderOpen,
  FaRegFolder,
  FaRegFolderOpen,
  FaTrash,
} from "react-icons/fa";
import { useMutation, useQueryClient } from "react-query";
import { DragItem, ItemTypes } from "types";
import { EntityBookmarkTable } from "../EntityBookmarkTable/EntityBookmarkTable";
import {
  StyledFolderContent,
  StyledFolderContentTags,
  StyledFolderHeader,
  StyledFolderHeaderButtons,
  StyledFolderHeaderText,
  StyledFolderSuggester,
  StyledFolderWrapper,
  StyledFolderWrapperOpenArea,
  StyledIconWrap,
} from "./EntityBookmarkFolderStyles";

const bookmarkEntities = [
  EntityEnums.Class.Action,
  EntityEnums.Class.Person,
  EntityEnums.Class.Being,
  EntityEnums.Class.Group,
  EntityEnums.Class.Object,
  EntityEnums.Class.Concept,
  EntityEnums.Class.Location,
  EntityEnums.Class.Value,
  EntityEnums.Class.Event,
  EntityEnums.Class.Statement,
  EntityEnums.Class.Territory,
  EntityEnums.Class.Resource,
];

interface EntityBookmarkFolder {
  bookmarkFolder: IResponseBookmarkFolder;
  open: boolean;
  empty: boolean;
  getBookmarksCopy: () => IBookmarkFolder[] | false;
  startEditingFolder: (folder: IResponseBookmarkFolder) => void;
  askRemoveFolder: (folderId: string) => void;
  openedFolders: string[];
  setOpenedFolders: React.Dispatch<React.SetStateAction<string[]>>;
}
export const EntityBookmarkFolder: React.FC<EntityBookmarkFolder> = ({
  bookmarkFolder,
  open,
  empty,
  getBookmarksCopy,
  startEditingFolder,
  askRemoveFolder,
  openedFolders,
  setOpenedFolders,
}) => {
  const queryClient = useQueryClient();

  const handleClickFolder = (folderId: string) => {
    if (open) {
      // close
      setOpenedFolders(openedFolders.filter((f) => f !== folderId));
    } else {
      // open
      setOpenedFolders([...openedFolders, folderId]);
    }
  };

  const changeBookmarksMutation = useMutation(
    async (newBookmarks: IBookmarkFolder[]) =>
      await api.usersUpdate("me", { bookmarks: newBookmarks }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["bookmarks"]);
      },
    }
  );

  const addBookmark = async (folderId: string, bookmarkId: string) => {
    const newBookmarks: IBookmarkFolder[] | false = getBookmarksCopy();
    if (newBookmarks) {
      const folder = newBookmarks.find((b) => b.id === folderId);

      if (folder) {
        if (!folder.entityIds.includes(bookmarkId)) {
          folder.entityIds.push(bookmarkId);
          changeBookmarksMutation.mutate(newBookmarks);
        }
      }
    }
  };

  const removeBookmark = (folderId: string, bookmarkId: string) => {
    const newBookmarks: IBookmarkFolder[] | false = getBookmarksCopy();
    if (newBookmarks) {
      const folder = newBookmarks.find((b) => b.id === folderId);
      if (folder) {
        if (folder.entityIds.includes(bookmarkId)) {
          folder.entityIds = folder.entityIds.filter((a) => a !== bookmarkId);
          changeBookmarksMutation.mutate(newBookmarks);
        }
      }
    }
  };

  const updateFolderEntitys = (newEntityIds: string[], folderId: string) => {
    const newBookmarks: IBookmarkFolder[] | false = getBookmarksCopy();
    if (newBookmarks) {
      const folder = newBookmarks.find((b) => b.id === folderId);
      if (folder) {
        folder.entityIds = newEntityIds;
        changeBookmarksMutation.mutate(newBookmarks);
      }
    }
  };

  const [isWrongDropCategory, setIsWrongDropCategory] = useState(false);

  const handleHoverred = (newHoverred: any) => {
    const hoverredCategory = newHoverred.category;
    if (!bookmarkEntities.includes(hoverredCategory)) {
      setIsWrongDropCategory(true);
    } else {
      setIsWrongDropCategory(false);
    }
  };

  const [{ isOver }, dropRef] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item: DragObjectWithType) => {
      addBookmark(bookmarkFolder.id, (item as DragItem).id);
    },
    hover: (item: DragObjectWithType) => {
      handleHoverred(item);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <StyledFolderWrapper
      key={bookmarkFolder.id}
      ref={dropRef}
      style={{ opacity: isOver ? 0.7 : 1 }}
    >
      <StyledFolderHeader
        onClick={() => {
          handleClickFolder(bookmarkFolder.id);
        }}
        ref={setReferenceElement}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <StyledFolderWrapperOpenArea>
          <StyledIconWrap>
            {(() => {
              if (open) {
                if (empty) {
                  return <FaRegFolderOpen />;
                } else {
                  return <FaFolderOpen />;
                }
              } else {
                if (empty) {
                  return <FaRegFolder />;
                } else {
                  return <FaFolder />;
                }
              }
            })()}
          </StyledIconWrap>
          <StyledFolderHeaderText>{bookmarkFolder.name}</StyledFolderHeaderText>
        </StyledFolderWrapperOpenArea>

        <StyledFolderHeaderButtons>
          <ButtonGroup>
            <Button
              key="edit"
              icon={<FaEdit size={12} />}
              color="plain"
              inverted
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                startEditingFolder(bookmarkFolder);
              }}
            />
            <Button
              key="remove"
              icon={<FaTrash size={12} />}
              color="danger"
              inverted
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                askRemoveFolder(bookmarkFolder.id);
              }}
            />
          </ButtonGroup>
        </StyledFolderHeaderButtons>
      </StyledFolderHeader>
      <Tooltip
        visible={showTooltip}
        referenceElement={referenceElement}
        label={bookmarkFolder.name}
        position="left"
      />

      {open && (
        <StyledFolderContent>
          <StyledFolderContentTags>
            <EntityBookmarkTable
              folder={bookmarkFolder}
              updateFolderEntitys={updateFolderEntitys}
              removeBookmark={removeBookmark}
            />
          </StyledFolderContentTags>
          <StyledFolderSuggester>
            <EntitySuggester
              disableTemplateInstantiation
              openDetailOnCreate
              onSelected={(bookmarkId: string) => {
                addBookmark(bookmarkFolder.id, bookmarkId);
              }}
              categoryTypes={bookmarkEntities}
              placeholder={"add new bookmark"}
            />
          </StyledFolderSuggester>
        </StyledFolderContent>
      )}
    </StyledFolderWrapper>
  );
};
