import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { ThemeColor } from "Theme/theme";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MdCancel } from "react-icons/md";
import {
  RiArrowDownSLine,
  RiArrowLeftDoubleLine,
  RiArrowLeftSLine,
  RiArrowRightDoubleLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
  RiCalendar2Line,
  RiTimeLine,
} from "react-icons/ri";
import {
  StyledCalendar,
  StyledClearButton,
  StyledDay,
  StyledDayGrid,
  StyledFooter,
  StyledFooterButton,
  StyledGrid,
  StyledGridCell,
  StyledHeader,
  StyledHeaderNav,
  StyledMonthLabel,
  StyledNavButton,
  StyledScrollColumn,
  StyledScrollItem,
  StyledStepButton,
  StyledTimeColon,
  StyledTimeControl,
  StyledTimeControlWrap,
  StyledTimeIconButton,
  StyledTimeLabel,
  StyledTimeRow,
  StyledTimeScroller,
  StyledTimeSegment,
  StyledTimeStepper,
  StyledTimeValueInput,
  StyledTrigger,
  StyledTriggerIcons,
  StyledTriggerValue,
  StyledWeekday,
  StyledWeekRow,
  StyledWrapper,
} from "./DatePickerStyles";

type DatePickerType = "date" | "datetime-local";

interface DatePickerProps {
  type?: DatePickerType;
  /** ISO-ish value: "YYYY-MM-DD" for date, "YYYY-MM-DDTHH:mm" for datetime-local. */
  value?: string;
  onChange: (value: string) => void;
  width?: number | "full";
  disabled?: boolean;
  clearable?: boolean;
  inverted?: boolean;
  noBorder?: boolean;
  borderColor?: keyof ThemeColor;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2020, i, 1).toLocaleDateString(undefined, { month: "short" })
);

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/** Number of years shown at once in the year-selection grid. */
const YEAR_PAGE_SIZE = 12;

type CalendarView = "days" | "months" | "years";

const pad = (n: number) => String(n).padStart(2, "0");

