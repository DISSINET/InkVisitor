export type TimestampFormat = "ago" | "stamp" | "mixed";

export interface TimestampDisplayOptions {
  value: string | number | Date;
  format: TimestampFormat;
  locale?: string;
  stampOptions?: Intl.DateTimeFormatOptions;
  agoThreshold?: number;
}

export const DEFAULT_STAMP_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
};

export const DEFAULT_AGO_THRESHOLD_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const relativeTimeUnits: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> =
  [
    { unit: "year", ms: 365 * DAY_IN_MS },
    { unit: "month", ms: 30 * DAY_IN_MS },
    { unit: "week", ms: 7 * DAY_IN_MS },
    { unit: "day", ms: DAY_IN_MS },
    { unit: "hour", ms: 60 * 60 * 1000 },
    { unit: "minute", ms: 60 * 1000 },
    { unit: "second", ms: 1000 },
  ];

export const toDate = (value: string | number | Date): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatStamp = (
  date: Date,
  locale?: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_STAMP_OPTIONS
): string => {
  return date.toLocaleString(locale, options);
};

export const formatAgo = (date: Date, locale?: string): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const absDiffMs = Math.abs(diffMs);

  if (absDiffMs < 30 * 1000) {
    return "just now";
  }

  const foundUnit = relativeTimeUnits.find(({ ms }) => absDiffMs >= ms);
  const selectedUnit = foundUnit ?? relativeTimeUnits[relativeTimeUnits.length - 1];
  const count = Math.max(1, Math.floor(absDiffMs / selectedUnit.ms));
  const directionAdjustedValue = diffMs >= 0 ? -count : count;

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return formatter.format(directionAdjustedValue, selectedUnit.unit);
};

export const formatTimestampDisplay = ({
  value,
  format,
  locale,
  stampOptions = DEFAULT_STAMP_OPTIONS,
  agoThreshold = DEFAULT_AGO_THRESHOLD_DAYS,
}: TimestampDisplayOptions): { display: string; stampTitle: string } => {
  const parsedValue = toDate(value);

  if (!parsedValue) {
    const fallback = String(value);
    return {
      display: fallback,
      stampTitle: fallback,
    };
  }

  const stampValue = formatStamp(parsedValue, locale, stampOptions);
  if (format === "stamp") {
    return { display: stampValue, stampTitle: stampValue };
  }

  const absDiffMs = Math.abs(Date.now() - parsedValue.getTime());
  const agoThresholdMs = agoThreshold * DAY_IN_MS;
  const shouldUseAgo = format === "ago" || absDiffMs <= agoThresholdMs;

  return {
    display: shouldUseAgo ? formatAgo(parsedValue, locale) : stampValue,
    stampTitle: stampValue,
  };
};
