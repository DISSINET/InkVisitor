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

import { Explore } from "@inkvisitor/shared/types/query";

export const narrowColumnTypes = new Set([
  Explore.EExploreColumnType.EST,
  Explore.EExploreColumnType.ELA,
  Explore.EExploreColumnType.EPOS,
]);

export const smallColumnTypes = new Set([
  Explore.EExploreColumnType.EUC,
  Explore.EExploreColumnType.ELI,
]);

/**
 * Column types whose width is estimated from cell content (entity tags +
 * optional suggester). Fixed-control columns (status/language/POS dropdowns,
 * user tag, plain text) keep their static widths.
 */
export const contentSizedColumnTypes = new Set([
  Explore.EExploreColumnType.ER,
  Explore.EExploreColumnType.EPV,
  Explore.EExploreColumnType.EPT,
  Explore.EExploreColumnType.ERR,
  Explore.EExploreColumnType.ERV,
]);

