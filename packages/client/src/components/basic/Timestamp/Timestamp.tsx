import React, { useMemo } from "react";
import { ThemeFontSize } from "Theme/theme";
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
  size?: keyof ThemeFontSize;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
  agoThreshold?: number;
}

export const Timestamp: React.FC<TimestampProps> = ({
  value,
  label,
  format = "stamp",
  size = "xs",
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
    <StyledTimestamp title={stampTitle} $size={size}>
      {label && <StyledTimestampLabel>{label}:</StyledTimestampLabel>}
      <span>{display}</span>
    </StyledTimestamp>
  );
};
