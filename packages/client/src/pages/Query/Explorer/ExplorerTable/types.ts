export enum BatchAction {
  fill_empty = "fill_empty",
  export_csv = "export_csv",
}

export type BatchOption = {
  value: BatchAction;
  label: string;
};

export const batchOptions: BatchOption[] = [
  {
    value: BatchAction.export_csv,
    label: `export as csv`,
  },
  {
    value: BatchAction.fill_empty,
    label: `fill empty`,
  },
];

export const WIDTH_COLUMN_FIRST = 250;
export const WIDTH_COLUMN_DEFAULT = 400;
export const HEIGHT_ROW_DEFAULT = 40;
