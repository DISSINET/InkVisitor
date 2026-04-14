import { IRequestStats, IResponseStats } from "@shared/types";
import { color as d3Color } from "d3";
import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  LegendPayload,
  Tooltip,
  TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";

import { useTheme } from "styled-components";
import { OTHERS_KEY } from "../constants";
import {
  ChartDataPoint,
  getCategoryMap,
  getDataCategories,
  transformDataForChart,
} from "../utils";
import {
  StyledChartWrapper,
  StyledCustomTooltip,
  StyledLabel,
  StyledLegendColorBox,
  StyledLegendItem,
  StyledLegendText,
  StyledLegendWrapper,
  StyledPayload,
  StyledPayloadItem,
} from "./StatsChartStyles";
import { useUsersGetMoreQuery } from "hooks/react-query/useUsersGetMoreQuery";

interface StatsChartProps {
  data: IResponseStats;
  height: number;
  width: number;
  request: IRequestStats;
}

export const StatsChart = ({
  data,
  height,
  width,
  request,
}: StatsChartProps) => {
  const theme = useTheme();
  const values = data.values;
  const [hoveringDataKey, setHoveringDataKey] = useState<string | null>(null);
  const { aggregateBy, eventType } = request;

  const hasOthers = useMemo<boolean>(() => {
    return values && Object.keys(values).some((key) => key === OTHERS_KEY);
  }, [values]);

  const { data: dataUsers } = useUsersGetMoreQuery();

  const userKeyMap = useMemo<Record<string, string>>(() => {
    const mapNames: Record<string, string> = {};

    if (hasOthers) {
      mapNames[OTHERS_KEY] = OTHERS_KEY;
    }

    for (const user of dataUsers || []) {
      mapNames[user.id] = user.name.replace(".", "_");
    }
    return mapNames;
  }, [dataUsers]);

  const dataCategories = getDataCategories(aggregateBy, userKeyMap, values);

  const categoryColors = getCategoryMap(dataCategories);

  const dataChart = useMemo<ChartDataPoint[]>(() => {
    return transformDataForChart(
      values,
      dataCategories,
      aggregateBy,
      userKeyMap
    );
  }, [values, dataCategories, aggregateBy, userKeyMap]);

  const handleMouseEnter = useCallback((payload: LegendPayload) => {
    setHoveringDataKey(payload.dataKey as string);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveringDataKey(null);
  }, []);

  const getColor = useCallback(
    (category: string) => {
      if (hoveringDataKey === null) {
        return categoryColors[category];
      }

      const isActive = hoveringDataKey === category;
      const catColor = categoryColors[category];

      return isActive ? d3Color(catColor)?.formatHex() : theme.color.gray[500];
    },
    [hoveringDataKey, categoryColors]
  );

  const BarEls = useMemo<React.ReactNode[]>(() => {
    return dataCategories.map((category, index) => {
      const color = getColor(category);

      return (
        <Bar
          key={index}
          dataKey={(obj) => {
            return obj[index]?.value;
          }}
          order={index}
          fill={color}
          stackId="a"
        />
      );
    });
  }, [dataCategories, getColor]);

  const xAxisEl = useMemo(() => {
    return <XAxis dataKey="name" />;
  }, [values]);

  const yAxisEl = useMemo(() => {
    return <YAxis />;
  }, [values]);

  const gridEl = useMemo(() => {
    return <CartesianGrid strokeDasharray="3 3" />;
  }, [values]);

  const TooltipEl = ({
    payload,
    label,
    active,
  }: TooltipContentProps<number, string>): React.ReactNode => {
    if (!active) {
      return null;
    }
    return (
      <StyledCustomTooltip>
        <StyledLabel>{label}</StyledLabel>
        <StyledPayload>
          {dataCategories.map((category, index) => {
            const payloadItem = payload?.[0]?.payload?.[index];
            const payloadValue = payloadItem?.value;
            const payloadName = payloadItem?.id;

            if (!payloadValue) {
              return null;
            }

            return (
              <StyledPayloadItem key={index}>
                <span
                  style={{
                    backgroundColor: categoryColors[category],
                    width: theme.space[6],
                    height: theme.space[4],
                  }}
                />
                <span
                  style={{
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.medium,
                  }}
                >
                  {category}
                </span>
                <span
                  style={{
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.bold,
                  }}
                >
                  {payloadValue}
                </span>
              </StyledPayloadItem>
            );
          })}
        </StyledPayload>
      </StyledCustomTooltip>
    );
  };

  return (
    <StyledChartWrapper>
      <BarChart
        width={width}
        height={height}
        data={dataChart}
        onMouseLeave={() => {
          if (hoveringDataKey) {
            handleMouseLeave();
          }
        }}
      >
        {gridEl}
        {xAxisEl}
        {yAxisEl}
        <Tooltip wrapperStyle={{ zIndex: 200 }} content={TooltipEl} />
        <Legend
          content={() => (
            <StyledLegendWrapper>
              {dataCategories.map((category) => {
                const isActive = hoveringDataKey === category;
                const color = getColor(category);

                return (
                  <StyledLegendItem
                    key={category}
                    onMouseEnter={() => {
                      if (!isActive) {
                        handleMouseEnter({
                          dataKey: category,
                          value: category,
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      if (isActive) {
                        handleMouseLeave();
                      }
                    }}
                  >
                    <StyledLegendColorBox $color={color} />
                    <StyledLegendText $color={color}>
                      {category}
                    </StyledLegendText>
                  </StyledLegendItem>
                );
              })}
            </StyledLegendWrapper>
          )}
          wrapperStyle={{ paddingTop: 20, paddingBottom: 10 }}
        />
        {BarEls}
      </BarChart>
    </StyledChartWrapper>
  );
};
