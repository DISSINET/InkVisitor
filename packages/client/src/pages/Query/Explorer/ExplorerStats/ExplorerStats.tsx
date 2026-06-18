import { IResponseStats } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { Aggregation, EventType, TimeUnit } from "@inkvisitor/shared/types/stats";
import { StatsChart, StatsTable } from "components/advanced";
import { Button, ButtonGroup, Input, Loader } from "components";
import { useDebounce, useResizeObserver } from "hooks";
import React, { useEffect, useState } from "react";
import { FaUndo } from "react-icons/fa";
import { STATS_FILTER_DEBOUNCE_MS } from "pages/Stats/constants";
import { defaultExploreStatsParams, ExploreAction, ExploreActionType } from "../state";
import {
  StyledChartWrapper,
  StyledConfigStrip,
  StyledDateInputWrapper,
  StyledField,
  StyledFieldLabel,
  StyledStatsHeader,
  StyledStatsLayout,
  StyledTableWrapper,
} from "./ExplorerStatsStyles";

/** Event types hidden from the stats config (paired deletion markers). */
const HIDDEN_EVENT_TYPES: EventType[] = [
  EventType.ANCHOR_ADD,
  EventType.ANCHOR_DELETE,
  EventType.ANCHOR_EDIT,
  EventType.TEXT_EDIT,
];
const VISIBLE_EVENT_TYPES = Object.values(EventType).filter(
  (type) => !HIDDEN_EVENT_TYPES.includes(type),
);

