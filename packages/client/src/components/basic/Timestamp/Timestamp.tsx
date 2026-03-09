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
  cutSeconds?: boolean;
  cutTime?: boolean;
}

export const Timestamp: React.FC<TimestampProps> = ({
  value,
  label,
  format = "stamp",
  size = "xs",
  locale,
  options = DEFAULT_STAMP_OPTIONS,
  agoThreshold = DEFAULT_AGO_THRESHOLD_DAYS,
  cutSeconds = false,
  cutTime = false,
}) => {
  const { display, tooltipTitle } = useMemo(
    () =>
      formatTimestampDisplay({
        value,
        format,
        locale,
        stampOptions: options,
        agoThreshold,
        cutSeconds,
        cutTime,
      }),
    [value, format, locale, options, agoThreshold, cutSeconds, cutTime]
  );

  return (
    <StyledTimestamp title={tooltipTitle} $size={size}>
      {label && <StyledTimestampLabel>{label}:</StyledTimestampLabel>}
      <span>{display}</span>
    </StyledTimestamp>
  );
};
