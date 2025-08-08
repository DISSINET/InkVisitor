import { IRequestStats, IResponseStats } from "@shared/types";
import { Aggregation, EventType } from "@shared/types/stats";
import { useQuery } from "@tanstack/react-query";
import api from "api";
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
import theme from "Theme/theme";

import { color as d3Color, schemeTableau10 } from "d3";
import { getNonEmptyUsers } from "./utils";

interface StatsChartProps {
  data: IResponseStats;
  height: number;
  width: number;
  request: IRequestStats;
}

type ChartDataPoint = {
  name: string;
} & Record<string, number | string>;

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
    queryKey: ["users"],
    queryFn: () => api.usersGetMore({}),
  });

  const userKeyMap = useMemo<Record<string, string>>(() => {
    const mapNames: Record<string, string> = {};
    for (const user of dataUsers?.data || []) {
      mapNames[user.id] = user.name.replace(".", "_");
    }
    return mapNames;
  }, [dataUsers]);

  const colors = schemeTableau10;

  const dataCategories = useMemo<string[]>(() => {
    const categoriesOut = [];

    if (aggregateBy === Aggregation.ACTIVITY_TYPE) {
      categoriesOut.push(EventType.EDIT);
      categoriesOut.push(EventType.DELETE);
      categoriesOut.push(EventType.CREATE);
    }

    if (aggregateBy === Aggregation.USER) {
      const nonEmptyUsers = getNonEmptyUsers(userKeyMap, values);
      categoriesOut.push(...nonEmptyUsers);
    }
    return categoriesOut;
  }, [aggregateBy, userKeyMap]);

  const categoryColors = useMemo<Record<string, string>>(() => {
    const colorsOut: Record<string, string> = {};
    Object.keys(dataCategories).forEach((category, index) => {
      const color = colors[index % colors.length] || "#000";
      const categoryValue = dataCategories[index];
      colorsOut[categoryValue] = color;
    });
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
  }, [aggregateBy, userKeyMap, colors]);

  console.log(categoryColors);
  const dataChart = useMemo<ChartDataPoint[]>(() => {
    if (aggregateBy === Aggregation.USER) {
      return Object.keys(values).map((timeKey) => {
        const valObject = values[timeKey];

        const userValues: Record<string, number> = {};
        for (const user of dataUsers?.data || []) {
          const value = valObject[user.id];
          const userName = userKeyMap[user.id];

          userValues[userName] = value;
        }

        return {
          name: timeKey,
          ...userValues,
        };
      });
    }
    if (aggregateBy === Aggregation.ACTIVITY_TYPE) {
      return Object.keys(values).map((timeKey) => {
        const valObject = values[timeKey];

        return {
          name: timeKey,
          ...valObject,
        };
      });
    }

    return [];
  }, [values, dataUsers, userKeyMap, aggregateBy]);

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

  const BarEls = useMemo(() => {
    return dataCategories.map((category) => {
      const color = getColor(category);

      return <Bar dataKey={category} fill={color} stackId="a" />;
    });
  }, [dataCategories, getColor]);

  const LegendEl = useMemo(() => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: theme.space[1],
          flexWrap: "wrap",
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
    );
  }, [hoveringDataKey, handleMouseEnter, handleMouseLeave]);

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
    <BarChart width={width} height={height - 30} data={dataChart}>
      {gridEl}
      {xAxisEl}
      {yAxisEl}
      <Tooltip />
      <Legend
        content={LegendEl}
        wrapperStyle={{ paddingTop: 20, paddingBottom: 10 }}
      />
      {BarEls}
    </BarChart>
  );

  // return (
  //   <div style={{ position: "relative" }}>
  //     <svg width={width} height={height} style={{ position: "absolute" }}>
  //       <g transform={`translate(${xAxisPadding}, ${height - yAxisPadding})`}>
  //         <Axis
  //           scale={xScale}
  //           orient={Orient.bottom}
  //           tickFormat={(d: string) => d}
  //           tickSize={10}
  //         />
  //       </g>
  //       <g transform={`translate(${xAxisPadding}, ${0})`}>
  //         <Axis scale={yScale} orient={Orient.left} tickSize={10} />
  //       </g>
  //     </svg>
  //     <svg width={width} height={height} style={{ position: "absolute" }}>
  //       <g>
  //         {Object.keys(values).map((timeKey) => {
  //           const timeValues = values[timeKey];

  //           return Object.keys(timeValues).map((categoryKey) => {
  //             const value = timeValues[categoryKey];
  //             const x = xScale(timeKey);
  //             const y = yScale(value);
  //             const barH = height - yScale(value);

  //             return (
  //               <rect
  //                 key={`${timeKey}-${categoryKey}`}
  //                 x={x}
  //                 y={y}
  //                 width={barW}
  //                 height={barH}
  //                 fill={categoryColors[categoryKey]}
  //                 fillOpacity={0.5}
  //               />
  //             );
  //           });
  //         })}
  //       </g>
  //     </svg>
  //   </div>
  // );
};
