import React, { useEffect, useMemo, useState, ReactElement } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "api";
const queryString = require("query-string");
import { useLocation, useHistory } from "react-router";

import { CBookmarkFolder } from "constructors";

import {
  Button,
  ButtonGroup,
  Loader,
  Modal,
  ModalCard,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Input,
} from "components";

import {
  FaInfo,
  FaTrashAlt,
  FaPlus,
  FaTrash,
  FaEdit,
  FaFolder,
  FaFolderOpen,
  FaRegFolder,
  FaRegFolderOpen,
  FaDotCircle,
  FaRecycle,
  FaClone,
} from "react-icons/fa";

import {
  StyledContent,
  StyledHeader,
  StyledFolderWrapper,
  StyledFolderHeader,
  StyledFolderContent,
  StyledFolderList,
  StyledFolderHeaderText,
  StyledFolderHeaderButtons,
} from "./ActantBookmarkBoxStyles";

import {
  actantPositionDict,
  referenceTypeDict,
} from "./../../../../../../shared/dictionaries";

import {
  IActant,
  IProp,
  IStatement,
  IStatementReference,
  IResponseStatement,
  IBookmarkFolder,
  IResponseBookmarks,
  IResponseBookmarkFolder,
  IResponseActant,
} from "@shared/types";

export const ActantBookmarkBox: React.FC = () => {
  const queryClient = useQueryClient();

  const [editingBookmarkId, setEditingBookmarkId] =
    useState<string | false>(false);
  const [creatingBookmark, setCreatingBookmark] = useState<boolean>(false);
  const [editingBookmarkName, setEditingBookmarkName] = useState<string>("");
  const [openedFolders, setOpenedFolders] = useState<string[]>([]);

  console.log(localStorage.getItem("username"));

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
      return res.data.bookmarks.sort((a, b) => (a > b ? 1 : -1));
    },
    { enabled: api.isLoggedIn() }
  );

  console.log(bookmarkFolders);

  const getBookmarksCopy = (): IBookmarkFolder[] | false => {
    if (bookmarkFolders) {
      return bookmarkFolders.map((bookmark: IResponseBookmarkFolder) => {
        return {
          id: bookmark.id,
          name: bookmark.name,
          actantIds: bookmark.actants.map((a: IResponseActant) => a.id),
        };
      });
    } else {
      return false;
    }
  };

  // methods
  const startCreatingNewBookmark = (bookmarkId: string) => {
    setEditingBookmarkId(bookmarkId);
  };
  const stopCreatingNewBookmark = () => {
    setEditingBookmarkId(false);
  };
  const clickNewBookmarFolderkHandle = () => {
    setCreatingBookmark(true);

    //startCreatingNewBookmark(newBookmarkFolder.id);
  };

  const cancelCreatingBookmark = () => {
    setEditingBookmarkName("");
    setCreatingBookmark(false);
  };

  const acceptBookmark = async () => {
    if (bookmarkFolders) {
      const newBookmarkFolder: IBookmarkFolder =
        CBookmarkFolder(editingBookmarkName);

      const newBookmarks: IBookmarkFolder[] | false = getBookmarksCopy();
      if (newBookmarks) {
        newBookmarks.push(newBookmarkFolder);
        const res = await api.usersUpdate(false, { bookmarks: newBookmarks });
        if (res.status === 200) {
          setEditingBookmarkName("");
          setCreatingBookmark(false);
        }
      }
    }
  };

  const handleClickFolder = (folderId: string) => {
    console.log("opening", folderId);

    if (openedFolders.includes(folderId)) {
      // close
      setOpenedFolders(openedFolders.filter((f) => f !== folderId));
    } else {
      // open
      setOpenedFolders([...openedFolders, folderId]);
    }
  };

  return (
    <StyledContent>
      <StyledHeader>
        <Button
          key="add"
          icon={<FaPlus size={14} />}
          color="primary"
          label="create new bookmark folder"
          onClick={() => clickNewBookmarFolderkHandle()}
        />
      </StyledHeader>
      {bookmarkFolders && (
        <StyledFolderList key="list">
          {bookmarkFolders.map((bookmarkFolder: IResponseBookmarkFolder) => {
            const open = openedFolders.includes(bookmarkFolder.id);
            const empty = bookmarkFolder.actants.length === 0;

            return (
              <StyledFolderWrapper
                key={bookmarkFolder.id}
                onClick={() => {
                  handleClickFolder(bookmarkFolder.id);
                }}
              >
                <StyledFolderHeader>
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
                  <StyledFolderHeaderButtons>
                    <ButtonGroup noMargin={true}>
                      <Button
                        key="edit"
                        icon={<FaEdit size={12} />}
                        color="warning"
                        onClick={() => {}}
                      />
                      <Button
                        key="remove"
                        icon={<FaTrash size={12} />}
                        color="danger"
                        onClick={() => {}}
                      />
                    </ButtonGroup>
                  </StyledFolderHeaderButtons>
                </StyledFolderHeader>
                <StyledFolderContent>
                  {open && <span>open</span>}
                </StyledFolderContent>
              </StyledFolderWrapper>
            );
          })}
        </StyledFolderList>
      )}
      <Loader show={isFetching} />
      {/* edit modal */}
      <Modal
        key="edit-modal"
        showModal={!!editingBookmarkId}
        width="thin"
      ></Modal>

      {/* create modal */}
      <Modal key="create-modal" showModal={creatingBookmark} width="thin">
        <ModalHeader title="Create new Bookmark Folder" />
        <ModalContent>
          <Input
            label="Bookmark folder name: "
            placeholder=""
            onChangeFn={(newName: string) => setEditingBookmarkName(newName)}
            value={editingBookmarkName}
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
                cancelCreatingBookmark();
              }}
            />
            <Button
              key="create"
              label="Create"
              color="primary"
              onClick={() => {
                acceptBookmark();
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </StyledContent>
  );
};
