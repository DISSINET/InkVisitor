import { IResponseStats } from "@shared/types";
import { Aggregation, EventType } from "@shared/types/stats";

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
    return [EventType.EDIT, EventType.CREATE, EventType.DELETE];
  }
  if (aggregateBy === Aggregation.USER) {
    const userCategories = getNonEmptyUsers(userKeyMap, values);

    // add others to the end of the categories
    if (userCategories.includes("others")) {
      userCategories.splice(userCategories.indexOf("others"), 1);
    }
    userCategories.push("others");
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

    // move others to the end of the categories
    if (userCategories.includes("others")) {
      userCategories.splice(userCategories.indexOf("others"), 1);
    }
    userCategories.push("others");

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
      Object.entries(userKeyMap).forEach(([userId, userName]) => {
        sums[userName] = (sums[userName] || 0) + (timeValues[userId] || 0);
      });
    } else {
      categories.forEach((category) => {
        sums[category] = (sums[category] || 0) + (timeValues[category] || 0);
      });
    }
  });

  // Calculate grand total and percentages
  const grandTotal = Object.values(sums).reduce((acc, val) => acc + val, 0);
  const sumsWithPercentages = Object.fromEntries(
    Object.entries(sums).map(([key, value]) => [
      key,
      `${value} [${Math.round((value / grandTotal) * 100)}%]`,
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
  const { sumsWithPercentages } = calculateSumsAndPercentages(
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
    } else {
      categories.forEach((category) => {
        row[category] = valObject[category] || 0;
      });
    }

    return row;
  });

  // Add totals row at the beginning
  rows.unshift({
    timeKey: "Total",
    ...sumsWithPercentages,
  });

  return rows;
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

    // categoryMap["others"] = categories.length - 1;

    return Object.keys(values).map((timeKey) => {
      const valObject = values[timeKey];

      const userValues: Record<string, { id: string; value: number }> = {};
      for (const user of Object.keys(userKeyMap)) {
        const value = valObject[user];
        const userName = userKeyMap[user];

        const userIndex = categoryMap[userName];
        userValues[userIndex] = { id: user, value };
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
