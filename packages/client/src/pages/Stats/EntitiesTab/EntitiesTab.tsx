import { IRequestStats, IResponseStats } from "@shared/types";
import { Aggregation, EventType, TimeUnit } from "@shared/types/stats";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Input, Loader, Timestamp } from "components";
import { useResizeObserver } from "hooks";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { FaCalendarPlus, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { USER_THRESHOLD_MAX } from "../constants";
import {
  StyledDateInputWrapper,
  StyledEntitiesLayout,
  StyledField,
  StyledFieldGroup,
  StyledFieldLabel,
  StyledResultsChart,
  StyledResultsTable,
} from "../StatsPageStyles";
import { initialState, statsReducer } from "../store";
import { applyUserThreshold, datePickerToIso, isoToDatePicker } from "../utils";
import { StatsChart } from "./StatsChart/StatsChart";
import { StatsTable } from "./StatsTable/StatsTable";

export const EntitiesTab: React.FC = () => {
  const [state, dispatch] = useReducer(statsReducer, initialState);

  const queryClient = useQueryClient();
  // Update timeTo to current time when navigating to this page to correctly refresh the data
  useEffect(() => {
    dispatch({
      type: "dateToUpdate",
      payload: new Date().toISOString(),
    });
  }, []);

  // Helper function to update timeTo to current time
  const updateToCurrentTime = () => {
    dispatch({
      type: "dateToUpdate",
      payload: new Date().toISOString(),
    });
  };

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

  // Manual aggregation via mutation (triggered on demand)
  type StatsAggregateResponse = { message: string };
  const { mutateAsync: aggregateMutateAsync, isPending: isAggregating } =
    useMutation<StatsAggregateResponse, Error, void>({
      mutationFn: async () => {
        const response = await api.statsAggregate({
          fromDate: new Date(state.dateFrom).getTime(),
          toDate: new Date(state.dateTo).getTime(),
          timeUnits: [state.timeUnit],
          aggregateBy: [state.aggregate],
        });
        return response.data as StatsAggregateResponse;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      },
      onError: () => {},
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

  const {
    data: dataStats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
  } = useQuery({
    queryKey: ["stats", statsRequest, state.useMaterialized],
    queryFn: async () => {
      const response = state.useMaterialized
        ? await api.statsMaterializedGet(statsRequest)
        : await api.statsGet(statsRequest);
      return response.data;
    },
  });

  useEffect(() => {
    if (dataStats) {
      if (state.aggregate === Aggregation.USER && dataStats.values) {
        const values = applyUserThreshold(
          dataStats.values,
          usersIgnoreBelowValue
        );
        setData({ ...dataStats, values });
      } else {
        setData(dataStats);
      }
    } else if (!isLoadingStats) {
      setData(undefined);
    }
  }, [dataStats, usersIgnoreBelowValue, state.aggregate, isLoadingStats]);

  const isError = isErrorStats && !isLoadingStats;
  const isNoData = !isLoadingStats && !isErrorStats && !data;

  useEffect(() => {
    if (isError) {
      toast.error("Error loading stats");
    }
  }, [isError]);

  // get user data
  const userId = localStorage.getItem("userid");
  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await api.usersGet(userId as string);
      return res.data ?? undefined;
    },
    enabled: !!userId && api.isLoggedIn(),
  });

  const allowMaterializedStats = user?.options.allowMaterializedStats ?? false;

  return (
    <>
      {/* {allowMaterializedStats && (
        <span style={{ display: "flex", zIndex: 30, marginRight: "4rem" }}>
          <AttributeButtonGroup
            noMargin
            options={[
              {
                icon: <FaSyncAlt size={10} />,
                longValue: "Classic (Live Data)",
                shortValue: "Classic",
                onClick: () => {
                  dispatch({
                    type: "useMaterializedUpdate",
                    payload: false,
                  });
                },
                selected: !state.useMaterialized,
              },
              {
                icon: <FaDatabase />,
                longValue: "Fast (Pre-calculated)",
                shortValue: "Fast",
                onClick: () => {
                  dispatch({
                    type: "useMaterializedUpdate",
                    payload: true,
                  });
                },
                selected: state.useMaterialized,
              },
            ]}
          />
        </span>
      )} */}
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
                  type="date"
                  value={isoToDatePicker(state.dateFrom)}
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
                  type="date"
                  value={isoToDatePicker(state.dateTo)}
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
                    updateToCurrentTime();
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
              {Object.values(EventType).map((eventType) => (
                <Button
                  key={eventType}
                  label={String(eventType)}
                  onClick={() => {
                    dispatch({
                      type: "eventTypeUpdate",
                      payload: eventType,
                    });
                  }}
                  color={
                    state.eventType.includes(eventType) ? "primary" : "grey"
                  }
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
            label={state.useMaterialized ? "Aggregate" : "Refresh"}
            disabled={isLoadingStats || isAggregating}
            onClick={
              state.useMaterialized
                ? () => void aggregateMutateAsync()
                : updateToCurrentTime
            }
          />
        </StyledFieldGroup>

        {data && (
          <>
            <StyledResultsChart ref={chartRef}>
              <StatsChart
                data={data}
                height={chartHeight ? Math.max(0, chartHeight) : 0}
                width={chartWidth ? Math.max(0, chartWidth - 50) : 0}
                request={statsRequest}
              />
            </StyledResultsChart>
            <StyledResultsTable ref={tableRef}>
              <StatsTable
                data={data}
                height={tableHeight ? Math.max(0, tableHeight) : 0}
                width={tableWidth ? Math.max(0, tableWidth - 50) : 0}
                request={statsRequest}
              />
            </StyledResultsTable>
          </>
        )}

        <Loader show={isLoadingStats || isAggregating} />
      </StyledEntitiesLayout>
    </>
  );
};
