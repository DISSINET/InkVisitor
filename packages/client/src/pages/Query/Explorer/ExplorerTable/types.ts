export enum BatchAction {
  open_in_detail = "open_in_detail",
  copy_uuids = "copy_uuids",
  export_csv = "export_csv",
  add_metaprop = "add_metaprop",
  add_reference = "add_reference",
  add_relation = "add_relation",
}

export type BatchOption = {
  value: BatchAction;
  label: string;
};

export const batchOptions: BatchOption[] = [
  { value: BatchAction.open_in_detail, label: "open in detail" },
  { value: BatchAction.copy_uuids, label: "copy UUIDs to clipboard" },
  { value: BatchAction.export_csv, label: "export as csv" },
  { value: BatchAction.add_metaprop, label: "add new metaproperty" },
  { value: BatchAction.add_reference, label: "add new reference" },
  { value: BatchAction.add_relation, label: "add new relation" },
];

/** Batch actions restricted to Admin and Owner roles. */
export const editingBatchActions = new Set<BatchAction>([
  BatchAction.export_csv,
  BatchAction.add_metaprop,
  BatchAction.add_reference,
  BatchAction.add_relation,
]);

export const WIDTH_COLUMN_FIRST = 280;
export const WIDTH_COLUMN_DEFAULT = 400;
export const WIDTH_COLUMN_EUC = 210;
export const HEIGHT_ROW_DEFAULT = 38;
