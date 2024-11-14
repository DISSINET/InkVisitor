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
