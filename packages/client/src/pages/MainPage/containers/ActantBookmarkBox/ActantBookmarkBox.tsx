import { EntityClass } from "@shared/enums";
import {
  IEntity,
  IBookmarkFolder,
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
import {
  FaEdit,
  FaFolder,
  FaFolderOpen,
  FaPlus,
  FaRegFolder,
  FaRegFolderOpen,
  FaTrash,
} from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { EntitySuggester } from "..";
import {
  StyledContent,
  StyledFolderContent,
  StyledFolderContentTags,
  StyledFolderHeader,
  StyledFolderHeaderButtons,
  StyledFolderHeaderText,
  StyledFolderList,
  StyledFolderSuggester,
  StyledFolderWrapper,
  StyledFolderWrapperOpenArea,
  StyledHeader,
} from "./ActantBookmarkBoxStyles";
import { ActantBookmarkFolderTable } from "./ActantBookmarkFolderTable/ActantBookmarkFolderTable";

const bookmarkEntities = [
  EntityClass.Action,
  EntityClass.Person,
  EntityClass.Group,
  EntityClass.Object,
  EntityClass.Concept,
  EntityClass.Location,
  EntityClass.Value,
  EntityClass.Event,
  EntityClass.Statement,
  EntityClass.Territory,
  EntityClass.Resource,
];

export const ActantBookmarkBox: React.FC = () => {
  const queryClient = useQueryClient();

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
      const res = await api.bookmarksGet(false);
      res.data.sort((a, b) => (a.name > b.name ? 1 : -1));
      return res.data;
    },
    { enabled: api.isLoggedIn() }
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

  const startEditingFolder = (folder: IResponseBookmarkFolder) => {
    setEditingFolder(folder.id);
    setEditingFolderName(folder.name);
  };

  const cancelEditingFolder = () => {
    setEditingFolderName("");
    setEditingFolder(false);
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
        await api.usersUpdate(false, {
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

  const askRemoveFolder = (folderId: string) => {
    setRemovingFolder(folderId);
  };

  const acceptRemoveFolderMutation = useMutation(
    async () => {
      const newBookmarks: IBookmarkFolder[] | false = getBookmarksCopy();
      if (newBookmarks) {
        const newBookmarksAfterRemove = newBookmarks.filter(
          (b) => b.id !== removingFolder
        );
        await api.usersUpdate(false, {
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
          await api.usersUpdate(false, { bookmarks: newBookmarks });
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

  const handleClickFolder = (folderId: string) => {
    if (openedFolders.includes(folderId)) {
      // close
      setOpenedFolders(openedFolders.filter((f) => f !== folderId));
    } else {
      // open
      setOpenedFolders([...openedFolders, folderId]);
    }
  };

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

  const removeBookmark = async (folderId: string, bookmarkId: string) => {
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

  const changeBookmarksMutation = useMutation(
    async (newBookmarks: IBookmarkFolder[]) =>
      await api.usersUpdate(false, { bookmarks: newBookmarks }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["bookmarks"]);
      },
    }
  );

  const updateFolderActants = (newActantIds: string[], folderId: string) => {
    const newBookmarks: IBookmarkFolder[] | false = getBookmarksCopy();
    if (newBookmarks) {
      const folder = newBookmarks.find((b) => b.id === folderId);
      if (folder) {
        folder.entityIds = newActantIds;
        changeBookmarksMutation.mutate(newBookmarks);
      }
    }
  };
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
          {bookmarkFolders.map((bookmarkFolder: IResponseBookmarkFolder) => {
            const open = openedFolders.includes(bookmarkFolder.id);
            const empty = bookmarkFolder.entities.length === 0;

            return (
              <StyledFolderWrapper key={bookmarkFolder.id}>
                <StyledFolderHeader
                  onClick={() => {
                    handleClickFolder(bookmarkFolder.id);
                  }}
                >
                  <StyledFolderWrapperOpenArea>
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
                    <StyledFolderHeaderText>
                      {bookmarkFolder.name}
                    </StyledFolderHeaderText>
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
                {open && (
                  <StyledFolderContent>
                    <StyledFolderContentTags>
                      <ActantBookmarkFolderTable
                        folder={bookmarkFolder}
                        updateFolderActants={updateFolderActants}
                        removeBookmark={removeBookmark}
                      ></ActantBookmarkFolderTable>
                    </StyledFolderContentTags>
                    <StyledFolderSuggester>
                      <EntitySuggester
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
          })}
        </StyledFolderList>
      )}
      <Loader show={isFetching} />

      {/* edit modal */}
      <Modal key="new-bookmar-modal" showModal={!!editingFolder} width="thin">
        <ModalHeader title="Bookmark Folder" />
        <ModalContent>
          <Input
            label="Bookmark folder name: "
            placeholder=""
            onChangeFn={(newName: string) => setEditingFolderName(newName)}
            value={editingFolderName}
            changeOnType
            autoFocus
            onEnterPressFn={() => {
              acceptEditingFolderMutation.mutate();
            }}
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
      <Modal key="create-modal" showModal={creatingFolder == true}>
        <ModalHeader title="Bookmark Folder" />
        <ModalContent>
          <Input
            label="Bookmark folder name: "
            placeholder=""
            onChangeFn={(newName: string) => setEditingFolderName(newName)}
            value={editingFolderName}
            changeOnType
            autoFocus
            onEnterPressFn={() => {
              createFolderMutation.mutate();
            }}
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
