import { Aggregation } from "@inkvisitor/shared/types/stats";
import { describe, expect, it } from "vitest";
import {
  OTHERS_KEY,
  TOTAL_KEY,
  calculateSumsAndPercentages,
  transformDataForTable,
} from "./statsViz.utils";

describe("statsViz.utils", () => {
  describe("calculateSumsAndPercentages", () => {
    it("counts only categories that get a column into the grand total", () => {
      const { sums, grandTotal } = calculateSumsAndPercentages(
        { "2024": { a: 3, b: 1, c: 6 } },
        ["a", "b"],
        Aggregation.ACTIVITY_TYPE,
        {}
      );

      expect(sums).toEqual({ a: 3, b: 1 });
      expect(grandTotal).toBe(4);
    });

    it("sums the others bucket alongside the named users", () => {
      const { sums, grandTotal } = calculateSumsAndPercentages(
        {
          "2024": { user1: 2, [OTHERS_KEY]: 1 },
          "2025": { user1: 3, [OTHERS_KEY]: 4 },
        },
        ["admin", OTHERS_KEY],
        Aggregation.USER,
        { user1: "admin" }
      );

      expect(sums).toEqual({ admin: 5, [OTHERS_KEY]: 5 });
      expect(grandTotal).toBe(10);
    });

    it("formats the share with two decimals", () => {
      const { sumsWithPercentages } = calculateSumsAndPercentages(
        { "2024": { a: 1, b: 2 } },
        ["a", "b"],
        Aggregation.ACTIVITY_TYPE,
        {}
      );

      expect(sumsWithPercentages).toEqual({
        a: "1 [33.33%]",
        b: "2 [66.67%]",
      });
    });

    it("reports a zero share when there is no data at all", () => {
      const { sumsWithPercentages, grandTotal } = calculateSumsAndPercentages(
        { "2024": { a: 0 } },
        ["a"],
        Aggregation.ACTIVITY_TYPE,
        {}
      );

      expect(grandTotal).toBe(0);
      expect(sumsWithPercentages).toEqual({ a: "0 [0.00%]" });
    });
  });

  describe("transformDataForTable", () => {
    it("adds a per-bucket total column and the grand total to the totals row", () => {
      const rows = transformDataForTable(
        {
          "2024": { a: 1, b: 3 },
          "2025": { a: 4, b: 2 },
        },
        ["a", "b"],
        Aggregation.ACTIVITY_TYPE,
        {}
      );

      expect(rows).toEqual([
        {
          timeKey: "Total",
          a: "5 [50.00%]",
          b: "5 [50.00%]",
          [TOTAL_KEY]: "10",
        },
        { timeKey: "2024", a: 1, b: 3, [TOTAL_KEY]: "4 [40.00%]" },
        { timeKey: "2025", a: 4, b: 2, [TOTAL_KEY]: "6 [60.00%]" },
      ]);
    });

    it("keeps the total column out of the categories it sums", () => {
      const rows = transformDataForTable(
        { "2024": { user1: 2, [OTHERS_KEY]: 1 } },
        ["admin", OTHERS_KEY],
        Aggregation.USER,
        { user1: "admin" }
      );

      expect(rows[1]).toEqual({
        timeKey: "2024",
        admin: 2,
        [OTHERS_KEY]: 1,
        [TOTAL_KEY]: "3 [100.00%]",
      });
    });
  });
});
