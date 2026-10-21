import {
  Aggregation,
  IStatsAggregationParams,
} from "@inkvisitor/shared/types/stats";
import { Conn, storage } from "@service/storage";
import {
  expandEventTypesForStats,
  foldStatsValuesByEventType,
} from "./event-type-fold";

/**
 * Core audit-stats aggregation shared by the global `/stats` endpoint
 * (ResponseStats) and the Explorer stats view. Counts audit events in the
 * [fromDate, toDate) window, grouped by time bucket and aggregation key
 * (activity type or user), and folds deletion event types into their edit type
 * for activity-type aggregation.
 *
 * When `opts.entityIds` is provided, the aggregation is restricted to audit
 * rows whose `modelId` is one of those entities (entity-scoped only) - this is
 * the bridge that turns a query-filtered entity subset into "stats over that
 * subset". An empty list yields an empty result.
 *
 * `fromDate`/`toDate` are optional: when omitted (e.g. the Explorer stats view,
 * which has no time filter) all dates are counted.
 *
 * @returns values map: dateBucket -> aggregationKey -> count
 */
export async function aggregateAuditStats(
  db: Conn,
  params: Omit<IStatsAggregationParams, "fromDate" | "toDate"> & {
    fromDate?: number;
    toDate?: number;
  },
  opts?: { entityIds?: string[] }
): Promise<Record<string, Record<string, number>>> {
  const { fromDate, toDate, timeUnit, aggregateBy, eventType } = params;

  const entityIds = opts?.entityIds;
  if (entityIds && entityIds.length === 0) {
    // No entities in the subset -> no audit rows can match.
    return {};
  }

  const aggregatedData = await storage.audits.countByBucket(db, {
    from: fromDate !== undefined && toDate !== undefined ? new Date(fromDate) : undefined,
    to: fromDate !== undefined && toDate !== undefined ? new Date(toDate) : undefined,
    eventTypes: expandEventTypesForStats(eventType),
    timeUnit,
    groupBy: [aggregateBy === Aggregation.ACTIVITY_TYPE ? "type" : aggregateBy],
    entityIds,
  });

  const newValues: Record<string, Record<string, number>> = {};
  for (const item of aggregatedData) {
    const [dateKey, aggregationGroup] = item.group;
    if (!newValues[dateKey]) {
      newValues[dateKey] = {};
    }
    newValues[dateKey][aggregationGroup] = item.reduction;
  }

  // When aggregating by activity type the inner keys are event types, so fold
  // deletion counts into their edit type (DELETE -> EDIT, ANCHOR_DELETE ->
  // ANCHOR_EDIT). For other aggregations the deletion rows pulled in by the
  // expanded filter are already counted under their key (e.g. user).
  return aggregateBy === Aggregation.ACTIVITY_TYPE
    ? foldStatsValuesByEventType(newValues)
    : newValues;
}
