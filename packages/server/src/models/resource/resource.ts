import { fillFlatObject, IModel } from "@models/common";
import Entity from "@models/entity/entity";
import User from "@models/user/user";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IResource, IResourceData } from "@inkvisitor/shared/types/resource";
import { Connection, RDatum, r as rethink } from "rethinkdb-ts";

class ResourceData implements IResourceData, IModel {
  url = "";
  partValueLabel = "";
  partValueBaseURL = "";
  documentId?: string;

  constructor(data: Partial<IResourceData>) {
    fillFlatObject(this, data);
    if (data.documentId) {
      this.documentId = data.documentId;
    }
  }

  isValid(): boolean {
    return true;
  }
}

class Resource extends Entity implements IResource {
  class: EntityEnums.Class.Resource = EntityEnums.Class.Resource;
  data: ResourceData;

  constructor(data: Partial<IResource>) {
    super(data);
    this.data = new ResourceData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Resource) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }

  /**
   * Owner/Admin always may. An Editor may edit a Resource that has no document
   * attached; a Resource that carries a document requires the annotate right
   * (assigned in Manage Users). Viewer never.
   */
  canBeEditedByUser(user: User): boolean {
    if (user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin])) {
      return true;
    }
    if (user.role !== UserEnums.Role.Editor) {
      return false;
    }
    // templates are shared building blocks; any editor may edit them
    if (this.isTemplate) {
      return true;
    }
    if (!this.data.documentId) {
      return true;
    }
    return user.hasAnnotateRightForResource(this.id);
  }

  /**
   * Owner/Admin always may. An Editor may delete a Resource that has no document
   * attached; a Resource that carries a document requires the annotate right.
   * Viewer never.
   */
  canBeDeletedByUser(user: User): boolean {
    if (user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin])) {
      return true;
    }
    if (user.role !== UserEnums.Role.Editor) {
      return false;
    }
    // templates are shared building blocks; any editor may delete them
    if (this.isTemplate) {
      return true;
    }
    if (!this.data.documentId) {
      return true;
    }
    return user.hasAnnotateRightForResource(this.id);
  }

  /**
   * find resource entity data by document id value - 1:1 relation,
   * so even if more > 1 results are found, return the first one
   * @param conn
   * @param docId
   * @returns
   */
  static async findByDocumentId(
    conn: Connection,
    docId: string
  ): Promise<IResource | null> {
    const result = await rethink
      .table(Entity.table)
      .filter({
        class: EntityEnums.Class.Resource,
        data: {
          documentId: docId,
        },
      })
      .run(conn);

    return result && result.length ? (result[0] as IResource) : null;
  }

  /**
   * Resources linking to any of the given documents. data.documentId is not
   * indexed, so this walks the whole entity table - one walk for the whole
   * list instead of one per document id.
   * @param conn Connection database connection
   * @param docIds string[] list of document ids
   * @returns Promise<IResource[]> matching resources
   */
  static async findByDocumentIds(
    conn: Connection,
    docIds: string[]
  ): Promise<IResource[]> {
    if (!docIds.length) {
      return [];
    }

    const result = await rethink
      .table(Entity.table)
      .filter({ class: EntityEnums.Class.Resource })
      .filter((row: RDatum) =>
        rethink.expr(docIds).contains(row("data")("documentId").default(""))
      )
      .run(conn);

    return (result || []) as IResource[];
  }
}

export default Resource;
