import { IResponseStats } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { Aggregation, EventType, TimeUnit } from "@inkvisitor/shared/types/stats";
import { StatsChart, StatsTable } from "components/advanced";
import { Button, ButtonGroup, Input, Loader } from "components";
import { useResizeObserver } from "hooks";
import React from "react";
import { ExploreAction, ExploreActionType } from "../state";
import {
  StyledChartWrapper,
  StyledConfigStrip,
  StyledField,
  StyledFieldLabel,
  StyledStatsHeader,
  StyledStatsLayout,
  StyledTableWrapper,
} from "./ExplorerStatsStyles";

/** Event types hidden from the stats config (paired deletion markers). */
const HIDDEN_EVENT_TYPES: EventType[] = [
  EventType.DELETE,
  EventType.ANCHOR_DELETE,
];
const VISIBLE_EVENT_TYPES = Object.values(EventType).filter(
  (type) => !HIDDEN_EVENT_TYPES.includes(type)
);

const toDateInput = (ms: number): string =>
  new Date(ms).toISOString().split("T")[0];

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
    dispatch({ type: ExploreActionType.setStatsParams, payload: params });
  };

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
          <Input
            type="date"
            value={toDateInput(stats.fromDate)}
            onChangeFn={(value) =>
              setParams({ fromDate: new Date(value).getTime() })
            }
          />
        </StyledField>

        <StyledField>
          <StyledFieldLabel>To</StyledFieldLabel>
          <Input
            type="date"
            value={toDateInput(stats.toDate)}
            onChangeFn={(value) =>
              setParams({ toDate: new Date(value).getTime() })
            }
          />
        </StyledField>

        <StyledField>
          <StyledFieldLabel>Time Unit</StyledFieldLabel>
          <ButtonGroup $noMarginRight>
            {Object.values(TimeUnit).map((unit) => (
              <Button
                key={unit}
                label={String(unit)}
                onClick={() => setParams({ timeUnit: unit })}
                color={stats.timeUnit === unit ? "primary" : "grey"}
              />
            ))}
          </ButtonGroup>
        </StyledField>

        <StyledField>
          <StyledFieldLabel>Event type</StyledFieldLabel>
          <ButtonGroup $noMarginRight>
            {VISIBLE_EVENT_TYPES.map((eventType) => {
              const active = stats.eventType.includes(eventType);
              return (
                <Button
                  key={eventType}
                  label={String(eventType)}
                  onClick={() =>
                    setParams({
                      eventType: active
                        ? stats.eventType.filter((t) => t !== eventType)
                        : [...stats.eventType, eventType],
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
                color={stats.aggregateBy === agg ? "primary" : "grey"}
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
