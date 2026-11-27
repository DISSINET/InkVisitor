import { IBookmarkFolder, IResponseBookmarkFolder } from "@inkvisitor/shared/types";
import api from "api";
import { Button, Loader, Submit } from "components";
import { BookmarkFolderModal } from "components/advanced/BookmarkFolderModal/BookmarkFolderModal";
import { CBookmarkFolder } from "constructors";
import { useBookmarksQuery } from "hooks/react-query";
import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAppSelector } from "redux/hooks";
import { StyledContent, StyledFolderList, StyledHeader } from "./EntityBookmarkBoxStyles";
import { EntityBookmarkFolder } from "./EntityBookmarkFolder/EntityBookmarkFolder";
import { IcoPlusBold } from "Theme/icons";
import { ButtonSize } from "types";
import { toStoredBookmarkFolders } from "utils/bookmarkFolders";

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

  const getBookmarksCopy = (): IBookmarkFolder[] | false =>
    bookmarkFolders ? toStoredBookmarkFolders(bookmarkFolders) : false;

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
      toast.info("Bookmark folder removed");
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

      <BookmarkFolderModal
        key="bookmark-folder-modal"
        showModal={isFolderModalOpen}
        title={isEditMode ? "Edit Bookmark folder" : "New Bookmark folder"}
        submitLabel={isEditMode ? "Submit" : "Create"}
        name={editingFolderName}
        onNameChange={setEditingFolderName}
        isValid={Boolean(editedFolderIsValid)}
        onSubmit={submitFolderModal}
        onClose={closeFolderModal}
        isLoading={createFolderMutation.isPending || acceptEditingFolderMutation.isPending}
      />

      <Submit
        title={`Remove Bookmark folder ${removingFolderName}`}
        text={`Do you really want to remove Bookmark folder ${removingFolderName}?`}
        show={removingFolder != false}
        onSubmit={() => acceptRemoveFolderMutation.mutate()}
        onCancel={() => cancelRemoveFolder()}
        loading={acceptRemoveFolderMutation.isPending}
      />
    </StyledContent>
  );
};

export const MemoizedEntityBookmarkBox = React.memo(EntityBookmarkBox);
