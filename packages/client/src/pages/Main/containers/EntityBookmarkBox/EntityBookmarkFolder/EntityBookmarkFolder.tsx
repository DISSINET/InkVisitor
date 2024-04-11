import { classesAll } from "@shared/dictionaries/entity";
import { UserEnums } from "@shared/enums";
import { IBookmarkFolder, IResponseBookmarkFolder } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Tooltip } from "components";
import { EntitySuggester } from "components/advanced";
import React, { useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import {
  FaEdit,
  FaFolder,
  FaFolderOpen,
  FaRegFolder,
  FaRegFolderOpen,
  FaTrash,
} from "react-icons/fa";
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

  const changeBookmarksMutation = useMutation({
    mutationFn: async (newBookmarks: IBookmarkFolder[]) =>
      await api.usersUpdate("me", { bookmarks: newBookmarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

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

  const [{ isOver }, dropRef] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item: DragItem) => {
      addBookmark(bookmarkFolder.id, item.id);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const userrole = localStorage.getItem("userrole") as UserEnums.Role;

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
              color="warning"
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
              disableCreate={userrole === UserEnums.Role.Viewer}
              openDetailOnCreate
              onSelected={(bookmarkId: string) => {
                addBookmark(bookmarkFolder.id, bookmarkId);
              }}
              categoryTypes={classesAll}
              placeholder={"add new bookmark"}
              excludedActantIds={bookmarkFolder.entities.map((e) => e.id)}
            />
          </StyledFolderSuggester>
        </StyledFolderContent>
      )}
    </StyledFolderWrapper>
  );
};
