import { Explore } from "@shared/types/query";

export default class Results<T extends { id: string }> {
  items: T[] | null = null;

  /**
   * Add results from single results batch (edge to be precise) with AND logic: searching for intersection between all results, in other words
   * items argument should be present in previous accumulator
   * @param results
   */
  addAnd(results: T[]) {
    if (!this.items) {
      this.items = results;
      return;
    }

    const newFinals: T[] = [];
    for (const finalItem of this.items) {
      for (const newItem of results) {
        if (finalItem.id === newItem.id) {
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
  addOr(results: T[]) {
    this.items = Array.from(new Set((this.items || []).concat(results)));
  }

  filter(exploreData: Explore.IExplore): T[] {
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
}
