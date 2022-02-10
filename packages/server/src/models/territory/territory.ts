import {
  ActantType,
  UserRole,
  UserRoleMode,
} from "@shared/enums";
import { ITerritory, IParentTerritory } from "@shared/types/territory";
import { r as rethink, Connection, WriteResult, RDatum } from "rethinkdb-ts";
import { fillFlatObject, UnknownObject, IModel } from "@models/common";
import Actant from "@models/actant/actant";
import { InternalServerError, InvalidDeleteError } from "@shared/types/errors";
import { IUser } from "@shared/types";
import User from "@models/user/user";
import treeCache from "@service/treeCache";

export class TerritoryParent implements IParentTerritory, IModel {
  id = "";
  order = -1;

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data as Record<string, unknown>);
  }

  isValid(): boolean {
    if (this.id === "") {
      return false;
    }

    return true;
  }
}

export class TerritoryData implements IModel {
  parent: TerritoryParent | false = false;

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);

    if (data.parent) {
      this.parent = new TerritoryParent(data.parent as UnknownObject);
    }
  }

  isValid(): boolean {
    if (this.parent) {
      return this.parent.isValid();
    }

    return true;
  }
}

class Territory extends Actant implements ITerritory {
  static table = "actants";
  static publicFields = Actant.publicFields;

  class: ActantType.Territory = ActantType.Territory;
  data: TerritoryData;

  _siblings: Record<number, ITerritory> = {};

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new TerritoryData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== ActantType.Territory) {
      return false;
    }

    return this.data.isValid();
  }

  setSiblings(childsMap: Record<number, ITerritory>) {
    this._siblings = childsMap;
  }

  async save(db: Connection | undefined): Promise<WriteResult> {
    if (this.data.parent) {
      // get count of future siblings and move current territory to last
      // position
      const childs = await this.findChilds.call(
        new Territory({ id: this.data.parent.id }),
        db,
      );

      const wantedOrder = this.data.parent.order;
      this.data.parent.order = Actant.determineOrder(wantedOrder, childs);
    } else if (this.id !== "T0") {
      return {
        deleted: 0,
        first_error: "cannot create territory without a parent",
        errors: 1,
        inserted: 0,
        replaced: 0,
        skipped: 0,
        unchanged: 0,
      };
    }

    const result = await super.save(db);

    await treeCache.initialize();

    return result;
  }

  async update(
    db: Connection | undefined,
    updateData: Record<string, unknown>,
  ): Promise<WriteResult> {
    if (updateData["data"] && (updateData["data"] as any)["parent"]) {
      const parentData = (updateData["data"] as any)["parent"];
      let parentId: string;
      if (parentData.id) {
        parentId = parentData.id;
      } else if (this.data.parent) {
        parentId = this.data.parent.id;
      } else {
        throw new InternalServerError("parent for category must be set");
      }

      this.data.parent = new TerritoryParent({
        id: parentId,
        order: Actant.determineOrder(parentData.order, this._siblings),
      });
      parentData.order = this.data.parent.order;
    }

    const result = await rethink.table(Actant.table).
      get(this.id).
      update(updateData).
      run(db);

    await treeCache.initialize();

    return result;
  }

  async delete(db: Connection | undefined): Promise<WriteResult> {
    if (!this.id) {
      throw new InvalidDeleteError(
        "delete called on territory with undefined id",
      );
    }

    const childs = await this.findChilds(db);
    if (Object.keys(childs).length) {
      throw new InvalidDeleteError("cannot delete territory with childs");
    }

    const result = await super.delete(db);

    await treeCache.initialize();

    return result;
  }

  async findChilds(
    db: Connection | undefined,
  ): Promise<Record<number, ITerritory>> {
    const list: ITerritory[] = await rethink.table(Territory.table).filter({
      class: ActantType.Territory,
    }).filter((territory: RDatum) => {
      return rethink.and(
        territory("data")("parent").typeOf().eq("OBJECT"),
        territory("data")("parent")("id").eq(this.id),
      );
    }).run(db);

    const out: Record<number, ITerritory> = {};
    for (const ter of list) {
      if (ter.data.parent) {
        out[ter.data.parent.order] = ter;
      }
    }

    return out;
  }

  canBeViewedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserRole.Admin) {
      return true;
    }

    return !!treeCache.getRightForTerritory(this.id, user.rights);
  }

  canBeEditedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserRole.Admin) {
      return true;
    }

    const closestRight = treeCache.getRightForTerritory(this.id, user.rights);

    if (!closestRight) {
      return false;
    }

    return (
      closestRight.mode === UserRoleMode.Admin ||
      closestRight.mode === UserRoleMode.Write
    );
  }

  canBeCreatedByUser(user: User): boolean {
    // in case of create - no id provided yet
    if (!this.id) {
      return true;
    }

    // admin role has always the right
    if (user.role === UserRole.Admin) {
      return true;
    }

    if (!this.data.parent) {
      return false;
    }

    const closestRight = treeCache.getRightForTerritory(
      this.data.parent.id,
      user.rights,
    );

    if (!closestRight) {
      return false;
    }

    return (
      closestRight.mode === UserRoleMode.Admin ||
      closestRight.mode === UserRoleMode.Write
    );
  }

  canBeDeletedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserRole.Admin) {
      return true;
    }

    return false;
  }
}

export default Territory;
