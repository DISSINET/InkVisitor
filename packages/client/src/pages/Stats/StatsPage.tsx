import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";

import { IRequestStats, IResponseStats } from "@shared/types";
import { Aggregation, EventType, TimeUnit } from "@shared/types/stats";
import { Button, ButtonGroup, Input } from "components";
import { useWindowSize } from "hooks";
import { useMemo, useReducer } from "react";
import styled from "styled-components";
import { space1 } from "Theme/theme-space-shortcut";
import { StatsChart } from "./StatsChart";
import { initialState, statsReducer } from "./store";
import { StatsTable } from "./StatsTable";

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

export const StatsPage = () => {
  const client = useQueryClient();
  const [state, dispatch] = useReducer(statsReducer, initialState);

  const [windowWidth, windowHeight] = useWindowSize();

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
    queryKey: ["stats", statsRequest],
    queryFn: async () => {
      const response = await api.statsGet(statsRequest);
      return response.data;
    },
  });

  const isLoading = isLoadingStats;
  const isError = isErrorStats && !isLoadingStats;

  const isNoData = !isLoadingStats && !isErrorStats && !dataStats;
  const isReady = !isLoadingStats && !isErrorStats && dataStats;

  return (
    <Container>
      <Heading>Statistics</Heading>

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
                onClick={() =>
                  dispatch({
                    type: "timeUnitUpdate",
                    payload: unit as TimeUnit,
                  })
                }
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
                onClick={() =>
                  dispatch({
                    type: "eventTypeUpdate",
                    payload: eventType,
                  })
                }
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
                onClick={() =>
                  dispatch({ type: "aggregateUpdate", payload: agg })
                }
                color={state.aggregate === agg ? "primary" : "grey"}
              />
            ))}
          </ButtonGroup>
        </Field>
        <div>
          <Button
            color="success"
            label="Refresh"
            disabled={isLoading}
            onClick={() => {
              client.invalidateQueries({ queryKey: ["stats", statsRequest] });
            }}
          />
        </div>
      </FieldGroup>

      <ResponseSection>
        {isError && <StyledQueryState>Error</StyledQueryState>}
        {isLoading && <StyledQueryState>Loading...</StyledQueryState>}
        {isNoData && <StyledQueryState>No data</StyledQueryState>}
        {isReady && (
          <>
            <ResultsChart>
              <StatsChart
                data={dataStats as unknown as IResponseStats}
                height={windowHeight / 3}
                width={windowWidth - 50}
                request={statsRequest}
              />
            </ResultsChart>
            <ResultsTable>
              <StatsTable
                data={dataStats as unknown as IResponseStats}
                height={windowHeight / 3}
                width={windowWidth - 50}
                request={statsRequest}
              />
            </ResultsTable>
          </>
        )}
      </ResponseSection>
    </Container>
  );
};
