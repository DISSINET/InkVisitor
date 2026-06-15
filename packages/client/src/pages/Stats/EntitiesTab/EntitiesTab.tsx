import { IRequestStats, IResponseStats } from "@inkvisitor/shared/types";
import { Aggregation, TimeUnit } from "@inkvisitor/shared/types/stats";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Input, Loader, Timestamp } from "components";
import { useDebounce, useResizeObserver } from "hooks";
import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { FaCalendarPlus, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { STATS_FILTER_DEBOUNCE_MS, USER_THRESHOLD_MAX, VISIBLE_EVENT_TYPES } from "../constants";
import {
  StyledDateInputWrapper,
  StyledEntitiesLayout,
  StyledField,
  StyledFieldGroup,
  StyledFieldLabel,
  StyledResultsChart,
  StyledResultsTable,
} from "../StatsPageStyles";
import { createEntitiesTabState, statsReducer } from "../store";
import {
  applyUserThreshold,
  areStatsRequestsEqual,
  datePickerToIso,
  isoToDatetimePicker,
} from "../utils";
import { StatsChart, StatsTable } from "components/advanced";
import { useUserQuery } from "hooks/react-query";

export const EntitiesTab: React.FC = () => {
  const [state, dispatch] = useReducer(statsReducer, undefined, createEntitiesTabState);
  const [filterDebounceEnabled, setFilterDebounceEnabled] = useState(false);

  const queryClient = useQueryClient();

  const fetchStats = useCallback(async (request: IRequestStats, useMaterialized: boolean) => {
    const response = useMaterialized
      ? await api.statsMaterializedGet(request)
      : await api.statsGet(request);
    return response.data;
  }, []);

  const {
    ref: chartRef,
    width: chartWidth,
    height: chartHeight,
  } = useResizeObserver<HTMLDivElement>({
    debounceDelay: 50,
  });
  const {
    ref: tableRef,
    width: tableWidth,
    height: tableHeight,
  } = useResizeObserver<HTMLDivElement>({
    debounceDelay: 50,
  });

  const [usersIgnoreBelowValue, setUsersIgnoreBelowValue] = useState<number>(0);

  const [data, setData] = useState<IResponseStats | undefined>(undefined);

  const statsRequest = useMemo<IRequestStats>(() => {
    return {
      fromDate: new Date(state.dateFrom).getTime(),
      toDate: new Date(state.dateTo).getTime(),
      timeUnit: state.timeUnit,
      aggregateBy: state.aggregate,
      eventType: state.eventType,
      filter: {
        userIds: "all",
        editActivities: {
          entities: true,
          relationsMeta: true,
          relationsStatement: true,
          propsMeta: true,
          propsStatement: true,
          references: true,
          tags: true,
        },
        entityTypes: "all",
        relationTypes: "all",
      },
    };
  }, [state]);

  const debouncedStatsRequest = useDebounce(statsRequest, STATS_FILTER_DEBOUNCE_MS);

  const queryStatsRequest = filterDebounceEnabled ? debouncedStatsRequest : statsRequest;

  const {
    data: dataStats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    isFetched: isFetchedStats,
  } = useQuery({
    queryKey: ["stats", queryStatsRequest],
    queryFn: () => api.statsGet(queryStatsRequest),
  });

  useEffect(() => {
    if (filterDebounceEnabled) {
      return;
    }
    if (!isFetchedStats) {
      return;
    }
    if (areStatsRequestsEqual(statsRequest, debouncedStatsRequest)) {
      setFilterDebounceEnabled(true);
    }
  }, [filterDebounceEnabled, isFetchedStats, statsRequest, debouncedStatsRequest]);

  const refreshStats = () => {
    setFilterDebounceEnabled(false);
    dispatch({ type: "dateToUpdate", payload: new Date().toISOString() });
  };

  useEffect(() => {
    if (dataStats) {
      if (queryStatsRequest.aggregateBy === Aggregation.USER && dataStats.data.values) {
        const values = applyUserThreshold(dataStats.data.values, usersIgnoreBelowValue);
        setData({ ...dataStats.data, values });
      } else {
        setData(dataStats.data);
      }
    } else if (!isLoadingStats) {
      setData(undefined);
    }
  }, [dataStats, usersIgnoreBelowValue, queryStatsRequest.aggregateBy, isLoadingStats]);

  const isError = isErrorStats && !isLoadingStats;
  const isNoData = !isLoadingStats && !isErrorStats && !data;

  useEffect(() => {
    if (isError) {
      toast.error("Error loading stats");
    }
  }, [isError]);

  // get user data
  // const { data: user } = useUserQuery();

  return (
    <>
      <StyledEntitiesLayout>
        <StyledFieldGroup $columnCount={2}>
          {/* Date From */}
          <StyledField>
            <StyledFieldLabel>From Date</StyledFieldLabel>
            {!state.showDateFromRangePicker ? (
              <StyledDateInputWrapper>
                <Timestamp label="From" value={state.dateFrom} />
                <Button
                  icon={<FaCalendarPlus />}
                  onClick={() => {
                    dispatch({
                      type: "showDateFromRangePickerUpdate",
                      payload: true,
                    });
                    dispatch({
                      type: "dateFromUpdate",
                      payload: new Date(
                        new Date().setFullYear(new Date().getFullYear() - 5)
                      ).toISOString(),
                    });
                  }}
                  color="primary"
                  inverted
                  tooltipLabel="Add custom date from"
                  noBorder
                  noBackground
                />
              </StyledDateInputWrapper>
            ) : (
              <StyledDateInputWrapper>
                <Input
                  type="datetime-local"
                  value={isoToDatetimePicker(state.dateFrom)}
                  onChangeFn={(value) =>
                    dispatch({
                      type: "dateFromUpdate",
                      payload: datePickerToIso(value),
                    })
                  }
                />
                <Button
                  icon={<FaTimes />}
                  onClick={() => {
                    dispatch({
                      type: "showDateFromRangePickerUpdate",
                      payload: false,
                    });
                    dispatch({
                      type: "dateFromUpdate",
                      payload: new Date("2000-01-01").toISOString(),
                    });
                  }}
                  color="primary"
                  inverted
                  tooltipLabel="Reset to Since Forever"
                  noBackground
                />
              </StyledDateInputWrapper>
            )}
          </StyledField>

          {/* Date To */}
          <StyledField>
            <StyledFieldLabel>To Date</StyledFieldLabel>
            {!state.showDateToRangePicker ? (
              <StyledDateInputWrapper>
                <Timestamp label="To" value={state.dateTo} />
                <Button
                  icon={<FaCalendarPlus />}
                  onClick={() => {
                    dispatch({
                      type: "dateToUpdate",
                      payload: new Date().toISOString(),
                    });
                    dispatch({
                      type: "showDateToRangePickerUpdate",
                      payload: true,
                    });
                  }}
                  color="primary"
                  inverted
                  tooltipLabel="Add custom date to"
                  noBorder
                  noBackground
                />
              </StyledDateInputWrapper>
            ) : (
              <StyledDateInputWrapper>
                <Input
                  type="datetime-local"
                  value={isoToDatetimePicker(state.dateTo)}
                  onChangeFn={(value) =>
                    dispatch({
                      type: "dateToUpdate",
                      payload: datePickerToIso(value),
                    })
                  }
                />
                <Button
                  icon={<FaTimes />}
                  onClick={() => {
                    dispatch({
                      type: "showDateToRangePickerUpdate",
                      payload: false,
                    });
                    refreshStats();
                  }}
                  color="primary"
                  inverted
                  tooltipLabel="Reset to Until Now"
                  noBackground
                />
              </StyledDateInputWrapper>
            )}
          </StyledField>
        </StyledFieldGroup>

        <StyledFieldGroup style={{ marginBottom: "1rem" }}>
          <StyledField>
            <StyledFieldLabel>Time Unit</StyledFieldLabel>
            <ButtonGroup $noMarginRight>
              {Object.values(TimeUnit).map((unit) => (
                <Button
                  key={unit}
                  label={String(unit)}
                  onClick={() => {
                    dispatch({
                      type: "timeUnitUpdate",
                      payload: unit as TimeUnit,
                    });
                  }}
                  color={state.timeUnit === unit ? "primary" : "grey"}
                />
              ))}
            </ButtonGroup>
          </StyledField>

          <StyledField>
            <StyledFieldLabel>Event type</StyledFieldLabel>
            <ButtonGroup $noMarginRight>
              {VISIBLE_EVENT_TYPES.map((eventType) => (
                <Button
                  key={eventType}
                  label={String(eventType)}
                  onClick={() => {
                    dispatch({
                      type: "eventTypeUpdate",
                      payload: eventType,
                    });
                  }}
                  color={state.eventType.includes(eventType) ? "primary" : "grey"}
                />
              ))}
            </ButtonGroup>
          </StyledField>

          <StyledField>
            <StyledFieldLabel>Aggregate By</StyledFieldLabel>
            <ButtonGroup $noMarginRight>
              {Object.values(Aggregation).map((agg) => (
                <Button
                  key={agg}
                  label={String(agg)}
                  onClick={() => {
                    dispatch({ type: "aggregateUpdate", payload: agg });
                  }}
                  color={state.aggregate === agg ? "primary" : "grey"}
                />
              ))}
            </ButtonGroup>
          </StyledField>
          {state.aggregate === Aggregation.USER && (
            <StyledField>
              <StyledFieldLabel>Ignore users below %</StyledFieldLabel>
              <Input
                type="number"
                value={String(usersIgnoreBelowValue)}
                onChangeFn={(value) => {
                  const num = Number(value);
                  const safe = Math.min(
                    USER_THRESHOLD_MAX,
                    Math.max(0, Number.isFinite(num) ? num : 0)
                  );
                  setUsersIgnoreBelowValue(safe);
                }}
                changeOnType
                min={0}
                max={USER_THRESHOLD_MAX}
              />
            </StyledField>
          )}

          <Button
            color="success"
            label={"Refresh"}
            disabled={isLoadingStats}
            onClick={refreshStats}
          />
        </StyledFieldGroup>

        {data && (
          <>
            <StyledResultsChart ref={chartRef}>
              <StatsChart
                data={data}
                height={chartHeight ? Math.max(0, chartHeight) : 0}
                width={chartWidth ? Math.max(0, chartWidth - 50) : 0}
              />
            </StyledResultsChart>
            <StyledResultsTable ref={tableRef}>
              <StatsTable
                data={data}
                height={tableHeight ? Math.max(0, tableHeight) : 0}
                width={tableWidth ? Math.max(0, tableWidth - 50) : 0}
              />
            </StyledResultsTable>
          </>
        )}

        <Loader show={isLoadingStats} />
      </StyledEntitiesLayout>
    </>
  );
};
