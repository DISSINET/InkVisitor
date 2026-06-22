import { Explore } from "@inkvisitor/shared/types/query";
import { WIDTH_COLUMN_DEFAULT, WIDTH_COLUMN_EUC, WIDTH_COLUMN_NARROW } from "./constants";
import { narrowColumnTypes, smallColumnTypes } from "./types";

export const getColumnWidth = (type: Explore.EExploreColumnType): number => {
  if (narrowColumnTypes.has(type)) return WIDTH_COLUMN_NARROW;
  if (smallColumnTypes.has(type)) return WIDTH_COLUMN_EUC;
  return WIDTH_COLUMN_DEFAULT;
};
