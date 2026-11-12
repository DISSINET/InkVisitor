import { Input } from "components";
import React from "react";
import {
  StyledDateRange,
  StyledDateRangeField,
  StyledDateRangeLabel,
} from "./FloatingSearchFormStyles";

const dateToDatetimeLocal = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** a datetime-local value or a stored ISO date, undefined when it is missing or unreadable */
export const parseDate = (value: string | undefined): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

interface DateRangeFilter {
  after?: Date;
  before?: Date;
  /** called with both ends, the edited one changed */
  onChange: (after: Date | undefined, before: Date | undefined) => void;
}

/** an after / before pair of local datetime inputs; either end may stay empty */
export const DateRangeFilter: React.FC<DateRangeFilter> = ({ after, before, onChange }) => (
  <StyledDateRange>
    <StyledDateRangeField>
      <StyledDateRangeLabel>after</StyledDateRangeLabel>
      <Input
        type="datetime-local"
        width="full"
        value={after ? dateToDatetimeLocal(after) : ""}
        onChangeFn={(value) => onChange(parseDate(value), before)}
        clearable
      />
    </StyledDateRangeField>
    <StyledDateRangeField>
      <StyledDateRangeLabel>before</StyledDateRangeLabel>
      <Input
        type="datetime-local"
        width="full"
        value={before ? dateToDatetimeLocal(before) : ""}
        onChangeFn={(value) => onChange(after, parseDate(value))}
        clearable
      />
    </StyledDateRangeField>
  </StyledDateRange>
);
