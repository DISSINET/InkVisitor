import { IResponseStats } from "@inkvisitor/shared/types";
import { Aggregation, EventType } from "@inkvisitor/shared/types/stats";
import { schemeTableau10 } from "d3";
import { useTheme } from "styled-components";

export const OTHERS_KEY = "others";
/** Row key of the column holding the sum over all categories of a time bucket. */
export const TOTAL_KEY = "__total";

/** `12 [3.45%]` - the share is relative to the grand total of the table. */
export const formatValueWithShare = (value: number, grandTotal: number): string =>
  `${value} [${grandTotal > 0 ? ((value / grandTotal) * 100).toFixed(2) : "0.00"}%]`;

export const getNonEmptyUsers = (
  userKeyMap: Record<string, string>,
  values: Record<string, Record<string, number>>
): string[] => {
  const nonEmptyUsers: string[] = [];
  Object.keys(userKeyMap).forEach((userKey) => {
    const userValue = userKeyMap[userKey];
    if (
      Object.values(values).some(
        (value) =>
          Object.keys(value).includes(userKey) &&
          value[userKey] !== 0 &&
          value[userKey] !== null
      )
    ) {
      nonEmptyUsers.push(userValue);
    }
  });
  return [...nonEmptyUsers];
};

export const getDataCategories = (
  aggregateBy: Aggregation,
  userKeyMap: Record<string, string>,
  values: Record<string, Record<string, number>>
): string[] => {
  if (aggregateBy === Aggregation.ACTIVITY_TYPE) {
    // Show every event type that actually has data, ordered by the EventType
    // enum so colors/columns stay stable as new types are introduced.
    const presentTypes = new Set<string>();
    Object.values(values).forEach((bucket) => {
      Object.entries(bucket).forEach(([type, count]) => {
        if (count !== 0 && count !== null) {
          presentTypes.add(type);
        }
      });
    });
    return Object.values(EventType).filter((type) => presentTypes.has(type));
  }
  if (aggregateBy === Aggregation.USER) {
    const userCategories = getNonEmptyUsers(userKeyMap, values);

    // add others to the end of the categories
    if (userCategories.includes(OTHERS_KEY)) {
      userCategories.splice(userCategories.indexOf(OTHERS_KEY), 1);
    }
    userCategories.push(OTHERS_KEY);
    // sort based on the sumsWithPercentages
    const sumsWithPercentages = calculateSumsAndPercentages(
      values,
      userCategories,
      aggregateBy,
      userKeyMap
    );

    userCategories.sort((a, b) => {
      return sumsWithPercentages.sums[b] - sumsWithPercentages.sums[a];
    });

    const hasOthers = sumsWithPercentages.sums[OTHERS_KEY] > 0;

    if (hasOthers) {
      // move others to the end of the categories
      if (userCategories.includes(OTHERS_KEY)) {
        userCategories.splice(userCategories.indexOf(OTHERS_KEY), 1);
      }
      userCategories.push(OTHERS_KEY);
    } else {
      // remove others from the categories
      if (userCategories.includes(OTHERS_KEY)) {
        userCategories.splice(userCategories.indexOf(OTHERS_KEY), 1);
      }
    }

    return userCategories;
  }

  return [];
};

export const calculateSumsAndPercentages = (
  values: Record<string, Record<string, number>>,
  categories: string[],
  aggregateBy: Aggregation,
  userKeyMap: Record<string, string>
) => {
  const sums: Record<string, number> = {};
  categories.forEach((category) => {
    sums[category] = 0;
  });

  // Calculate sums
  Object.values(values).forEach((timeValues) => {
    if (aggregateBy === Aggregation.USER) {
      // buckets are keyed by user id, except the "others" bucket, which already
      // carries its own display key
      Object.entries(timeValues).forEach(([key, value]) => {
        const category = userKeyMap[key] ?? key;
        sums[category] = (sums[category] || 0) + value;
      });
    } else {
      categories.forEach((category) => {
        sums[category] = (sums[category] || 0) + (timeValues[category] || 0);
      });
    }
  });

  // Calculate grand total and percentages. Only categories that get a column
  // count, so the total row, the total column and the grand total add up.
  const grandTotal = categories.reduce(
    (acc, category) => acc + (sums[category] || 0),
    0
  );
  const sumsWithPercentages = Object.fromEntries(
    Object.entries(sums).map(([key, value]) => [
      key,
      formatValueWithShare(value, grandTotal),
    ])
  );

  return { sums, sumsWithPercentages, grandTotal };
};

