import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";

import { IRequestStats, IResponseStats } from "@shared/types";
import { Aggregation, EventType, TimeUnit } from "@shared/types/stats";
import { Button, ButtonGroup, Input, Loader, Checkbox } from "components";
import { useWindowSize } from "hooks";
import { useEffect, useMemo, useReducer, useState } from "react";
import styled from "styled-components";
import { space1 } from "Theme/theme-space-shortcut";
import { USER_THRESHOLD_MAX } from "./constants";
import { StatsChart } from "./StatsChart/StatsChart";
import { StatsTable } from "./StatsTable/StatsTable";
import { initialState, statsReducer } from "./store";
import { applyUserThreshold } from "./utils";
import { useAppSelector } from "redux/hooks";

const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

const Heading = styled.h1`
  color: ${({ theme }) => theme.color["primary"]};
`;

const FieldGroup = styled.div`
  display: grid;
  width: 100%;
  padding-bottom: 10px;
  grid-template-columns: repeat(6, auto);
  gap: ${(props) => props.theme.space[5]};
  align-items: end;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const FieldLabel = styled.div`
  text-align: right;
  justify-content: flex-end;
  margin-right: ${space1};
  vertical-align: top;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  display: flex;
  align-items: flex-end;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["primary"]};
`;

const ResultsChart = styled.div`
  width: 100%;
`;

const ResultsTable = styled.div`
  color: ${({ theme }) => theme.color["primary"]};
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${(props) => props.theme.space[5]};
`;

const ResponseSection = styled.div``;

const StyledQueryState = styled.div`
  color: ${({ theme }) => theme.color.primary};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

const EndpointStatus = styled.div<{ $isMaterialized: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  background-color: ${({ theme, $isMaterialized }) =>
    $isMaterialized ? theme.color.success : theme.color.warning};
  color: ${({ theme }) => theme.color.white};
`;

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

  const data = useMemo<IResponseStats | undefined>(() => {
    if (!dataStats) {
      return undefined;
    }

    if (state.aggregate === Aggregation.USER && dataStats.values) {
      const values = applyUserThreshold(
        dataStats.values,
        usersIgnoreBelowValue
      );
      return { ...dataStats, values };
    }

    return dataStats;
  }, [dataStats, usersIgnoreBelowValue, state.aggregate]);

  const isError = isErrorStats && !isLoadingStats;

  const isNoData = !isLoadingStats && !isErrorStats && !dataStats;
  const isReady = !isLoadingStats && !isErrorStats && dataStats;

  return (
    <Container>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Heading>Statistics</Heading>

        <ButtonGroup>
          <span>
            <EndpointStatus $isMaterialized={state.useMaterialized}>
              {state.useMaterialized ? "⚡ Materialized" : "🔄 Live Data"}
            </EndpointStatus>
          </span>

          <Button
            color="success"
            label="Refresh"
            disabled={isLoadingStats}
            onClick={updateToCurrentTime}
          />
        </ButtonGroup>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel>From date</FieldLabel>
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
        </Field>
        <Field>
          <FieldLabel>To date</FieldLabel>
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
        </Field>

        <Field>
          <FieldLabel>Time Unit</FieldLabel>
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
        </Field>

        <Field>
          <FieldLabel>Event type</FieldLabel>
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
        </Field>

        <Field>
          <FieldLabel>Aggregate By</FieldLabel>
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
        </Field>
        {state.aggregate === Aggregation.USER && (
          <Field>
            <FieldLabel>Ignore users below %</FieldLabel>
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
          </Field>
        )}
        <Field>
          <FieldLabel>Use Materialized Data</FieldLabel>
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
        </Field>
        <Field>
          <FieldLabel>Aggregate Options</FieldLabel>
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
        </Field>
      </FieldGroup>

      {state.showAggregateOptions && (
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
      )}

      <ResponseSection>
        {isError && <StyledQueryState>Error</StyledQueryState>}
        {isLoadingStats && (
          <StyledQueryState>
            <Loader show />
          </StyledQueryState>
        )}
        {isNoData && <StyledQueryState>No data</StyledQueryState>}
        {data && (
          <>
            <ResultsChart>
              <StatsChart
                data={data}
                height={contentHeight / 3}
                width={layoutWidth - 50}
                request={statsRequest}
                isLoading={isLoadingStats}
              />
            </ResultsChart>
            <ResultsTable>
              <StatsTable
                data={data}
                height={contentHeight / 3}
                width={layoutWidth - 50}
                request={statsRequest}
                isLoading={isLoadingStats}
              />
            </ResultsTable>
          </>
        )}
      </ResponseSection>
    </Container>
  );
};
