import React, { useMemo } from "react";
import { StyledTimestamp, StyledTimestampLabel } from "./TimestampStyles";
import {
  DEFAULT_AGO_THRESHOLD_DAYS,
  DEFAULT_STAMP_OPTIONS,
  formatTimestampDisplay,
  TimestampFormat,
} from "./utils";

interface TimestampProps {
  value: string | number | Date;
  label?: string;
  format?: TimestampFormat;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
  agoThreshold?: number;
}

export const Timestamp: React.FC<TimestampProps> = ({
  value,
  label,
  format = "stamp",
  locale,
  options = DEFAULT_STAMP_OPTIONS,
  agoThreshold = DEFAULT_AGO_THRESHOLD_DAYS,
}) => {
  const { display, stampTitle } = useMemo(
    () =>
      formatTimestampDisplay({
        value,
        format,
        locale,
        stampOptions: options,
        agoThreshold,
      }),
    [value, format, locale, options, agoThreshold]
  );

  return (
    <StyledTimestamp title={stampTitle}>
      {label && <StyledTimestampLabel>{label}:</StyledTimestampLabel>}
      <span>{display}</span>
    </StyledTimestamp>
  );
};
