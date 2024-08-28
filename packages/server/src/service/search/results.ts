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
          newFinals.push(newItem);
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
    if (!this.items) {
      this.items = results;
    }

    for (const newItem of results) {
      let alreadyInFinal = false;
      for (const finalItem of this.items) {
        if (finalItem.id === newItem.id) {
          alreadyInFinal = true;
          break;
        }
      }

      if (!alreadyInFinal) {
        this.items.push(newItem);
      }
    }
  }
}
