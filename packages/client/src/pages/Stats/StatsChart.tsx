import { IRequestStats, IResponseStats } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { color as d3Color, schemeTableau10 } from "d3";
import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

  // const xScale = useMemo(() => {
  //   const minPx = xAxisPadding;
  //   const maxPx = width - xAxisPadding;

  //   const minValue = new Date(Object.keys(values)[0]);
  //   const maxValue = new Date(
  //     Object.keys(values)[Object.keys(values).length - 1]
  //   );

  //   return scaleBand().domain(Object.keys(values)).range([minPx, maxPx]);
  // }, [data, width, xAxisPadding, values]);

  // const yScale = useMemo(() => {
  //   const minPx = yAxisPadding;
  //   const maxPx = height - yAxisPadding;

  //   const minValue = 0;

  //   const groupValues = Object.values(values);
  //   const maxValue = Math.max(
  //     ...groupValues.map((d) =>
  //       Object.values(d).reduce((acc, curr) => acc + curr, 0)
  //     )
  //   );

  //   return scaleLinear()
  //     .domain([minValue, maxValue])
  //     .nice()
  //     .range([maxPx, minPx]);
  // }, [data, height, values, yAxisPadding]);

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

  const colors = schemeTableau10;

  const dataCategories = getDataCategories(aggregateBy, userKeyMap, values);

  const categoryColors = useMemo<Record<string, string>>(() => {
    const colorsOut: Record<string, string> = {};
    Object.keys(dataCategories).forEach((category, index) => {
      const color = colors[index % colors.length] || "#000";
      const categoryValue = dataCategories[index];
      colorsOut[categoryValue] = color;
    });
    colorsOut["others"] = theme.color.greyer;
    return colorsOut;
    // if (aggregateBy === Aggregation.ACTIVITY_TYPE) {
    //   return {
    //     [EventType.EDIT]: colors[0],
    //     [EventType.DELETE]: colors[1],
    //     [EventType.CREATE]: colors[2],
    //   };
    // }

    // if (aggregateBy === Aggregation.USER) {
    //   const userColors: Record<string, string> = {};
    //   Object.values(userKeyMap).forEach((user, index) => {
    //     userColors[user] = colors[index % colors.length] || "#000";
    //   });
    //   return userColors;
    // }
    // return {};
  }, [aggregateBy, userKeyMap, colors, values, dataCategories]);

  // console.log(categoryColors);
  const dataChart = useMemo<ChartDataPoint[]>(() => {
    return transformDataForChart(
      values,
      dataCategories,
      aggregateBy,
      userKeyMap
    );
  }, [values, dataCategories, aggregateBy, userKeyMap]);

  console.log("dataChart", dataChart);
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
      // : d3Color(catColor)?.brighter(3).formatHex();
    },
    [hoveringDataKey, categoryColors]
  );

  const BarEls = useMemo<React.ReactNode[]>(() => {
    return dataCategories.map((category, index) => {
      const color = getColor(category);

      console.log("category", category);

      return (
        <Bar
          key={category}
          dataKey={(obj) => {
            return obj[index]?.value;
          }}
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
