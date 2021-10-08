import {
  ActantType,
  ActantStatus,
  UserRole,
  UserRoleMode,
} from "@shared/enums";
import { ITerritory, IParentTerritory } from "@shared/types/territory";
import { r as rethink, Connection, WriteResult, RDatum } from "rethinkdb-ts";
import { fillFlatObject, UnknownObject, IModel } from "./common";
import Actant from "./actant";
import { InternalServerError, InvalidDeleteError } from "@shared/types/errors";
import { IUser } from "@shared/types";
import { UserRight } from "./user";

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

    const parentData = data.parent;
    delete data.parent;
    fillFlatObject(this, data);
    if (parentData) {
      this.parent = new TerritoryParent(parentData as Record<string, unknown>);
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

  id = "";
  class: ActantType.Territory = ActantType.Territory;
  data = new TerritoryData({});
  label: string = "";
  detail: string = "";
  status: ActantStatus = ActantStatus.Pending;
  language: string[] = ["eng"];
  notes: string[] = [];

  _siblings: Record<number, ITerritory> = {};

  constructor(data: UnknownObject) {
    super();

    if (!data) {
      return;
    }

    fillFlatObject(this, data);
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
      // get count of future siblings and move current territory to last position
      const childs = await this.findChilds.call(
        new Territory({ id: this.data.parent.id }),
        db
      );

      const wantedOrder = this.data.parent.order;
      this.data.parent.order = Actant.determineOrder(wantedOrder, childs);
    }

    return super.save(db);
  }

  async update(
    db: Connection | undefined,
    updateData: Record<string, unknown>
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

    return rethink.table(Actant.table).get(this.id).update(updateData).run(db);
  }

  async delete(db: Connection | undefined): Promise<WriteResult> {
    if (!this.id) {
      throw new InvalidDeleteError(
        "delete called on territory with undefined id"
      );
    }

    const childs = await this.findChilds(db);
    if (Object.keys(childs).length) {
      throw new InvalidDeleteError("cannot delete territory with childs");
    }

    return super.delete(db);
  }

  async findChilds(
    db: Connection | undefined
  ): Promise<Record<number, ITerritory>> {
    const list: ITerritory[] = await rethink
      .table(Territory.table)
      .filter({
        class: ActantType.Territory,
      })
      .filter((territory: RDatum) => {
        return rethink.and(
          territory("data")("parent").typeOf().eq("OBJECT"),
          territory("data")("parent")("id").eq(this.id)
        );
      })
      .run(db);

    const out: Record<number, ITerritory> = {};
    for (const ter of list) {
      if (ter.data.parent) {
        out[ter.data.parent.order] = ter;
      }
    }

    return out;
  }

  // find closest parent in the tree - this required the structure to respect tree naming ( ID0 -> ID0_1 -> ID0_1_1 etc)
  getClosestRight(rights: UserRight[]): UserRight | undefined {
    let closestRight: UserRight | undefined;

    for (const right of rights) {
      // explicit right for this territory - use it and end
      if (right.territory === this.id) {
        return right;
      }

      // one of parents found
      if (this.id.indexOf(right.territory) === 0) {
        // test if it is closer match
        if (
          closestRight === undefined ||
          closestRight.territory.length < right.territory.length
        ) {
          closestRight = right;
        }
      }
    }

    return closestRight;
  }
}

export default Territory;
