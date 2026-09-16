import "ts-jest";
import { Explore } from "@inkvisitor/shared/types/query";
import Statement from "@models/statement/statement";
import { Connection } from "rethinkdb-ts";
import {
  applyCoOccurrenceFilter,
  getCoOccurrenceFilter,
} from "./explore-cooccurrence-filter";

const db = {} as Connection;

const coOccurrenceFilter = (
  entityIds: string[]
): Explore.IExploreCoOccurrenceFilter => ({
  type: Explore.SearchOption.CoOccurrence,
  entityIds,
});

describe("explore-cooccurrence-filter", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("getCoOccurrenceFilter finds the co-occurrence filter", () => {
    const filter = coOccurrenceFilter(["a"]);
    expect(getCoOccurrenceFilter([filter])).toEqual(filter);
    expect(getCoOccurrenceFilter([])).toBeUndefined();
  });

  it("keeps only co-occurring items, in their original order", async () => {
    jest
      .spyOn(Statement, "getCoOccurrentEntityIds")
      .mockResolvedValue(["d", "b", "z"]);

    expect(
      await applyCoOccurrenceFilter(db, ["a", "b", "c", "d"], coOccurrenceFilter(["in"]))
    ).toEqual(["b", "d"]);
  });

  it("passes every filter entity to the co-occurrence lookup at once", async () => {
    const spy = jest
      .spyOn(Statement, "getCoOccurrentEntityIds")
      .mockResolvedValue([]);

    await applyCoOccurrenceFilter(db, ["a"], coOccurrenceFilter(["in1", "in2"]));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(db, ["in1", "in2"]);
  });

  it("leaves the items untouched when there is nothing to match against", async () => {
    const spy = jest
      .spyOn(Statement, "getCoOccurrentEntityIds")
      .mockResolvedValue([]);
    const items = ["a", "b"];

    expect(await applyCoOccurrenceFilter(db, items, coOccurrenceFilter([]))).toEqual(items);
    expect(await applyCoOccurrenceFilter(db, [], coOccurrenceFilter(["in"]))).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});
