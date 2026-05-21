import "ts-jest";
import { StatsAggregator } from "./stats-aggregator";
import { MaterializedStats } from "./materialized-stats";
import { Aggregation, EventType, TimeUnit } from "@shared/types/stats";

describe("StatsAggregator.mapGroupedAuditsToStats", () => {
  test("activity-type: one row per (date, type) keyed by the event type", () => {
    const result = StatsAggregator.mapGroupedAuditsToStats(
      [
        { group: ["2024-01-01", EventType.ANCHOR_ADD], reduction: 3 },
        { group: ["2024-01-01", EventType.EDIT], reduction: 5 },
      ],
      Aggregation.ACTIVITY_TYPE
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: MaterializedStats.generateId(
        "2024-01-01",
        EventType.ANCHOR_ADD,
        Aggregation.ACTIVITY_TYPE,
        EventType.ANCHOR_ADD
      ),
      date: "2024-01-01",
      eventType: EventType.ANCHOR_ADD,
      aggregateBy: Aggregation.ACTIVITY_TYPE,
      aggregationKey: EventType.ANCHOR_ADD,
      count: 3,
    });
    expect(result[1]).toMatchObject({
      eventType: EventType.EDIT,
      aggregationKey: EventType.EDIT,
      count: 5,
    });
  });

  test("user: one row per (date, type, user) keyed by user, not fanned across types", () => {
    const result = StatsAggregator.mapGroupedAuditsToStats(
      [
        { group: ["2024-01-01", EventType.ANCHOR_ADD, "5"], reduction: 2 },
        { group: ["2024-01-01", EventType.EDIT, "5"], reduction: 7 },
      ],
      Aggregation.USER
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: MaterializedStats.generateId(
        "2024-01-01",
        EventType.ANCHOR_ADD,
        Aggregation.USER,
        "5"
      ),
      eventType: EventType.ANCHOR_ADD,
      aggregateBy: Aggregation.USER,
      aggregationKey: "5",
      count: 2,
    });
    expect(result[1]).toMatchObject({
      eventType: EventType.EDIT,
      aggregationKey: "5",
      count: 7,
    });
  });

  test("each input group yields exactly one output row (no fan-out)", () => {
    const result = StatsAggregator.mapGroupedAuditsToStats(
      [{ group: ["2024-01-01", EventType.ANCHOR_DELETE, "9"], reduction: 1 }],
      Aggregation.USER
    );
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(1);
  });
});

describe("StatsAggregator.startOfBucket", () => {
  test("DAY snaps to the UTC start of that day", () => {
    expect(
      StatsAggregator.startOfBucket(
        new Date("2026-05-21T14:30:05.123Z"),
        TimeUnit.DAY
      ).toISOString()
    ).toBe("2026-05-21T00:00:00.000Z");
  });

  test("MONTH snaps to the first of the month (UTC)", () => {
    expect(
      StatsAggregator.startOfBucket(
        new Date("2026-05-21T14:30:00.000Z"),
        TimeUnit.MONTH
      ).toISOString()
    ).toBe("2026-05-01T00:00:00.000Z");
  });

  test("YEAR snaps to Jan 1 (UTC)", () => {
    expect(
      StatsAggregator.startOfBucket(
        new Date("2026-05-21T14:30:00.000Z"),
        TimeUnit.YEAR
      ).toISOString()
    ).toBe("2026-01-01T00:00:00.000Z");
  });

  test("WEEK snaps back to the preceding Monday (UTC)", () => {
    // 2024-01-03 is a Wednesday; its week starts Monday 2024-01-01
    expect(
      StatsAggregator.startOfBucket(
        new Date("2024-01-03T10:00:00.000Z"),
        TimeUnit.WEEK
      ).toISOString()
    ).toBe("2024-01-01T00:00:00.000Z");
  });

  test("WEEK on a Monday keeps that Monday", () => {
    expect(
      StatsAggregator.startOfBucket(
        new Date("2024-01-01T23:59:00.000Z"),
        TimeUnit.WEEK
      ).toISOString()
    ).toBe("2024-01-01T00:00:00.000Z");
  });

  test("WEEK on a Sunday snaps back to the preceding Monday", () => {
    // 2024-01-07 is a Sunday
    expect(
      StatsAggregator.startOfBucket(
        new Date("2024-01-07T12:00:00.000Z"),
        TimeUnit.WEEK
      ).toISOString()
    ).toBe("2024-01-01T00:00:00.000Z");
  });
});
