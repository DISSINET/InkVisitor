import Audit from "@models/audit/audit";
import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";
import User from "@models/user/user";
import { IEntity, IUser } from "@inkvisitor/shared/types";
import { PropSpecKind } from "@inkvisitor/shared/types/prop";
import { Explore } from "@inkvisitor/shared/types/query";
import { Connection } from "rethinkdb-ts";
import { filterEntityIdsByRowLabelFilter, getRowLabelFilter } from "./explore-label-filter";
import { applyRowIdsFilter, getRowIdsFilter } from "./explore-ids-filter";

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

  async applyExploreFilters(
    db: Connection,
    exploreData: Explore.IExplore
  ): Promise<void> {
    if (!this.items?.length) {
      return;
    }

    const rowIdsFilter = getRowIdsFilter(exploreData.filters);
    if (rowIdsFilter?.ids.length) {
      this.items = applyRowIdsFilter(this.items, rowIdsFilter);
      if (!this.items.length) {
        return;
      }
    }

    const rowLabelFilter = getRowLabelFilter(exploreData.filters);
    if (!rowLabelFilter?.label?.trim()) {
      return;
    }

    this.items = await filterEntityIdsByRowLabelFilter(
      db,
      this.items,
      rowLabelFilter
    );
  }

  /**
   * Order items to follow the order of the provided ids (the order the user typed
   * them into the Explore UUIDs filter). Matching is case-insensitive; item casing
   * is preserved. Ids not present in items are skipped, and any items not present in
   * the id list are appended last in their original relative order (defensive: after
   * the UUIDs intersection there should be none).
   */
  orderByIds(ids: string[]): void {
    if (!this.items || !this.items.length) {
      return;
    }

    const itemByLowerId = new Map<string, string>();
    for (const item of this.items) {
      const key = item.toLowerCase();
      if (!itemByLowerId.has(key)) {
        itemByLowerId.set(key, item);
      }
    }

    const ordered: string[] = [];
    const usedKeys = new Set<string>();

    for (const id of ids) {
      const key = id.toLowerCase();
      const item = itemByLowerId.get(key);
      if (item !== undefined && !usedKeys.has(key)) {
        ordered.push(item);
        usedKeys.add(key);
      }
    }

    for (const item of this.items) {
      const key = item.toLowerCase();
      if (!usedKeys.has(key)) {
        ordered.push(item);
        usedKeys.add(key);
      }
    }

    this.items = ordered;
  }

  sort(sortData: Explore.IExploreColumnSort | undefined): void {
    if (!this.items || !this.items.length) {
      return;
    }

    // TODO: implement sorting

    // Temporary solution
    const sortedItems = [...this.items];
    sortedItems.sort((a, b) => {
      return a > b ? 1 : -1;
    });

    this.items = sortedItems;
  }

  filter(exploreData: Explore.IExplore): string[] {
    if (!this.items || !this.items.length) {
      return [];
    }

    if (exploreData.offset >= this.items.length) return [];

    // return all items if limit is 0
    if (exploreData.limit === 0) return this.items;

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
        // Entity Property value
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
        // Created by
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
        // Entity Reference Resources
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
        // Entity Property types
        case Explore.EExploreColumnType.EPT: {
          const entities = await Entity.findEntitiesByIds(
            db,
            Entity.extractIdsFromProps(entity.props, [PropSpecKind.TypeKind])
          );
          out[column.id] = entities;
          break;
        }
        // Entity Relations
        case Explore.EExploreColumnType.ER: {
          const params =
            column.params as Explore.IExploreColumnParams<Explore.EExploreColumnType.ER>;
          // first - retrieve all entity ids that are in some relation with entity.id
          const [entityIds] = await Relation.getLinkedForEntities(
            db,
            [entity.id],
            params.relationType
          );

          // second - get repsective entities from db - omit entity.id
          const entities = await Entity.findEntitiesByIds(
            db,
            entityIds.filter((e) => e !== entity.id)
          );
          out[column.id] = entities;
          break;
        }
      }
    }

    return out;
  }
}
