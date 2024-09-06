import Entity from "@models/entity/entity";
import { IEntity, IUser } from "@shared/types";
import { Explore } from "@shared/types/query";

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

  columns(
    entity: IEntity,
    columnsData: Explore.IExploreColumn[]
  ): Record<
    string,
    | IEntity
    | IEntity[]
    | number
    | number[]
    | string
    | string[]
    | IUser
    | IUser[]
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
      if (typeof entity[column.id as keyof IEntity] !== "undefined") {
        out[column.id] = entity[column.id as keyof IEntity];
      }
    }

    return out;
  }
}
