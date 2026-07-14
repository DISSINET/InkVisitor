import { IRequestStats, IResponseStats } from "@inkvisitor/shared/types";
import { Aggregation, EventType, TimeUnit } from "@inkvisitor/shared/types/stats";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Input, Loader, SwitchGroup, Timestamp } from "components";
import { StatsChart, StatsTable } from "components/advanced";
import { useDebounce, useResizeObserver } from "hooks";
import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { FaCalendarPlus, FaUndo } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  AGGREGATION_LABELS,
  EVENT_TYPE_GROUPS,
  STATS_FILTER_DEBOUNCE_MS,
  USER_THRESHOLD_MAX,
  VISIBLE_EVENT_TYPES,
} from "../constants";
import {
  StyledDateInputWrapper,
  StyledEntitiesLayout,
  StyledEventTypeGroup,
  StyledEventTypeGroupLegend,
  StyledEventTypeGroups,
  StyledEventTypeSubLabel,
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

interface EntitiesTab {
  /** Event types selectable in this tab; also the initial selection. */
  eventTypes?: EventType[];
}

export const EntitiesTab: React.FC<EntitiesTab> = ({ eventTypes = VISIBLE_EVENT_TYPES }) => {
  const [state, dispatch] = useReducer(statsReducer, eventTypes, createEntitiesTabState);
  const [filterDebounceEnabled, setFilterDebounceEnabled] = useState(false);

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

  // groups restricted to the event types selectable in this tab
  const eventTypeGroups = useMemo(
    () =>
      EVENT_TYPE_GROUPS.map((group) => ({
        ...group,
        subgroups: group.subgroups
          .map((subgroup) => ({
            ...subgroup,
            types: subgroup.types.filter(({ type }) => eventTypes.includes(type)),
          }))
          .filter((subgroup) => subgroup.types.length > 0),
      })).filter((group) => group.subgroups.length > 0),
    [eventTypes],
  );

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
                        new Date().setFullYear(new Date().getFullYear() - 5),
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
                  width={150}
                  value={isoToDatetimePicker(state.dateFrom)}
                  onChangeFn={(value) =>
                    dispatch({
                      type: "dateFromUpdate",
                      payload: value
                        ? datePickerToIso(value)
                        : new Date("2000-01-01").toISOString(),
                    })
                  }
                />
                <Button
                  icon={<FaUndo />}
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
                  width={150}
                  value={isoToDatetimePicker(state.dateTo)}
                  onChangeFn={(value) =>
                    dispatch({
                      type: "dateToUpdate",
                      payload: value ? datePickerToIso(value) : new Date().toISOString(),
                    })
                  }
                />
                <Button
                  icon={<FaUndo />}
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
            <SwitchGroup>
              {Object.values(TimeUnit).map((unit) => (
                <Button
                  key={unit}
                  label={String(unit)}
                  shape="rounded-sm"
                  noBorder
                  onClick={() => {
                    dispatch({
                      type: "timeUnitUpdate",
                      payload: unit as TimeUnit,
                    });
                  }}
                  color={state.timeUnit === unit ? "primary" : "greyer"}
                  inverted={state.timeUnit !== unit}
                  noBackground={state.timeUnit !== unit}
                />
              ))}
            </SwitchGroup>
          </StyledField>

          <StyledField>
            <StyledFieldLabel>Event type</StyledFieldLabel>
            <StyledEventTypeGroups>
              {eventTypeGroups.map((group) => {
                const groupTypes = group.subgroups.flatMap((subgroup) =>
                  subgroup.types.map(({ type }) => type),
                );
                const allActive = groupTypes.every((type) =>
                  state.eventType.includes(type),
                );
                const someActive = groupTypes.some((type) =>
                  state.eventType.includes(type),
                );
                return (
                  <StyledEventTypeGroup key={group.label}>
                    <StyledEventTypeGroupLegend
                      $active={someActive}
                      title={
                        allActive
                          ? `hide all ${group.label} events`
                          : `show all ${group.label} events`
                      }
                      onClick={() => {
                        dispatch({
                          type: "eventTypeGroupUpdate",
                          payload: {
                            types: groupTypes,
                            active: !allActive,
                          },
                        });
                      }}
                    >
                      {group.label}
                    </StyledEventTypeGroupLegend>
                    {group.subgroups.map((subgroup, subgroupIndex) => {
                      const subgroupTypes = subgroup.types.map(({ type }) => type);
                      const allSubActive = subgroupTypes.every((type) =>
                        state.eventType.includes(type),
                      );
                      const someSubActive = subgroupTypes.some((type) =>
                        state.eventType.includes(type),
                      );
                      return (
                        <React.Fragment key={subgroup.label ?? subgroupIndex}>
                          {subgroup.label && (
                            <StyledEventTypeSubLabel
                              $active={someSubActive}
                              title={
                                allSubActive
                                  ? `hide all ${subgroup.label} events`
                                  : `show all ${subgroup.label} events`
                              }
                              onClick={() => {
                                dispatch({
                                  type: "eventTypeGroupUpdate",
                                  payload: {
                                    types: subgroupTypes,
                                    active: !allSubActive,
                                  },
                                });
                              }}
                            >
                              {subgroup.label}:
                            </StyledEventTypeSubLabel>
                          )}
                          {subgroup.types.map(({ type, label }) => (
                            <Button
                              key={type}
                              label={label}
                              shape="rounded-sm"
                              noBorder
                              onClick={() => {
                                dispatch({
                                  type: "eventTypeUpdate",
                                  payload: type,
                                });
                              }}
                              color={state.eventType.includes(type) ? "primary" : "greyer"}
                              inverted={!state.eventType.includes(type)}
                              noBackground={!state.eventType.includes(type)}
                            />
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </StyledEventTypeGroup>
                );
              })}
            </StyledEventTypeGroups>
          </StyledField>

          <StyledField>
            <StyledFieldLabel>Aggregate By</StyledFieldLabel>
            <SwitchGroup>
              {Object.values(Aggregation).map((agg) => (
                <Button
                  key={agg}
                  label={AGGREGATION_LABELS[agg]}
                  shape="rounded-sm"
                  noBorder
                  onClick={() => {
                    dispatch({ type: "aggregateUpdate", payload: agg });
                  }}
                  color={state.aggregate === agg ? "primary" : "greyer"}
                  inverted={state.aggregate !== agg}
                  noBackground={state.aggregate !== agg}
                />
              ))}
            </SwitchGroup>
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
                    Math.max(0, Number.isFinite(num) ? num : 0),
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
