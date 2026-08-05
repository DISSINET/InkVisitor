import { IRequestStats } from "@inkvisitor/shared/types";

export const areStatsRequestsEqual = (a: IRequestStats, b: IRequestStats): boolean =>
  a.fromDate === b.fromDate &&
  a.toDate === b.toDate &&
  a.timeUnit === b.timeUnit &&
  a.aggregateBy === b.aggregateBy &&
  a.eventType.length === b.eventType.length &&
  a.eventType.every((event, index) => event === b.eventType[index]);

/**
 * Drops users whose share of the whole activity is below the threshold. Their
 * counts leave the data entirely, so the totals and shares shown afterwards
 * describe the remaining users only.
 */
export const applyUserThreshold = (
  values: Record<string, Record<string, number>>,
  thresholdPercent: number
): Record<string, Record<string, number>> => {
  if (!values || thresholdPercent <= 0) {
    return values;
  }

  const timeKeys = Object.keys(values);

  const userTotals: Record<string, number> = {};
  let grandTotal = 0;
  timeKeys.forEach((timeKey) => {
    const bucket = values[timeKey];
    Object.entries(bucket).forEach(([user, value]) => {
      grandTotal += value;
      userTotals[user] = (userTotals[user] || 0) + value;
    });
  });

  if (grandTotal === 0) {
    return values;
  }

  // Determine ignored users
  const ignored = new Set<string>();
  Object.entries(userTotals).forEach(([user, total]) => {
    const relative = (total / grandTotal) * 100;
    if (relative < thresholdPercent) {
      ignored.add(user);
    }
  });

  if (ignored.size === 0) {
    return values;
  }

  // Build new structure
  const next: Record<string, Record<string, number>> = {};
  timeKeys.forEach((timeKey) => {
    const bucket = values[timeKey];
    const out: Record<string, number> = {};
    Object.entries(bucket).forEach(([user, value]) => {
      if (!ignored.has(user)) {
        out[user] = value;
      }
    });
    next[timeKey] = out;
  });

  return next;
};

// Formats an ISO string into the local "YYYY-MM-DDTHH:mm" value expected by a
// datetime picker, so the displayed time matches the user's timezone.
export const isoToDatetimePicker = (isoString: string): string => {
  const date = new Date(isoString);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const datePickerToIso = (dateString: string): string => {
  return new Date(dateString).toISOString();
};
