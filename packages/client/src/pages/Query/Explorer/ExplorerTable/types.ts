export enum BatchAction {
  fill_empty = "fill_empty",
}

export type BatchOption = {
  value: BatchAction;
  label: string;
};

export const batchOptions: BatchOption[] = [
  {
    value: BatchAction.fill_empty,
    label: `fill empty`,
  },
];

export const WIDTH_COLUMN_FIRST = 250;
export const WIDTH_COLUMN_DEFAULT = 800;
export const HEIGHT_ROW_DEFAULT = 40;