export const transformDataForTable = (
  values: IResponseStats["values"],
  categories: string[],
  aggregateBy: Aggregation,
  userKeyMap: Record<string, string>
) => {
  const { sumsWithPercentages, grandTotal } = calculateSumsAndPercentages(
    values,
    categories,
    aggregateBy,
    userKeyMap
  );

  interface DataRow {
    timeKey: string;
    [key: string]: string | number;
  }

  const rows = Object.keys(values).map((timeKey) => {
    const row: DataRow = { timeKey };
    const valObject = values[timeKey];

    if (aggregateBy === Aggregation.USER) {
      Object.entries(userKeyMap).forEach(([userId, userName]) => {
        row[userName] = valObject[userId] || 0;
      });
      // include others bucket if present
      row[OTHERS_KEY] = valObject[OTHERS_KEY] || 0;
    } else {
      categories.forEach((category) => {
        row[category] = valObject[category] || 0;
      });
    }

    row[TOTAL_KEY] = formatValueWithShare(
      categories.reduce((acc, category) => acc + Number(row[category] || 0), 0),
      grandTotal
    );

    return row;
  });

  // Add totals row at the beginning
  rows.unshift({
    timeKey: "Total",
    ...sumsWithPercentages,
    [TOTAL_KEY]: String(grandTotal),
  });

  return rows;
};

const colors = schemeTableau10;

export const getCategoryMap = (categories: string[]) => {
  const theme = useTheme();
  const colorsOut: Record<string, string> = {};
  categories.forEach((category, index) => {
    const color = colors[index % colors.length] || "#000";
    colorsOut[category] = color;
  });
  colorsOut[OTHERS_KEY] = theme.color.greyer;
  return colorsOut;
};

export type ChartDataPoint = {
  name: string;
} & Record<string, number | string>;

export const transformDataForChart = (
  values: IResponseStats["values"],
  categories: string[],
  aggregateBy: Aggregation,
  userKeyMap: Record<string, string>
) => {
  if (aggregateBy === Aggregation.USER) {
    // keep the order in the categories
    const categoryMap = Object.fromEntries(
      categories.map((category, index) => [category, index])
    );

    // categoryMap[OTHERS_KEY] = categories.length - 1;

    return Object.keys(values).map((timeKey) => {
      const valObject = values[timeKey];

      const userValues: Record<string, { id: string; value: number }> = {};
      for (const user of Object.keys(userKeyMap)) {
        const value = valObject[user];
        const userName = userKeyMap[user];

        const userIndex = categoryMap[userName];
        userValues[userIndex] = { id: user, value };
      }

      // include others bucket if present
      if (OTHERS_KEY in valObject) {
        const othersIndex = categoryMap[OTHERS_KEY];
        userValues[othersIndex] = {
          id: OTHERS_KEY,
          value: valObject[OTHERS_KEY],
        };
      }

      return {
        name: timeKey,
        ...userValues,
      };
    });
  }

  if (aggregateBy === Aggregation.ACTIVITY_TYPE) {
    const categoryMap = Object.fromEntries(
      categories.map((category, index) => [category, index])
    );

    return Object.keys(values).map((timeKey) => {
      const valObject = values[timeKey];

      const activityValues: Record<string, { id: string; value: number }> = {};
      for (const activity of Object.keys(categoryMap)) {
        const value = valObject[activity];
        const activityKey = categoryMap[activity];
        activityValues[activityKey] = { id: activity, value };
      }

      return {
        name: timeKey,
        ...activityValues,
      };
    });
  }

  return [];
};