// Formats a timestamp into the local "YYYY-MM-DDTHH:mm" value expected by a
// datetime picker, so the displayed time matches the user's timezone.
const toDateTimeInput = (ms: number): string => {
  const date = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const areExploreStatsParamsEqual = (
  a: Explore.IExploreStatsParams,
  b: Explore.IExploreStatsParams,
): boolean =>
  a.fromDate === b.fromDate &&
  a.toDate === b.toDate &&
  a.timeUnit === b.timeUnit &&
  a.aggregateBy === b.aggregateBy &&
  a.eventType.length === b.eventType.length &&
  a.eventType.every((event, index) => event === b.eventType[index]);

interface ExplorerStatsProps {
  stats: Explore.IExploreStatsParams;
  dispatch: React.Dispatch<ExploreAction>;
  values: Record<string, Record<string, number>> | undefined;
  /** Size of the filtered entity subset the stats are computed over. */
  total: number | undefined;
  isFetching: boolean;
  height: number;
}

export const ExplorerStats: React.FC<ExplorerStatsProps> = ({
  stats,
  dispatch,
  values,
  total,
  isFetching,
  height,
}) => {
  const [localStats, setLocalStats] = useState(stats);
  const [filterDebounceEnabled, setFilterDebounceEnabled] = useState(false);

  const debouncedLocalStats = useDebounce(localStats, STATS_FILTER_DEBOUNCE_MS);
  const statsToCommit = filterDebounceEnabled ? debouncedLocalStats : localStats;

  const {
    ref: chartRef,
    width: chartWidth,
    height: chartHeight,
  } = useResizeObserver<HTMLDivElement>({ debounceDelay: 50 });
  const {
    ref: tableRef,
    width: tableWidth,
    height: tableHeight,
  } = useResizeObserver<HTMLDivElement>({ debounceDelay: 50 });

  const setParams = (params: Partial<Explore.IExploreStatsParams>) => {
    setLocalStats((prev) => ({ ...prev, ...params }));
  };

  // Push filter changes to explore state (triggers query refresh).
  useEffect(() => {
    if (areExploreStatsParamsEqual(statsToCommit, stats)) {
      return;
    }
    dispatch({ type: ExploreActionType.setStatsParams, payload: statsToCommit });
  }, [statsToCommit, stats, dispatch]);

  // After the first fetch settles, debounce further filter tweaks (same as Stats page).
  useEffect(() => {
    if (filterDebounceEnabled) {
      return;
    }
    if (isFetching) {
      return;
    }
    if (areExploreStatsParamsEqual(localStats, debouncedLocalStats)) {
      setFilterDebounceEnabled(true);
    }
  }, [filterDebounceEnabled, isFetching, localStats, debouncedLocalStats]);

  const statsData: IResponseStats = { ...stats, values: values ?? {} };

  return (
    <StyledStatsLayout $height={height}>
      <StyledStatsHeader>
        Statistics for current search results
        {typeof total === "number" ? ` — ${total} entities` : ""}
      </StyledStatsHeader>

      <StyledConfigStrip>
        <StyledField>
          <StyledFieldLabel>From</StyledFieldLabel>
          <StyledDateInputWrapper>
            <Input
              type="datetime-local"
              width={150}
              value={toDateTimeInput(localStats.fromDate)}
              onChangeFn={(value) => value && setParams({ fromDate: new Date(value).getTime() })}
            />
            <Button
              icon={<FaUndo />}
              onClick={() => setParams({ fromDate: defaultExploreStatsParams.fromDate })}
              color="primary"
              inverted
              noBackground
              tooltipLabel="Reset to since forever"
              disabled={localStats.fromDate === defaultExploreStatsParams.fromDate}
            />
          </StyledDateInputWrapper>
        </StyledField>

        <StyledField>
          <StyledFieldLabel>To</StyledFieldLabel>
          <StyledDateInputWrapper>
            <Input
              type="datetime-local"
              width={150}
              value={toDateTimeInput(localStats.toDate)}
              onChangeFn={(value) => value && setParams({ toDate: new Date(value).getTime() })}
            />
            <Button
              icon={<FaUndo />}
              onClick={() => setParams({ toDate: new Date().getTime() })}
              color="primary"
              inverted
              noBackground
              tooltipLabel="Reset to until now"
            />
          </StyledDateInputWrapper>
        </StyledField>

        <StyledField>
          <StyledFieldLabel>Time Unit</StyledFieldLabel>
          <ButtonGroup $noMarginRight>
            {Object.values(TimeUnit).map((unit) => (
              <Button
                key={unit}
                label={String(unit)}
                onClick={() => setParams({ timeUnit: unit })}
                color={localStats.timeUnit === unit ? "primary" : "grey"}
              />
            ))}
          </ButtonGroup>
        </StyledField>

        <StyledField>
          <StyledFieldLabel>Event type</StyledFieldLabel>
          <ButtonGroup $noMarginRight>
            {VISIBLE_EVENT_TYPES.map((eventType) => {
              const active = localStats.eventType.includes(eventType);
              return (
                <Button
                  key={eventType}
                  label={String(eventType)}
                  onClick={() =>
                    setParams({
                      eventType: active
                        ? localStats.eventType.filter((t) => t !== eventType)
                        : [...localStats.eventType, eventType],
                    })
                  }
                  color={active ? "primary" : "grey"}
                />
              );
            })}
          </ButtonGroup>
        </StyledField>

        <StyledField>
          <StyledFieldLabel>Aggregate By</StyledFieldLabel>
          <ButtonGroup $noMarginRight>
            {Object.values(Aggregation).map((agg) => (
              <Button
                key={agg}
                label={String(agg)}
                onClick={() => setParams({ aggregateBy: agg })}
                color={localStats.aggregateBy === agg ? "primary" : "grey"}
              />
            ))}
          </ButtonGroup>
        </StyledField>
      </StyledConfigStrip>

      <StyledChartWrapper ref={chartRef}>
        <StatsChart
          data={statsData}
          width={chartWidth ? Math.max(0, chartWidth - 20) : 0}
          height={chartHeight ? Math.max(0, chartHeight) : 0}
        />
      </StyledChartWrapper>

      <StyledTableWrapper ref={tableRef}>
        <StatsTable
          data={statsData}
          width={tableWidth ? Math.max(0, tableWidth - 20) : 0}
          height={tableHeight ? Math.max(0, tableHeight) : 0}
        />
      </StyledTableWrapper>

      <Loader show={isFetching} />
    </StyledStatsLayout>
  );
};
