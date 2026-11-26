import { IBookmarkFolder, IResponseBookmarkFolder } from "@inkvisitor/shared/types";

// the user record stores id lists, while the bookmarks query answers with whole entities
export const toStoredBookmarkFolders = (folders: IResponseBookmarkFolder[]): IBookmarkFolder[] =>
  folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    entityIds: folder.entities.map((entity) => entity.id),
  }));
