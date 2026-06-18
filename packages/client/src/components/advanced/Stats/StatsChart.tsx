import { IResponseStats } from "@inkvisitor/shared/types";
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
import {
  ChartDataPoint,
  getCategoryMap,
  getDataCategories,
  OTHERS_KEY,
  transformDataForChart,
} from "./statsViz.utils";
import {
  StyledChartWrapper,
  StyledEmptyState,
  StyledCustomTooltip,
  StyledLabel,
  StyledLegendColorBox,
  StyledLegendItem,
  StyledLegendText,
  StyledLegendWrapper,
  StyledPayload,
  StyledPayloadItem,
} from "./StatsChartStyles";
import { useUsersSimplifiedQuery } from "hooks/react-query/useUsersSimplifiedQuery";

interface StatsChartProps {
  data: IResponseStats;
  height: number;
  width: number;
}

export const StatsChart = ({ data, height, width }: StatsChartProps) => {
  const theme = useTheme();
  const values = data.values;
  const [hoveringDataKey, setHoveringDataKey] = useState<string | null>(null);
  const { aggregateBy } = data;

  const hasOthers = useMemo<boolean>(() => {
    return values && Object.keys(values).some((key) => key === OTHERS_KEY);
  }, [values]);

  const { data: dataUsers } = useUsersSimplifiedQuery();

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
    return transformDataForChart(values, dataCategories, aggregateBy, userKeyMap);
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
    [hoveringDataKey, categoryColors],
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

  const TooltipEl = ({ payload, label, active }: TooltipContentProps): React.ReactNode => {
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

  const isEmpty = dataChart.length === 0 || dataCategories.length === 0;

  if (isEmpty) {
    return (
      <StyledEmptyState $width={width} $height={height}>
        No data for the selected filters
      </StyledEmptyState>
    );
  }

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
        <Tooltip
          wrapperStyle={{ zIndex: 200 }}
          cursor={{ fill: theme.color.statsChartCursor }}
          content={TooltipEl}
        />
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
                    <StyledLegendText $color={color}>{category}</StyledLegendText>
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
