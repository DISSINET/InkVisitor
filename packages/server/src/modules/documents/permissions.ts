import Resource from "@models/resource/resource";
import User from "@models/user/user";
import { UserEnums } from "@inkvisitor/shared/enums";
import { Conn } from "@service/storage";

/**
 * Whether the user may edit/delete/export the given document. Owner/Admin
 * always can; Viewer never. An Editor may manage a document only when assigned
 * (in Manage Users) the Resource that links to it via data.documentId.
 */
export async function userCanManageDocument(
  conn: Conn,
  documentId: string,
  user: User
): Promise<boolean> {
  if (user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin])) {
    return true;
  }
  if (user.role !== UserEnums.Role.Editor) {
    return false;
  }
  const resource = await Resource.findByDocumentId(conn, documentId);
  return !!resource && user.hasAnnotateRightForResource(resource.id);
}

/**
 * Subset of the given documents the user may manage, by the same rules as
 * userCanManageDocument. The Editor branch resolves the whole list through one
 * Resource lookup - that lookup filters on the unindexed data.documentId, so a
 * per-document call would walk the entity table once per id.
 */
export async function documentsManageableByUser(
  conn: Conn,
  documentIds: string[],
  user: User
): Promise<Set<string>> {
  if (user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin])) {
    return new Set(documentIds);
  }
  if (user.role !== UserEnums.Role.Editor) {
    return new Set();
  }

  const resources = await Resource.findByDocumentIds(conn, documentIds);
  const manageable = new Set<string>();

  for (const resource of resources) {
    const documentId = resource.data.documentId;
    if (documentId && user.hasAnnotateRightForResource(resource.id)) {
      manageable.add(documentId);
    }
  }

  return manageable;
}
