import Audit from "@models/audit/audit";
import { AuditScope } from "@inkvisitor/shared/types";
import {
  Aggregation,
  IStatsAggregationParams,
  TimeUnit,
} from "@inkvisitor/shared/types/stats";
import { Connection, RDatum, r as rethink } from "rethinkdb-ts";
import {
  expandEventTypesForStats,
  foldStatsValuesByEventType,
} from "./event-type-fold";

/**
 * Builds the RethinkDB reduction expression that buckets an audit row's `date`
 * field into the requested time unit (yyyy / yyyy-mm / yyyy-mm-dd / week-start).
 */
function timeBucketFor(timeUnit: TimeUnit): (doc: RDatum) => RDatum {
  switch (timeUnit) {
    case TimeUnit.DAY:
      return (doc: RDatum) => doc("date").toISO8601().slice(0, 10);
    case TimeUnit.WEEK:
      return (doc: RDatum) => {
        const date = doc("date");
        return date.sub(date.dayOfWeek().sub(1).mul(86400)).toISO8601().slice(0, 10);
      };
    case TimeUnit.MONTH:
      return (doc: RDatum) => doc("date").toISO8601().slice(0, 7);
    case TimeUnit.YEAR:
      return (doc: RDatum) => doc("date").toISO8601().slice(0, 4);
    default:
      throw new Error("Invalid time unit");
  }
}

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
 * `fromDate`/`toDate` are optional: when both are set the scan is narrowed with
 * the `date` index `between`; when omitted (e.g. the Explorer stats view, which
 * has no time filter) the `between` is skipped entirely and all dates are
 * counted.
 *
 * @returns values map: dateBucket -> aggregationKey -> count
 */
export async function aggregateAuditStats(
  db: Connection,
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

  const timeBucket = timeBucketFor(timeUnit);

  const matchesEventType = (doc: RDatum) =>
    rethink.expr(expandEventTypesForStats(eventType)).contains(doc("type"));

  // Narrow with the `date` index only when a window is given; otherwise scan all
  // dates. Both branches end in .filter() so `query` keeps one consistent type
  // for the entityIds reassignment below.
  let query =
    fromDate !== undefined && toDate !== undefined
      ? rethink
          .table(Audit.table)
          .between(new Date(fromDate), new Date(toDate), { index: "date" })
          .filter(matchesEventType)
      : rethink.table(Audit.table).filter(matchesEventType);

  if (entityIds) {
    query = query.filter((doc: RDatum) =>
      doc("auditScope")
        .eq(AuditScope.Entity)
        .and(rethink.expr(entityIds).contains(doc("modelId")))
    );
  }

  const aggregatedData = (await query
    .group(timeBucket, (doc: RDatum) =>
      aggregateBy === Aggregation.ACTIVITY_TYPE ? doc("type") : doc(aggregateBy)
    )
    .count()
    .run(db)) as unknown as {
    group: [string, string];
    reduction: number;
  }[];

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
