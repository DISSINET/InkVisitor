import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";

import { IRequestStats, IResponseStats } from "@shared/types";
import { Aggregation, EventType, TimeUnit } from "@shared/types/stats";
import { Button, ButtonGroup, Checkbox, Input, Loader } from "components";
import { useEffect, useMemo, useReducer, useState } from "react";
import { useAppSelector } from "redux/hooks";
import { USER_THRESHOLD_MAX } from "./constants";
import { StatsChart } from "./StatsChart/StatsChart";
import { StatsTable } from "./StatsTable/StatsTable";
import { initialState, statsReducer } from "./store";
import { applyUserThreshold } from "./utils";
import {
  StyledContainer,
  StyledEndpointStatus,
  StyledField,
  StyledFieldGroup,
  StyledFieldLabel,
  StyledHeader,
  StyledHeading,
  StyledResponseSection,
  StyledResultsChart,
  StyledResultsTable,
  StyledStyledQueryState,
} from "./StatsPageStyles";

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
  const [isAggregating, setIsAggregating] = useState<boolean>(false);
  const [aggregateMessage, setAggregateMessage] = useState<string>("");

  // Update timeTo to current time when navigating to this page to correctly refresh the data
  useEffect(() => {
    dispatch({
      type: "timeToUpdate",
      payload: new Date().toISOString(),
    });
  }, []);

  // Helper function to update timeTo to current time
  const updateToCurrentTime = () => {
    dispatch({
      type: "timeToUpdate",
      payload: new Date().toISOString(),
    });
  };

  // Helper function to trigger manual aggregation
  const triggerAggregation = async () => {
    setIsAggregating(true);
    setAggregateMessage("");

    try {
      const response = await api.statsAggregate({
        fromDate: new Date(state.timeFrom).getTime(),
        toDate: new Date(state.timeTo).getTime(),
        timeUnits: [state.timeUnit],
        aggregateBy: [state.aggregate],
      });

      setAggregateMessage(response.data.message);

      // Invalidate stats queries to refresh data
      client.invalidateQueries({ queryKey: ["stats"] });
    } catch (error) {
      setAggregateMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsAggregating(false);
    }
  };

  const statsRequest = useMemo<IRequestStats>(() => {
    return {
      fromDate: new Date(state.timeFrom).getTime(),
      toDate: new Date(state.timeTo).getTime(),
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

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledHeading>Statistics</StyledHeading>

        <ButtonGroup>
          {/* <span>
            <StyledEndpointStatus $isMaterialized={state.useMaterialized}>
              {state.useMaterialized ? "⚡ Materialized" : "🔄 Live Data"}
            </StyledEndpointStatus>
          </span> */}

          <Button
            color="success"
            label="Refresh"
            disabled={isLoadingStats}
            onClick={updateToCurrentTime}
          />
        </ButtonGroup>
      </StyledHeader>

      <StyledFieldGroup>
        <StyledField>
          <StyledFieldLabel>From date</StyledFieldLabel>
          <Input
            type="datetime-local"
            value={state.timeFrom.slice(0, 16)}
            onChangeFn={(value) =>
              dispatch({
                type: "timeFromUpdate",
                payload: new Date(value).toISOString(),
              })
            }
          />
        </StyledField>
        <StyledField>
          <StyledFieldLabel>To date</StyledFieldLabel>
          <Input
            type="datetime-local"
            value={state.timeTo.slice(0, 16)}
            onChangeFn={(value) =>
              dispatch({
                type: "timeToUpdate",
                payload: new Date(value).toISOString(),
              })
            }
          />
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

        {/* Materialized Data */}
        {/* <StyledField>
          <StyledFieldLabel>Use Materialized Data</StyledFieldLabel>
          <Checkbox
            value={state.useMaterialized}
            onChangeFn={(value) =>
              dispatch({
                type: "useMaterializedUpdate",
                payload: value,
              })
            }
            label={
              state.useMaterialized ? "Fast (Materialized)" : "Classic (Live)"
            }
            tooltipLabel={
              state.useMaterialized
                ? "Using pre-aggregated materialized data for faster performance"
                : "Using live data from audit table (slower but always up-to-date)"
            }
          />
        </StyledField>
        <StyledField>
          <StyledFieldLabel>Aggregate Options</StyledFieldLabel>
          <Checkbox
            value={state.showAggregateOptions}
            onChangeFn={(value) =>
              dispatch({
                type: "showAggregateOptionsUpdate",
                payload: value,
              })
            }
            label="Show Advanced Options"
            tooltipLabel="Show options for manually triggering data aggregation"
          />
        </StyledField> */}
      </StyledFieldGroup>

      {/* {state.swhowAggregateOptions && (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#495057" }}>
            Manual Data Aggregation
          </h3>
          <p
            style={{ margin: "0 0 15px 0", color: "#6c757d", fontSize: "14px" }}
          >
            Manually trigger aggregation of stats data for the current date
            range and settings. This will populate the materialized tables with
            pre-calculated data for faster queries.
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <Button
              color="primary"
              inverted
              radiusLeft
              radiusRight
              label={isAggregating ? "Aggregating..." : "Aggregate Data"}
              disabled={isAggregating || isLoadingStats}
              onClick={triggerAggregation}
            />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <span style={{ fontSize: "12px", color: "#6c757d" }}>
                Range: {new Date(state.timeFrom).toLocaleDateString()} -{" "}
                {new Date(state.timeTo).toLocaleDateString()}
              </span>
              <span style={{ fontSize: "12px", color: "#6c757d" }}>
                Settings: {state.timeUnit} | {state.aggregate} |{" "}
                {state.eventType.join(", ")}
              </span>
            </div>
          </div>

          {aggregateMessage && (
            <div
              style={{
                padding: "10px",
                backgroundColor: aggregateMessage.includes("Error")
                  ? "#f8d7da"
                  : "#d1edff",
                border: `1px solid ${
                  aggregateMessage.includes("Error") ? "#f5c6cb" : "#b8daff"
                }`,
                borderRadius: "4px",
                fontSize: "14px",
                color: aggregateMessage.includes("Error")
                  ? "#721c24"
                  : "#004085",
              }}
            >
              {aggregateMessage}
            </div>
          )}
        </div>
      )} */}

      <StyledResponseSection>
        {isError && <StyledStyledQueryState>Error</StyledStyledQueryState>}
        {isLoadingStats && (
          <StyledStyledQueryState>
            <Loader show />
          </StyledStyledQueryState>
        )}
        {isNoData && <StyledStyledQueryState>No data</StyledStyledQueryState>}
        {data && (
          <>
            <StyledResultsChart>
              <StatsChart
                data={data}
                height={contentHeight / 3}
                width={layoutWidth - 50}
                request={statsRequest}
                isLoading={isLoadingStats}
              />
            </StyledResultsChart>
            <StyledResultsTable>
              <StatsTable
                data={data}
                height={contentHeight / 3}
                width={layoutWidth - 50}
                request={statsRequest}
                isLoading={isLoadingStats}
              />
            </StyledResultsTable>
          </>
        )}
      </StyledResponseSection>
    </StyledContainer>
  );
};
