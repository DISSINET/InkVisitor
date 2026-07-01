import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { UserEnums } from "@inkvisitor/shared/enums";
import { IBookmarkFolder, IResponseBookmarkFolder } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Tooltip } from "components";
import { EntitySuggester } from "components/advanced";
import React, { useRef, useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { FaFolder, FaFolderOpen, FaRegFolder, FaRegFolderOpen } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { MdEdit } from "react-icons/md";
import { DragItem, ItemTypes } from "types";
import { EntityBookmarkTable } from "../EntityBookmarkTable/EntityBookmarkTable";
import {
  StyledEditButtonWrap,
  StyledFolderContent,
  StyledFolderContentTags,
  StyledFolderHeader,
  StyledFolderHeaderButtons,
  StyledFolderHeaderText,
  StyledFolderSuggester,
  StyledFolderWrapper,
  StyledFolderWrapperOpenArea,
  StyledIconWrap,
  StyledRemoveButtonWrap,
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

  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item: DragItem) => {
      addBookmark(bookmarkFolder.id, item.id);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  drop(dropRef);

  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const userRole = localStorage.getItem("userrole") as UserEnums.Role;

  const FolderIcon = empty
    ? open
      ? FaRegFolderOpen
      : FaRegFolder
    : open
      ? FaFolderOpen
      : FaFolder;

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
          <StyledIconWrap $isOpen={open}>
            <FolderIcon size={15} />
          </StyledIconWrap>
          <StyledFolderHeaderText $open={open}>{bookmarkFolder.name}</StyledFolderHeaderText>
        </StyledFolderWrapperOpenArea>

        <StyledFolderHeaderButtons>
          <ButtonGroup $smallGap>
            <StyledEditButtonWrap>
              <Button
                key="edit"
                icon={<MdEdit size={18} />}
                inverted
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  startEditingFolder(bookmarkFolder);
                }}
                noBackground
                noBorder
              />
            </StyledEditButtonWrap>
            <StyledRemoveButtonWrap>
              <Button
                key="remove"
                icon={<FaTrashCan size={14} />}
                inverted
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  askRemoveFolder(bookmarkFolder.id);
                }}
                noBackground
                noBorder
              />
            </StyledRemoveButtonWrap>
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
              disableCreate={userRole === UserEnums.Role.Viewer}
              openDetailOnCreate
              onSelected={(bookmarkId: string) => {
                addBookmark(bookmarkFolder.id, bookmarkId);
              }}
              categoryTypes={classesAll}
              placeholder="add bookmark"
              inputWidth="full"
              excludedActantIds={bookmarkFolder.entities.map((e) => e.id)}
            />
          </StyledFolderSuggester>
        </StyledFolderContent>
      )}
    </StyledFolderWrapper>
  );
};
