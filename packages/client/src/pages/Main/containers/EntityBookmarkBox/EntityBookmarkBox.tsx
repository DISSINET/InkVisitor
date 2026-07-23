import { IBookmarkFolder, IEntity, IResponseBookmarkFolder } from "@inkvisitor/shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  Input,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Submit,
} from "components";
import { CBookmarkFolder } from "constructors";
import { useBookmarksQuery } from "hooks/react-query";
import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAppSelector } from "redux/hooks";
import { StyledContent, StyledFolderList, StyledHeader } from "./EntityBookmarkBoxStyles";
import { EntityBookmarkFolder } from "./EntityBookmarkFolder/EntityBookmarkFolder";
import { MdEdit } from "react-icons/md";
import { IcoPlusBold, IcoTrash } from "Theme/icons";
import { ButtonSize } from "types";

export const EntityBookmarkBox: React.FC = () => {
  const queryClient = useQueryClient();

  const isBookmarksBoxOpen = useAppSelector(
    (state) => state.layout.mainPage.fourthPanelBoxesOpened.bookmarks,
  );

  const fourthPanelExpanded = useAppSelector((state) => state.layout.mainPage.fourthPanelExpanded);
  const [editingFolder, setEditingFolder] = useState<string | false>(false);
  const [removingFolder, setRemovingFolder] = useState<string | false>(false);
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);
  const [editingFolderName, setEditingFolderName] = useState<string>("");
  const [openedFolders, setOpenedFolders] = useState<string[]>([]);

  // User query
  const { data: bookmarkFolders, isFetching } = useBookmarksQuery(
    isBookmarksBoxOpen && fourthPanelExpanded,
  );

  const removingFolderName = useMemo(() => {
    if (bookmarkFolders) {
      const folder = bookmarkFolders.find((b) => b.id === removingFolder);
      if (folder) {
        return folder.name;
      }
    }

    return "";
  }, [removingFolder]);

  const getBookmarksCopy = (): IBookmarkFolder[] | false => {
    if (bookmarkFolders) {
      return bookmarkFolders.map((bookmark: IResponseBookmarkFolder) => {
        return {
          id: bookmark.id,
          name: bookmark.name,
          entityIds: bookmark.entities.map((a: IEntity) => a.id),
        };
      });
    } else {
      return false;
    }
  };

  const editedFolderIsValid = useMemo(() => {
    return (
      editingFolderName !== "" &&
      bookmarkFolders &&
      !bookmarkFolders.map((b) => b.name).includes(editingFolderName)
    );
  }, [editingFolderName]);
  const isEditMode = Boolean(editingFolder);
  const isFolderModalOpen = isEditMode || creatingFolder;
  const closeFolderModal = () => {
    if (isEditMode) {
      cancelEditingFolder();
      return;
    }
    cancelCreatingFolder();
  };
  const submitFolderModal = () => {
    if (isEditMode) {
      acceptEditingFolderMutation.mutate();
      return;
    }
    createFolderMutation.mutate();
  };

  // methods
  const clickNewBookmarFolderkHandle = () => {
    setCreatingFolder(true);
  };

  const cancelEditingFolder = () => {
    setEditingFolderName("");
    setEditingFolder(false);
  };

  const startEditingFolder = (folder: IResponseBookmarkFolder) => {
    setEditingFolder(folder.id);
    setEditingFolderName(folder.name);
  };

  const askRemoveFolder = (folderId: string) => {
    setRemovingFolder(folderId);
  };

  const acceptEditingFolderMutation = useMutation({
    mutationFn: async () => {
      const newBookmarks: IBookmarkFolder[] | false = getBookmarksCopy();
      if (newBookmarks) {
        const newBookmarksAfterEdit = newBookmarks.map((b) => {
          if (b.id === editingFolder) {
            return { ...b, ...{ name: editingFolderName } };
          } else {
            return b;
          }
        });
        await api.usersUpdate("me", {
          bookmarks: newBookmarksAfterEdit,
        });
      }
    },

    onSuccess: () => {
      toast.info("Bookmark folder edited");
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      setEditingFolderName("");
      setEditingFolder(false);
    },
  });

  const acceptRemoveFolderMutation = useMutation({
    mutationFn: async () => {
      const newBookmarks: IBookmarkFolder[] | false = getBookmarksCopy();
      if (newBookmarks) {
        const newBookmarksAfterRemove = newBookmarks.filter((b) => b.id !== removingFolder);
        await api.usersUpdate("me", {
          bookmarks: newBookmarksAfterRemove,
        });
      }

      setRemovingFolder(false);
    },
    onSuccess: () => {
      toast.warning("Bookmark folder removed");
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
  const cancelRemoveFolder = () => {
    setRemovingFolder(false);
  };

  const cancelCreatingFolder = () => {
    setEditingFolderName("");
    setCreatingFolder(false);
  };

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      if (bookmarkFolders) {
        const newBookmarkFolder: IBookmarkFolder = CBookmarkFolder(editingFolderName);

        const newBookmarks: IBookmarkFolder[] | false = getBookmarksCopy();
        if (newBookmarks) {
          newBookmarks.push(newBookmarkFolder);
          await api.usersUpdate("me", { bookmarks: newBookmarks });
        }
      }
    },
    onSuccess: () => {
      toast.success("Bookmark folder created");
      setEditingFolderName("");
      setCreatingFolder(false);
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  return (
    <StyledContent>
      <StyledHeader>
        <Button
          key="add"
          icon={<IcoPlusBold />}
          color="primary"
          inverted
          label="bookmark folder"
          onClick={() => clickNewBookmarFolderkHandle()}
          size={ButtonSize.Medium}
        />
      </StyledHeader>
      {bookmarkFolders && (
        <StyledFolderList>
          {bookmarkFolders.map((bookmarkFolder: IResponseBookmarkFolder, key: number) => {
            const open = openedFolders.includes(bookmarkFolder.id);
            const empty = bookmarkFolder.entities.length === 0;

            return (
              <EntityBookmarkFolder
                key={key}
                bookmarkFolder={bookmarkFolder}
                open={open}
                empty={empty}
                getBookmarksCopy={getBookmarksCopy}
                startEditingFolder={startEditingFolder}
                askRemoveFolder={askRemoveFolder}
                openedFolders={openedFolders}
                setOpenedFolders={setOpenedFolders}
              />
            );
          })}
        </StyledFolderList>
      )}
      <Loader show={isFetching} />

      <Modal
        key="bookmark-folder-modal"
        showModal={isFolderModalOpen}
        onClose={closeFolderModal}
        onEnterPress={submitFolderModal}
        width={350}
      >
        <ModalHeader icon={<MdEdit />} title="Edit Bookmark folder" />
        <ModalContent>
          <Input
            label="new label:"
            labelSpaceNoWrap
            placeholder=""
            onChangeFn={(newName: string) => setEditingFolderName(newName)}
            value={editingFolderName}
            changeOnType
            autoFocus
            width="full"
          />
        </ModalContent>

        <ModalFooter>
          <ButtonGroup>
            <Button key="cancel" label="Cancel" color="warning" onClick={closeFolderModal} />

            <Button
              key="submit"
              label={isEditMode ? "Submit" : "Create"}
              color="primary"
              onClick={submitFolderModal}
              disabled={!editedFolderIsValid}
            />
          </ButtonGroup>
        </ModalFooter>
        <Loader show={createFolderMutation.isPending || acceptEditingFolderMutation.isPending} />
      </Modal>

      <Submit
        headerIcon={<IcoTrash size={14} />}
        title={`Delete Bookmark folder ${removingFolderName}`}
        text={`Do you really want do delete Bookmark folder ${removingFolderName}?`}
        show={removingFolder != false}
        onSubmit={() => acceptRemoveFolderMutation.mutate()}
        onCancel={() => cancelRemoveFolder()}
        loading={acceptRemoveFolderMutation.isPending}
      />
    </StyledContent>
  );
};

export const MemoizedEntityBookmarkBox = React.memo(EntityBookmarkBox);
