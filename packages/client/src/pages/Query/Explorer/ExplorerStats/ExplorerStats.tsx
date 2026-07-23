import { IResponseStats } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { Aggregation, EventType, TimeUnit } from "@inkvisitor/shared/types/stats";
import { StatsChart, StatsTable } from "components/advanced";
import { Button, ButtonGroup, Loader } from "components";
import { useResizeObserver } from "hooks";
import React, { useEffect, useState } from "react";
import { RELATION_EVENT_TYPES } from "pages/Stats/constants";
import { ExploreAction, ExploreActionType } from "../state";
// --- Parked time filter (see the commented From/To block below) ---
// import { Input } from "components";
// import { FaUndo } from "react-icons/fa";
// import { defaultExploreStatsParams } from "../state";
import {
  StyledChartWrapper,
  StyledConfigStrip,
  StyledEmptyMessage,
  StyledField,
  StyledFieldLabel,
  StyledStatsHeader,
  StyledStatsLayout,
  StyledTableWrapper,
  // StyledDateInputWrapper, // parked time filter
} from "./ExplorerStatsStyles";

/**
 * Event types hidden from the stats config (paired deletion markers, plus
 * relation types - the explorer stats are entity-scoped so relation audits
 * never appear here).
 */
const HIDDEN_EVENT_TYPES: EventType[] = [
  EventType.ANCHOR_ADD,
  EventType.ANCHOR_DELETE,
  EventType.ANCHOR_EDIT,
  EventType.TEXT_EDIT,
  ...RELATION_EVENT_TYPES,
];
const VISIBLE_EVENT_TYPES = Object.values(EventType).filter(
  (type) => !HIDDEN_EVENT_TYPES.includes(type),
);

// Parked with the time filter below. Formats a timestamp into the local
// "YYYY-MM-DDTHH:mm" value expected by a datetime picker, so the displayed time
// matches the user's timezone.
// const toDateTimeInput = (ms: number): string => {
//   const date = new Date(ms);
//   const pad = (value: number) => String(value).padStart(2, "0");
//   return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
//     date.getDate(),
//   )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
// };

const areExploreStatsParamsEqual = (
  a: Explore.IExploreStatsParams,
  b: Explore.IExploreStatsParams,
): boolean =>
  // a.fromDate === b.fromDate && // parked time filter
  // a.toDate === b.toDate && // parked time filter
  a.timeUnit === b.timeUnit &&
  a.aggregateBy === b.aggregateBy &&
  a.eventType.length === b.eventType.length &&
  a.eventType.every((event, index) => event === b.eventType[index]);

interface ExplorerStatsProps {
  stats: Explore.IExploreStatsParams;
  dispatch: React.Dispatch<ExploreAction>;
  values: Record<string, Record<string, number>> | undefined;
  /** Size of the whole filtered result the stats relate to. */
  total: number | undefined;
  /** Server cap on how many entities the stats are actually computed over. */
  statsEntityLimit: number | undefined;
  /** True when no search criteria are set, so no query is fired. */
  isRequestEmpty: boolean;
  /** True when criteria are set but the search has not been run yet. */
  isSearchPending?: boolean;
  isFetching: boolean;
  height: number;
}

export const ExplorerStats: React.FC<ExplorerStatsProps> = ({
  stats,
  dispatch,
  values,
  total,
  statsEntityLimit,
  isRequestEmpty,
  isSearchPending = false,
  isFetching,
  height,
}) => {
  const [localStats, setLocalStats] = useState(stats);

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

  // Push filter changes to explore state immediately (not debounced): the search
  // only fires on an explicit run, and a pending debounce would leave the
  // committed search signature stale, so the first Enter would show results that
  // then vanish behind another "press Enter" prompt.
  useEffect(() => {
    if (areExploreStatsParamsEqual(localStats, stats)) {
      return;
    }
    dispatch({ type: ExploreActionType.setStatsParams, payload: localStats });
  }, [localStats, stats, dispatch]);

  // StatsChart / StatsTable only read `values`; the date window is not part of
  // the explorer stats params, so the IResponseStats date fields are placeholders.
  const statsData: IResponseStats = {
    fromDate: 0,
    toDate: 0,
    timeUnit: stats.timeUnit,
    eventType: stats.eventType,
    aggregateBy: stats.aggregateBy,
    values: values ?? {},
  };

  const limitReached =
    typeof total === "number" && typeof statsEntityLimit === "number" && total > statsEntityLimit;

  if (isRequestEmpty) {
    return (
      <StyledStatsLayout $height={height}>
        <StyledEmptyMessage>
          Create a query or add a search filter first to see statistics for the matching entities.
        </StyledEmptyMessage>
      </StyledStatsLayout>
    );
  }

  if (isSearchPending) {
    return (
      <StyledStatsLayout $height={height}>
        <StyledEmptyMessage>
          Run the search to see statistics for the matching entities. (Enter)
        </StyledEmptyMessage>
      </StyledStatsLayout>
    );
  }

  return (
    <StyledStatsLayout $height={height}>
      <StyledStatsHeader>
        Statistics for current search results
        {typeof total === "number" ? ` — ${total} entities` : ""}
        {limitReached ? ` (showing stats for the first ${statsEntityLimit})` : ""}
      </StyledStatsHeader>

      <StyledConfigStrip>
        {/*
          Parked time filter. The audit query over a user-chosen [from, to]
          window is too slow without an index on the audit date/modelId (it can
          saturate the db pool), so the From/To controls are disabled for now.
          Re-enable when the audits are indexed or moved to a faster DB.
          To restore: uncomment the imports, toDateTimeInput, the fromDate/toDate
          lines in areExploreStatsParamsEqual, the block below, and
          defaultExploreStatsParams.fromDate/toDate in Explorer/state.ts.

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
        */}

        <StyledField>
          <StyledFieldLabel>Time Unit</StyledFieldLabel>
          <ButtonGroup $gap="no">
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
          <ButtonGroup $gap="no">
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
          <ButtonGroup $gap="no">
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