/** Parse the stored string value into a local Date (or null). */
const parseValue = (value: string, type: DatePickerType): Date | null => {
  if (!value) {
    return null;
  }
  // Append a local-midnight time for date-only values so the day doesn't
  // shift across timezones (new Date("2026-06-15") is parsed as UTC).
  const parsed = type === "date" ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Format a Date back into the stored string value. */
const formatValue = (date: Date, type: DatePickerType): string => {
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  if (type === "date") {
    return datePart;
  }
  return `${datePart}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Human readable label shown inside the trigger. */
const formatDisplay = (date: Date, type: DatePickerType): string => {
  const datePart = date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (type === "date") {
    return datePart;
  }
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${datePart} · ${timePart}`;
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** 6×7 matrix of dates covering the month of (year, month), Monday-first. */
const getMonthMatrix = (year: number, month: number): Date[][] => {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const cursor = new Date(year, month, 1 - startWeekday);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  type = "date",
  value = "",
  onChange,
  width,
  disabled = false,
  clearable = false,
  inverted = false,
  noBorder = false,
  borderColor,
  placeholder,
  onFocus = () => {},
  onBlur = () => {},
}) => {
  const selectedDate = useMemo(() => parseValue(value, type), [value, type]);
  const today = useMemo(() => new Date(), []);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CalendarView>("days");
  const [viewDate, setViewDate] = useState<Date>(selectedDate ?? today);
  const [timeScrollerOpen, setTimeScrollerOpen] = useState(false);

  const minuteInputRef = useRef<HTMLInputElement>(null);
  const timeWrapRef = useRef<HTMLDivElement>(null);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minuteColRef = useRef<HTMLDivElement>(null);

  // Local, free-typing state for the time segments (committed on blur / step).
  const [hourStr, setHourStr] = useState(() =>
    selectedDate ? pad(selectedDate.getHours()) : "00"
  );
  const [minuteStr, setMinuteStr] = useState(() =>
    selectedDate ? pad(selectedDate.getMinutes()) : "00"
  );

  // Keep the segments in sync when the value changes externally (e.g. day pick).
  useEffect(() => {
    if (selectedDate) {
      setHourStr(pad(selectedDate.getHours()));
      setMinuteStr(pad(selectedDate.getMinutes()));
    }
  }, [selectedDate]);

  // Keep the visible month in sync with the selected value when reopening,
  // and forward focus/blur — but skip the initial mount.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (open) {
      setViewDate(selectedDate ?? new Date());
      setView("days");
      onFocus();
    } else {
      setTimeScrollerOpen(false);
      onBlur();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Scroll the selected hour/minute into the middle of their columns on open.
  useEffect(() => {
    if (!timeScrollerOpen) {
      return;
    }
    const center = (col: HTMLDivElement | null) => {
      const sel = col?.querySelector<HTMLElement>('[data-selected="true"]');
      if (col && sel) {
        col.scrollTop = sel.offsetTop - col.clientHeight / 2 + sel.clientHeight / 2;
      }
    };
    center(hourColRef.current);
    center(minuteColRef.current);
  }, [timeScrollerOpen]);

  // Close the time scroller when clicking elsewhere inside the calendar.
  useEffect(() => {
    if (!timeScrollerOpen) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!timeWrapRef.current?.contains(e.target as Node)) {
        setTimeScrollerOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [timeScrollerOpen]);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (next) => {
      if (disabled) {
        return;
      }
      setOpen(next);
    },
    placement: "bottom-start",
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const weeks = useMemo(
    () => getMonthMatrix(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  const monthLabel = viewDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const yearPageStart =
    Math.floor(viewDate.getFullYear() / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE;

  const headerLabel =
    view === "days"
      ? monthLabel
      : view === "months"
        ? String(viewDate.getFullYear())
        : `${yearPageStart} – ${yearPageStart + YEAR_PAGE_SIZE - 1}`;

  const shiftView = (deltaMonths: number, deltaYears = 0) => {
    setViewDate(
      (prev) =>
        new Date(prev.getFullYear() + deltaYears, prev.getMonth() + deltaMonths, 1)
    );
  };

  const navPrev = () => {
    if (view === "days") shiftView(-1);
    else if (view === "months") shiftView(0, -1);
    else shiftView(0, -YEAR_PAGE_SIZE);
  };
  const navNext = () => {
    if (view === "days") shiftView(1);
    else if (view === "months") shiftView(0, 1);
    else shiftView(0, YEAR_PAGE_SIZE);
  };
  const cycleHeaderView = () =>
    setView((v) => (v === "days" ? "months" : v === "months" ? "years" : "days"));

  const selectMonth = (monthIndex: number) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
    setView("days");
  };
  const selectYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setView("months");
  };

  const currentHour = () => parseInt(hourStr || "0", 10) || 0;
  const currentMinute = () => parseInt(minuteStr || "0", 10) || 0;

  const commitDate = (day: Date) => {
    const next = new Date(day);
    if (type === "datetime-local") {
      // Keep the currently entered time (defaults to 00:00).
      next.setHours(currentHour(), currentMinute(), 0, 0);
    }
    onChange(formatValue(next, type));
    if (type === "date") {
      setOpen(false);
    }
  };

  const commitTime = (hours: number, minutes: number) => {
    const h = Math.min(Math.max(hours, 0), 23);
    const m = Math.min(Math.max(minutes, 0), 59);
    const base = selectedDate ?? viewDate;
    const next = new Date(base);
    next.setHours(h, m, 0, 0);
    setHourStr(pad(h));
    setMinuteStr(pad(m));
    onChange(formatValue(next, type));
  };

  const stepHour = (delta: number) =>
    commitTime((currentHour() + delta + 24) % 24, currentMinute());
  const stepMinute = (delta: number) =>
    commitTime(currentHour(), (currentMinute() + delta + 60) % 60);

  const parseClamp = (raw: string, max: number) =>
    Math.min(parseInt(raw.replace(/\D/g, "") || "0", 10) || 0, max);

  // Typing hours: auto-advance to minutes once the hour is unambiguous, so
  // the user can type four digits in a row (e.g. "1430" → 14:30).
  const handleHourChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setHourStr(digits);
    const complete =
      digits.length === 2 || (digits.length === 1 && parseInt(digits, 10) > 2);
    if (complete) {
      commitTime(parseClamp(digits, 23), currentMinute());
      minuteInputRef.current?.focus();
      minuteInputRef.current?.select();
    }
  };

  const handleMinuteChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setMinuteStr(digits);
    if (digits.length === 2) {
      commitTime(currentHour(), parseClamp(digits, 59));
    }
  };

  // Footer shortcut: "Today" (date) jumps to today; "Now" (datetime) also
  // sets the current time.
  const goToNow = () => {
    const now = new Date();
    setViewDate(now);
    setView("days");
    if (type === "datetime-local") {
      setHourStr(pad(now.getHours()));
      setMinuteStr(pad(now.getMinutes()));
    }
    onChange(formatValue(now, type));
    if (type === "date") {
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <StyledWrapper width={width}>
      <StyledTrigger
        ref={refs.setReference}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Open date picker"
        $disabled={disabled}
        $open={open}
        $inverted={inverted}
        $noBorder={noBorder}
        $borderColor={borderColor}
        width={width}
        {...getReferenceProps()}
      >
        <StyledTriggerValue $placeholder={!selectedDate}>
          {selectedDate
            ? formatDisplay(selectedDate, type)
            : placeholder ?? (type === "date" ? "Select date" : "Select date & time")}
        </StyledTriggerValue>
        <StyledTriggerIcons>
          {clearable && selectedDate && !disabled && (
            <StyledClearButton
              role="button"
              aria-label="Clear date"
              onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
              onClick={handleClear}
            >
              <MdCancel size={15} />
            </StyledClearButton>
          )}
          <RiCalendar2Line size={16} />
        </StyledTriggerIcons>
      </StyledTrigger>

      {open && (
        <FloatingPortal id="page-content">
          <FloatingFocusManager context={context} modal={false} initialFocus={-1}>
            <StyledCalendar
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <StyledHeader>
                <StyledHeaderNav>
                  {view === "days" && (
                    <StyledNavButton
                      type="button"
                      aria-label="Previous year"
                      onClick={() => shiftView(0, -1)}
                    >
                      <RiArrowLeftDoubleLine size={18} />
                    </StyledNavButton>
                  )}
                  <StyledNavButton
                    type="button"
                    aria-label="Previous"
                    onClick={navPrev}
                  >
                    <RiArrowLeftSLine size={18} />
                  </StyledNavButton>
                </StyledHeaderNav>

                <StyledMonthLabel type="button" onClick={cycleHeaderView}>
                  {headerLabel}
                </StyledMonthLabel>

                <StyledHeaderNav>
                  <StyledNavButton
                    type="button"
                    aria-label="Next"
                    onClick={navNext}
                  >
                    <RiArrowRightSLine size={18} />
                  </StyledNavButton>
                  {view === "days" && (
                    <StyledNavButton
                      type="button"
                      aria-label="Next year"
                      onClick={() => shiftView(0, 1)}
                    >
                      <RiArrowRightDoubleLine size={18} />
                    </StyledNavButton>
                  )}
                </StyledHeaderNav>
              </StyledHeader>

              {view === "days" && (
                <>
                  <StyledWeekRow>
                    {WEEKDAYS.map((wd, i) => (
                      <StyledWeekday key={wd} $weekend={i >= 5}>
                        {wd}
                      </StyledWeekday>
                    ))}
                  </StyledWeekRow>

                  <StyledDayGrid>
                    {weeks.flat().map((day) => {
                      const outside = day.getMonth() !== viewDate.getMonth();
                      const weekend = day.getDay() === 0 || day.getDay() === 6;
                      return (
                        <StyledDay
                          key={day.toISOString()}
                          type="button"
                          $selected={!!selectedDate && isSameDay(day, selectedDate)}
                          $today={isSameDay(day, today)}
                          $outside={outside}
                          $weekend={weekend}
                          onClick={() => commitDate(day)}
                        >
                          {day.getDate()}
                        </StyledDay>
                      );
                    })}
                  </StyledDayGrid>
                </>
              )}

              {view === "months" && (
                <StyledGrid>
                  {MONTHS.map((m, i) => (
                    <StyledGridCell
                      key={m}
                      type="button"
                      $selected={
                        !!selectedDate &&
                        selectedDate.getFullYear() === viewDate.getFullYear() &&
                        selectedDate.getMonth() === i
                      }
                      $current={
                        today.getFullYear() === viewDate.getFullYear() &&
                        today.getMonth() === i
                      }
                      onClick={() => selectMonth(i)}
                    >
                      {m}
                    </StyledGridCell>
                  ))}
                </StyledGrid>
              )}

              {view === "years" && (
                <StyledGrid>
                  {Array.from(
                    { length: YEAR_PAGE_SIZE },
                    (_, i) => yearPageStart + i
                  ).map((y) => (
                    <StyledGridCell
                      key={y}
                      type="button"
                      $selected={!!selectedDate && selectedDate.getFullYear() === y}
                      $current={today.getFullYear() === y}
                      onClick={() => selectYear(y)}
                    >
                      {y}
                    </StyledGridCell>
                  ))}
                </StyledGrid>
              )}

              {type === "datetime-local" && view === "days" && (
                <StyledTimeRow>
                  <StyledTimeLabel>Time</StyledTimeLabel>
                  <StyledTimeControlWrap ref={timeWrapRef}>
                    <StyledTimeControl>
                      <StyledTimeSegment>
                        <StyledTimeValueInput
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          aria-label="Hours"
                          value={hourStr}
                          onChange={(e) => handleHourChange(e.currentTarget.value)}
                          onFocus={(e) => e.currentTarget.select()}
                          onClick={(e) => e.currentTarget.select()}
                          onBlur={(e) =>
                            commitTime(parseClamp(e.currentTarget.value, 23), currentMinute())
                          }
                          onWheel={(e) => stepHour(e.deltaY < 0 ? 1 : -1)}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                              e.preventDefault();
                              stepHour(1);
                            } else if (e.key === "ArrowDown") {
                              e.preventDefault();
                              stepHour(-1);
                            } else if (e.key === "Enter") {
                              commitTime(parseClamp(e.currentTarget.value, 23), currentMinute());
                            }
                          }}
                        />
                        <StyledTimeStepper>
                          <StyledStepButton
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase hours"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => stepHour(1)}
                          >
                            <RiArrowUpSLine size={12} />
                          </StyledStepButton>
                          <StyledStepButton
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease hours"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => stepHour(-1)}
                          >
                            <RiArrowDownSLine size={12} />
                          </StyledStepButton>
                        </StyledTimeStepper>
                      </StyledTimeSegment>

                      <StyledTimeColon>:</StyledTimeColon>

                      <StyledTimeSegment>
                        <StyledTimeValueInput
                          ref={minuteInputRef}
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          aria-label="Minutes"
                          value={minuteStr}
                          onChange={(e) => handleMinuteChange(e.currentTarget.value)}
                          onFocus={(e) => e.currentTarget.select()}
                          onClick={(e) => e.currentTarget.select()}
                          onBlur={(e) =>
                            commitTime(currentHour(), parseClamp(e.currentTarget.value, 59))
                          }
                          onWheel={(e) => stepMinute(e.deltaY < 0 ? 1 : -1)}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                              e.preventDefault();
                              stepMinute(1);
                            } else if (e.key === "ArrowDown") {
                              e.preventDefault();
                              stepMinute(-1);
                            } else if (e.key === "Enter") {
                              commitTime(currentHour(), parseClamp(e.currentTarget.value, 59));
                            }
                          }}
                        />
                        <StyledTimeStepper>
                          <StyledStepButton
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase minutes"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => stepMinute(1)}
                          >
                            <RiArrowUpSLine size={12} />
                          </StyledStepButton>
                          <StyledStepButton
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease minutes"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => stepMinute(-1)}
                          >
                            <RiArrowDownSLine size={12} />
                          </StyledStepButton>
                        </StyledTimeStepper>
                      </StyledTimeSegment>

                      <StyledTimeIconButton
                        type="button"
                        tabIndex={-1}
                        $active={timeScrollerOpen}
                        aria-label="Open time scroller"
                        onClick={() => setTimeScrollerOpen((v) => !v)}
                      >
                        <RiTimeLine size={15} />
                      </StyledTimeIconButton>
                    </StyledTimeControl>

                    {timeScrollerOpen && (
                      <StyledTimeScroller>
                        <StyledScrollColumn ref={hourColRef}>
                          {HOURS.map((h) => (
                            <StyledScrollItem
                              key={h}
                              type="button"
                              data-selected={h === currentHour()}
                              $selected={h === currentHour()}
                              onClick={() => commitTime(h, currentMinute())}
                            >
                              {pad(h)}
                            </StyledScrollItem>
                          ))}
                        </StyledScrollColumn>
                        <StyledScrollColumn ref={minuteColRef}>
                          {MINUTES.map((m) => (
                            <StyledScrollItem
                              key={m}
                              type="button"
                              data-selected={m === currentMinute()}
                              $selected={m === currentMinute()}
                              onClick={() => commitTime(currentHour(), m)}
                            >
                              {pad(m)}
                            </StyledScrollItem>
                          ))}
                        </StyledScrollColumn>
                      </StyledTimeScroller>
                    )}
                  </StyledTimeControlWrap>
                </StyledTimeRow>
              )}

              <StyledFooter>
                <StyledFooterButton type="button" onClick={goToNow}>
                  {type === "datetime-local" ? "Now" : "Today"}
                </StyledFooterButton>
                {clearable && selectedDate && (
                  <StyledFooterButton
                    type="button"
                    $variant="muted"
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                    }}
                  >
                    Clear
                  </StyledFooterButton>
                )}
              </StyledFooter>
            </StyledCalendar>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </StyledWrapper>
  );
};
