import { IRequestStats } from "@inkvisitor/shared/types";
import { OTHERS_KEY } from "./constants";

export const areStatsRequestsEqual = (a: IRequestStats, b: IRequestStats): boolean =>
  a.fromDate === b.fromDate &&
  a.toDate === b.toDate &&
  a.timeUnit === b.timeUnit &&
  a.aggregateBy === b.aggregateBy &&
  a.eventType.length === b.eventType.length &&
  a.eventType.every((event, index) => event === b.eventType[index]);

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
    let others = 0;
    Object.entries(bucket).forEach(([user, value]) => {
      if (ignored.has(user)) {
        others += value;
      } else {
        out[user] = value;
      }
    });
    if (others > 0) {
      out[OTHERS_KEY] = others;
    }
    next[timeKey] = out;
  });

  return next;
};

// Helper functions for date conversion
export const isoToDatePicker = (isoString: string): string => {
  return new Date(isoString).toISOString().split("T")[0];
};

export const datePickerToIso = (dateString: string): string => {
  return new Date(dateString).toISOString();
};
