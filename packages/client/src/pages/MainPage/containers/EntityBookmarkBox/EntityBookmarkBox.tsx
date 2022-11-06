import {
  IBookmarkFolder,
  IEntity,
  IResponseBookmarkFolder,
} from "@shared/types";
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
import React, { useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { useAppSelector } from "redux/hooks";
import {
  StyledContent,
  StyledFolderList,
  StyledHeader,
} from "./EntityBookmarkBoxStyles";
import { EntityBookmarkFolder } from "./EntityBookmarkFolder/EntityBookmarkFolder";

export const EntityBookmarkBox: React.FC = () => {
  const queryClient = useQueryClient();

  const fourthPanelBoxesOpened: { [key: string]: boolean } = useAppSelector(
    (state) => state.layout.fourthPanelBoxesOpened
  );

  const [editingFolder, setEditingFolder] = useState<string | false>(false);
  const [removingFolder, setRemovingFolder] = useState<string | false>(false);
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);
  const [editingFolderName, setEditingFolderName] = useState<string>("");
  const [openedFolders, setOpenedFolders] = useState<string[]>([]);

  // User query
  const {
    status: statusStatement,
    data: bookmarkFolders,
    error: errorStatement,
    isFetching: isFetching,
  } = useQuery(
    ["bookmarks"],
    async () => {
      const res = await api.bookmarksGet("me");
      res.data.sort((a, b) => (a.name > b.name ? 1 : -1));
      return res.data;
    },
    { enabled: api.isLoggedIn() && fourthPanelBoxesOpened["bookmarks"] }
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

  const acceptEditingFolderMutation = useMutation(
    async () => {
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
    {
      onSuccess: () => {
        toast.info("Bookmark edited");
        queryClient.invalidateQueries(["bookmarks"]);
        setEditingFolderName("");
        setEditingFolder(false);
      },
    }
  );

  const acceptRemoveFolderMutation = useMutation(
    async () => {
      const newBookmarks: IBookmarkFolder[] | false = getBookmarksCopy();
      if (newBookmarks) {
        const newBookmarksAfterRemove = newBookmarks.filter(
          (b) => b.id !== removingFolder
        );
        await api.usersUpdate("me", {
          bookmarks: newBookmarksAfterRemove,
        });
      }

      setRemovingFolder(false);
    },
    {
      onSuccess: () => {
        toast.warning("Bookmark folder removed");
        queryClient.invalidateQueries(["bookmarks"]);
      },
    }
  );
  const cancelRemoveFolder = () => {
    setRemovingFolder(false);
  };

  const cancelCreatingFolder = () => {
    setEditingFolderName("");
    setCreatingFolder(false);
  };

  const createFolderMutation = useMutation(
    async () => {
      if (bookmarkFolders) {
        const newBookmarkFolder: IBookmarkFolder =
          CBookmarkFolder(editingFolderName);

        const newBookmarks: IBookmarkFolder[] | false = getBookmarksCopy();
        if (newBookmarks) {
          newBookmarks.push(newBookmarkFolder);
          await api.usersUpdate("me", { bookmarks: newBookmarks });
        }
      }
    },
    {
      onSuccess: () => {
        toast.success("Bookmark folder created");
        setEditingFolderName("");
        setCreatingFolder(false);
        queryClient.invalidateQueries(["bookmarks"]);
      },
    }
  );

  return (
    <StyledContent>
      <StyledHeader>
        <Button
          key="add"
          icon={<FaPlus size={14} />}
          color="primary"
          label="bookmark folder"
          onClick={() => clickNewBookmarFolderkHandle()}
        />
      </StyledHeader>
      {bookmarkFolders && (
        <StyledFolderList>
          {bookmarkFolders.map(
            (bookmarkFolder: IResponseBookmarkFolder, key: number) => {
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
            }
          )}
        </StyledFolderList>
      )}
      <Loader show={isFetching} />

      {/* edit modal */}
      <Modal
        key="new-bookmar-modal"
        showModal={!!editingFolder}
        width="thin"
        onEnterPress={() => acceptEditingFolderMutation.mutate()}
      >
        <ModalHeader title="Bookmark Folder" />
        <ModalContent>
          <Input
            label="Bookmark folder name: "
            placeholder=""
            onChangeFn={(newName: string) => setEditingFolderName(newName)}
            value={editingFolderName}
            changeOnType
            autoFocus
          />
        </ModalContent>

        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              color="warning"
              onClick={() => {
                cancelEditingFolder();
              }}
            />
            <Button
              key="submit"
              label="Submit"
              color="primary"
              onClick={() => {
                acceptEditingFolderMutation.mutate();
              }}
              disabled={!editedFolderIsValid}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>

      {/* create modal */}
      <Modal
        key="create-modal"
        showModal={creatingFolder == true}
        onClose={() => {
          cancelCreatingFolder();
        }}
        onEnterPress={() => createFolderMutation.mutate()}
      >
        <ModalHeader title="Bookmark Folder" />
        <ModalContent>
          <Input
            label="Bookmark folder name: "
            placeholder=""
            onChangeFn={(newName: string) => setEditingFolderName(newName)}
            value={editingFolderName}
            changeOnType
            autoFocus
          />
        </ModalContent>

        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              color="warning"
              onClick={() => {
                cancelCreatingFolder();
              }}
            />

            <Button
              key="create"
              label="Create"
              color="primary"
              onClick={() => {
                createFolderMutation.mutate();
              }}
              disabled={!editedFolderIsValid}
            />
          </ButtonGroup>
        </ModalFooter>
        <Loader
          show={
            createFolderMutation.isLoading ||
            acceptEditingFolderMutation.isLoading
          }
        />
      </Modal>

      <Submit
        title={`Delete Bookmark folder ${removingFolderName}`}
        text={`Do you really want do delete Bookmark folder ${removingFolderName}?`}
        show={removingFolder != false}
        onSubmit={() => acceptRemoveFolderMutation.mutate()}
        onCancel={() => cancelRemoveFolder()}
        loading={acceptRemoveFolderMutation.isLoading}
      />
    </StyledContent>
  );
};

export const MemoizedEntityBookmarkBox = React.memo(EntityBookmarkBox);
