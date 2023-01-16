import { EntityEnums, UserEnums } from "@shared/enums";
import { ITerritory, IParentTerritory, ITerritoryData } from "@shared/types";
import { r as rethink, Connection, WriteResult, RDatum } from "rethinkdb-ts";
import { IModel, determineOrder } from "@models/common";
import Entity from "@models/entity/entity";
import { InternalServerError, InvalidDeleteError } from "@shared/types/errors";
import User from "@models/user/user";
import treeCache from "@service/treeCache";
import { nonenumerable } from "@common/decorators";

export class TerritoryParent implements IParentTerritory, IModel {
  territoryId: string;
  order: number;

  constructor(data: Partial<IParentTerritory>) {
    this.territoryId = data.territoryId as string;
    this.order = data.order !== undefined ? data.order : -1;
  }

  isValid(): boolean {
    if (this.territoryId === "") {
      return false;
    }

    return true;
  }
}

export class TerritoryData implements ITerritoryData, IModel {
  parent: TerritoryParent | false = false;

  constructor(data: Partial<ITerritoryData>) {
    if (data.parent) {
      this.parent = new TerritoryParent(data.parent || {});
    }
  }

  isValid(): boolean {
    if (this.parent) {
      return this.parent.isValid();
    }

    return true;
  }
}

class Territory extends Entity implements ITerritory {
  class: EntityEnums.Class.Territory;
  data: TerritoryData;

  @nonenumerable
  _siblings?: Record<number, ITerritory>;

  constructor(data: Partial<ITerritory>) {
    super(data);
    this.class = EntityEnums.Class.Territory;
    this.data = new TerritoryData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Territory) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }

  setSiblings(childsMap: Record<number, ITerritory>) {
    this._siblings = childsMap;
  }

  async save(db: Connection | undefined): Promise<WriteResult> {
    if (this.data.parent) {
      // get count of future siblings and move current territory to last
      // position
      const childs = await this.findChilds.call(
        new Territory({ id: this.data.parent.territoryId }),
        db
      );

      const wantedOrder = this.data.parent.order;
      this.data.parent.order = determineOrder(wantedOrder, childs);
    } else if (this.id !== "T0" && !this.isTemplate) {
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
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    if (updateData["data"] && (updateData["data"] as any)["parent"]) {
      const parentData = (updateData["data"] as any)["parent"];

      let parentId: string;
      if (parentData.territoryId) {
        parentId = parentData.territoryId;
      } else if (this.data.parent) {
        parentId = this.data.parent.territoryId;
      } else {
        throw new InternalServerError("parent for territory must be set");
      }

      if (!this._siblings) {
        this._siblings = await new Territory({ id: parentId }).findChilds(db);
      }

      parentData.order = determineOrder(parentData.order, this._siblings);

      this.data.parent = new TerritoryParent({
        territoryId: parentId,
        order: parentData.order,
      });
    }

    const result = await rethink
      .table(Entity.table)
      .get(this.id)
      .update(updateData)
      .run(db);

    await treeCache.initialize();

    return result;
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

    const result = await super.delete(db);

    await treeCache.initialize();

    return result;
  }

  async findChilds(
    db: Connection | undefined
  ): Promise<Record<number, ITerritory>> {
    const list: ITerritory[] = await rethink
      .table(Territory.table)
      .filter({
        class: EntityEnums.Class.Territory,
      })
      .filter((territory: RDatum) => {
        return rethink.and(
          territory("data")("parent").typeOf().eq("OBJECT"),
          territory("data")("parent")("territoryId").eq(this.id)
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

  canBeViewedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserEnums.Role.Admin) {
      return true;
    }

    return !!treeCache.getRightForTerritory(this.id, user.rights);
  }

  canBeEditedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserEnums.Role.Admin) {
      return true;
    }

    const closestRight = treeCache.getRightForTerritory(this.id, user.rights);

    if (!closestRight) {
      return false;
    }

    return (
      closestRight.mode === UserEnums.RoleMode.Admin ||
      closestRight.mode === UserEnums.RoleMode.Write
    );
  }

  canBeCreatedByUser(user: User): boolean {
    // in case of create - no id provided yet
    if (!this.id) {
      return true;
    }

    // admin role has always the right
    if (user.role === UserEnums.Role.Admin) {
      return true;
    }

    if (!this.data.parent) {
      return false;
    }

    const closestRight = treeCache.getRightForTerritory(
      this.data.parent.territoryId,
      user.rights
    );

    if (!closestRight) {
      return false;
    }

    return (
      closestRight.mode === UserEnums.RoleMode.Admin ||
      closestRight.mode === UserEnums.RoleMode.Write
    );
  }

  canBeDeletedByUser(user: User): boolean {
    // admin role has always the right
    if (user.role === UserEnums.Role.Admin) {
      return true;
    }

    return false;
  }

  /**
   * Returns entity ids discovered in parent Entity.getEntitiesIds + this Territory.data.parent.id
   * @returns list of ids
   */
  getEntitiesIds(): string[] {
    const entity = new Entity({});
    const entityIds = entity.getEntitiesIds.call(this);

    if (this.data.parent) {
      entityIds.push(this.data.parent.territoryId);
    }

    return entityIds;
  }
}

export default Territory;
