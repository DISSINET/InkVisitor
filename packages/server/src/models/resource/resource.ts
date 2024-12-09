import { fillFlatObject, IModel } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { IResource, IResourceData } from "@shared/types/resource";
import Entity from "@models/entity/entity";
import { r as rethink, Connection } from "rethinkdb-ts";

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
}

export default Resource;
