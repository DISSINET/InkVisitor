import { IRequestStats, IResponseStats } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
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

import api from "api";
import theme from "Theme/theme";
import { OTHERS_KEY } from "./constants";
import {
  ChartDataPoint,
  getCategoryMap,
  getDataCategories,
  transformDataForChart,
} from "./utils";

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
  const values = data.values;
  const [hoveringDataKey, setHoveringDataKey] = useState<string | null>(null);
  const { aggregateBy, eventType } = request;

  const { data: dataUsers } = useQuery({
    queryKey: ["users-stats"],
    queryFn: () => api.usersGetMore({}),
    enabled: api.isLoggedIn(),
  });

  const userKeyMap = useMemo<Record<string, string>>(() => {
    const mapNames: Record<string, string> = {
      [OTHERS_KEY]: OTHERS_KEY,
    };
    for (const user of dataUsers?.data || []) {
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
          key={category}
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
      <div
        className="custom-tooltip"
        style={{
          visibility: "visible",
          display: "flex",
          flexDirection: "column",
          gap: theme.space[2],
          backgroundColor: theme.color.gray[100],
          padding: theme.space[4],
          borderRadius: theme.space[2],
          width: "100%",
          opacity: 0.85,
        }}
      >
        {/* label */}
        <div
          style={{
            fontSize: theme.fontSize.sm,
            color: theme.color.gray[100],
            width: "fit-content",
            backgroundColor: theme.color.gray[600],
            padding: theme.space[1] + " " + theme.space[2],
            borderRadius: theme.space[2],
          }}
        >
          {label}
        </div>
        {/* payload */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: theme.space[1],
            paddingLeft: theme.space[1],
          }}
        >
          {dataCategories.map((category, index) => {
            const payloadItem = payload?.[0]?.payload?.[index];
            const payloadValue = payloadItem?.value;
            const payloadName = payloadItem?.id;

            if (!payloadValue) {
              return null;
            }

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.space[1],
                }}
              >
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
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <BarChart
      width={width}
      height={height - 30}
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
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: theme.space[1],
              flexWrap: "wrap",
              zIndex: 2,
            }}
          >
            {dataCategories.map((category) => {
              const isActive = hoveringDataKey === category;
              const color = getColor(category);

              return (
                <div
                  key={category}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: `${theme.space[0]} ${theme.space[5]}`,
                    gap: theme.space[2],
                  }}
                  onMouseEnter={() => {
                    if (!isActive) {
                      handleMouseEnter({ dataKey: category, value: category });
                    }
                  }}
                  onMouseLeave={() => {
                    if (isActive) {
                      handleMouseLeave();
                    }
                  }}
                >
                  <div
                    style={{
                      backgroundColor: color,
                      width: theme.space[6],
                      height: theme.space[6],
                    }}
                  />
                  <span
                    style={{
                      fontSize: theme.fontSize.base,
                      color: color,
                    }}
                  >
                    {category}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        wrapperStyle={{ paddingTop: 20, paddingBottom: 10 }}
      />
      {BarEls}
    </BarChart>
  );
};
