import "ts-jest";
import { StatsAggregator } from "./stats-aggregator";
import { MaterializedStats } from "./materialized-stats";
import { Aggregation, EventType } from "@shared/types/stats";

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
