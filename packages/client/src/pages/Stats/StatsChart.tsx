import { IRequestStats, IResponseStats } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { color as d3Color, schemeTableau10 } from "d3";
import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  LegendPayload,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "api";
import theme from "Theme/theme";
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
      others: "others",
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
      console.log("dataCategory", category, index);
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
      <Tooltip wrapperStyle={{ zIndex: 200 }} />
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
