export enum BatchAction {
  open_in_detail = "open_in_detail",
  copy_uuids = "copy_uuids",
  export_tsv = "export_tsv",
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
  { value: BatchAction.export_tsv, label: "export as tsv" },
  { value: BatchAction.add_metaprop, label: "add new metaproperty" },
  { value: BatchAction.add_reference, label: "add new reference" },
  { value: BatchAction.add_relation, label: "add new relation" },
];

/** Batch actions restricted to Admin and Owner roles. */
export const restrictedBatchActions = new Set<BatchAction>([
  BatchAction.export_tsv,
  BatchAction.add_metaprop,
  BatchAction.add_reference,
  BatchAction.add_relation,
]);

