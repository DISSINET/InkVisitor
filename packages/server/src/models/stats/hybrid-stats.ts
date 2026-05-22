/**
 * Helpers for serving stats from the materialized table plus a live "tail" for
 * the current day.
 *
 * Aggregation always excludes the current day: aggregateForDateRange truncates
 * its upper bound to midnight and `between` is right-exclusive. So the
 * materialized table covers [..., todayStart) and the current day must be added
 * live. These two windows never overlap, so their per-bucket counts can simply
 * be summed.
 */

/**
 * Returns a copy of the given date with the time set to the start of the day.
 * Mirrors StatsAggregator.truncateToMidnight (local server time) so the live
 * tail seam lines up exactly with where aggregation stopped.
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Computes the live-tail date window (the part of "today" that falls inside the
 * requested [fromDate, toDate] range), or null when the range does not reach
 * into the current day and is therefore fully covered by materialized data.
 */
export function getLiveTailRange(
  fromDate: number,
  toDate: number,
  now: Date
): { fromDate: number; toDate: number } | null {
  const todayStart = startOfDay(now).getTime();
  const liveFrom = Math.max(todayStart, fromDate);
  if (liveFrom >= toDate) {
    return null;
  }
  return { fromDate: liveFrom, toDate };
}

/**
 * Merges two stats value maps (date bucket -> aggregation key -> count) by
 * summing counts. The base is not mutated.
 */
export function mergeStatsValues(
  base: Record<string, Record<string, number>>,
  addition: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const [bucket, keys] of Object.entries(base)) {
    result[bucket] = { ...keys };
  }
  for (const [bucket, keys] of Object.entries(addition)) {
    if (!result[bucket]) {
      result[bucket] = {};
    }
    for (const [key, count] of Object.entries(keys)) {
      result[bucket][key] = (result[bucket][key] ?? 0) + count;
    }
  }
  return result;
}
