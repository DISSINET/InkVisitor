import Audit from "@models/audit/audit";
import Entity from "@models/entity/entity";
import User from "@models/user/user";
import { IEntity, IUser } from "@shared/types";
import { PropSpecKind } from "@shared/types/prop";
import { Explore } from "@shared/types/query";
import { Connection } from "rethinkdb-ts";

export default class Results<T extends { id: string }> {
  items: string[] | null = null;

  /**
   * Add results from single results batch (edge to be precise) with AND logic: searching for intersection between all results, in other words
   * items argument should be present in previous accumulator
   * @param results
   */
  addAnd(results: string[]) {
    if (!this.items) {
      this.items = results;
      return;
    }

    const newFinals: string[] = [];
    for (const finalItem of this.items) {
      for (const newItem of results) {
        if (finalItem === newItem) {
          newFinals.push(finalItem);
          break;
        }
      }
    }

    this.items = newFinals;
  }

  /**
   * Add results from single results batch (edge to be precise) with AND logic: adding all unique items from all batch results
   * @param results
   */
  addOr(results: string[]) {
    this.items = Array.from(new Set((this.items || []).concat(results)));
  }

  filter(exploreData: Explore.IExplore): string[] {
    if (!this.items || !this.items.length) {
      return [];
    }

    if (exploreData.offset >= this.items.length) return [];

    const endIndex = Math.min(
      exploreData.offset + exploreData.limit,
      this.items.length
    );

    return this.items.slice(exploreData.offset, endIndex);
  }

  async columns(
    db: Connection,
    entity: IEntity,
    columnsData: Explore.IExploreColumn[]
  ): Promise<
    Record<
      string,
      | IEntity
      | IEntity[]
      | number
      | number[]
      | string
      | string[]
      | IUser
      | IUser[]
    >
  > {
    const out: Record<
      string,
      | IEntity
      | IEntity[]
      | number
      | number[]
      | string
      | string[]
      | IUser
      | IUser[]
    > = {};
    for (const column of columnsData) {
      switch (column.type) {
        case Explore.EExploreColumnType.EPV: {
          const params =
            column.params as Explore.IExploreColumnParams<Explore.EExploreColumnType.EPV>;

          const propertyTypeId = params.propertyType;
          const entityIds: Record<string, null> = {};

          entity.props
            .filter((a) => a.type.entityId === propertyTypeId)
            .forEach((prop) => {
              if (prop.value && prop.value.entityId) {
                entityIds[prop.value.entityId] = null;
              }
            });

          out[column.id] = await Entity.findEntitiesByIds(
            db,
            Object.keys(entityIds)
          );
          break;
        }
        case Explore.EExploreColumnType.EUC: {
          const audit = await Audit.getFirstForEntity(db, entity.id);
          if (audit && audit.user) {
            const user = await User.findUserById(db, audit?.user);
            if (user) {
              out[column.id] = user;
            }
          }
          break;
        }
        case Explore.EExploreColumnType.ERR: {
          const referenceIds = entity.references.reduce<string[]>(
            (acc, curr) => {
              acc.push(curr.resource);
              return acc;
            },
            []
          );
          const resources = await Entity.findEntitiesByIds(db, referenceIds);
          out[column.id] = resources;
          break;
        }
      }
    }

    return out;
  }
}
