import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";

import { IRequestStats, IResponseStats } from "@shared/types";
import { Aggregation, EventType, TimeUnit } from "@shared/types/stats";
import { Button, ButtonGroup, Checkbox, Input, Loader } from "components";
import { useEffect, useMemo, useReducer, useState } from "react";
import { useAppSelector } from "redux/hooks";
import {
  FaCalendarPlus,
  FaDatabase,
  FaSync,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";
import { USER_THRESHOLD_MAX } from "./constants";
import { StatsChart } from "./StatsChart/StatsChart";
import { StatsTable } from "./StatsTable/StatsTable";
import { initialState, statsReducer } from "./store";
import { applyUserThreshold } from "./utils";

// Helper functions for date conversion
const isoToDatePicker = (isoString: string): string => {
  return new Date(isoString).toISOString().split("T")[0];
};

const datePickerToIso = (dateString: string): string => {
  return new Date(dateString).toISOString();
};

import {
  StyledContainer,
  StyledDateInputWrapper,
  StyledEndpointStatus,
  StyledField,
  StyledFieldGroup,
  StyledFieldLabel,
  StyledFieldLValueSmall,
  StyledHeader,
  StyledHeading,
  StyledResponseSection,
  StyledResultsChart,
  StyledResultsTable,
  StyledStyledQueryState,
} from "./StatsPageStyles";
import { AttributeButtonGroup } from "components/advanced/AttributeButtonGroup/AttributeButtonGroup";
import { useResizeObserver } from "hooks";

export const StatsPage = () => {
  const client = useQueryClient();
  const [state, dispatch] = useReducer(statsReducer, initialState);

  // const [windowWidth, windowHeight] = useWindowSize();
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  const [usersIgnoreBelowValue, setUsersIgnoreBelowValue] = useState<number>(0);

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
      onSuccess: (data) => {
        client.invalidateQueries({ queryKey: ["stats"] });
      },
      onError: (error) => {},
    });

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

  const [data, setData] = useState<IResponseStats | undefined>(undefined);

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

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledHeading>Statistics</StyledHeading>

        <ButtonGroup>
          <span>
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

          <Button
            color="success"
            label="Refresh"
            disabled={isLoadingStats || isAggregating}
            onClick={
              state.useMaterialized
                ? () => void aggregateMutateAsync()
                : updateToCurrentTime
            }
          />
        </ButtonGroup>
      </StyledHeader>

      <StyledFieldGroup>
        {/* Date From */}
        <StyledField>
          <StyledFieldLabel>Date From</StyledFieldLabel>
          {!state.showDateFromRangePicker ? (
            <StyledDateInputWrapper>
              <StyledFieldLValueSmall>Since Forever</StyledFieldLValueSmall>
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
          <StyledFieldLabel>Date To</StyledFieldLabel>
          {!state.showDateToRangePicker ? (
            <StyledDateInputWrapper>
              <StyledFieldLValueSmall>Until Now</StyledFieldLValueSmall>
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
                onClick={() =>
                  dispatch({
                    type: "showDateToRangePickerUpdate",
                    payload: false,
                  })
                }
                color="primary"
                inverted
                tooltipLabel="Reset to Until Now"
                noBackground
              />
            </StyledDateInputWrapper>
          )}
        </StyledField>

        <StyledField>
          <StyledFieldLabel>Time Unit</StyledFieldLabel>
          <ButtonGroup $marginTop $noMarginRight>
            {Object.values(TimeUnit).map((unit) => (
              <Button
                key={unit}
                label={String(unit)}
                onClick={() => {
                  dispatch({
                    type: "timeUnitUpdate",
                    payload: unit as TimeUnit,
                  });
                  updateToCurrentTime();
                }}
                color={state.timeUnit === unit ? "primary" : "grey"}
              />
            ))}
          </ButtonGroup>
        </StyledField>

        <StyledField>
          <StyledFieldLabel>Event type</StyledFieldLabel>
          <ButtonGroup $marginTop $noMarginRight>
            {Object.values(EventType).map((eventType) => (
              <Button
                key={eventType}
                label={String(eventType)}
                onClick={() => {
                  dispatch({
                    type: "eventTypeUpdate",
                    payload: eventType,
                  });
                  updateToCurrentTime();
                }}
                color={state.eventType.includes(eventType) ? "primary" : "grey"}
              />
            ))}
          </ButtonGroup>
        </StyledField>

        <StyledField>
          <StyledFieldLabel>Aggregate By</StyledFieldLabel>
          <ButtonGroup $marginTop $noMarginRight>
            {Object.values(Aggregation).map((agg) => (
              <Button
                key={agg}
                label={String(agg)}
                onClick={() => {
                  dispatch({ type: "aggregateUpdate", payload: agg });
                  updateToCurrentTime();
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
      </StyledFieldGroup>

      {/* <StyledResponseSection> */}
      {/* {isError && <StyledStyledQueryState>Error</StyledStyledQueryState>} */}
      {/* {isNoData && <StyledStyledQueryState>No data</StyledStyledQueryState>} */}
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
      {/* </StyledResponseSection> */}

      <Loader show={isLoadingStats} />
    </StyledContainer>
  );
};
