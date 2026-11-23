import { MAX_BATCH_REPLACE_ENTITIES } from "@inkvisitor/shared/constants";
import { IResponseBatchReplace } from "@inkvisitor/shared/types";

export const chunkIds = (ids: string[], size: number = MAX_BATCH_REPLACE_ENTITIES): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
};

export const emptyBatchReplace = (): IResponseBatchReplace => ({
  result: false,
  selected: 0,
  unmatched: 0,
  changed: 0,
  merged: 0,
  skipped: 0,
  failed: 0,
  items: 0,
  nested: 0,
  errors: {},
});

export const sumBatchReplace = (
  a: IResponseBatchReplace,
  b: IResponseBatchReplace
): IResponseBatchReplace => {
  const changed = a.changed + b.changed;
  return {
    result: changed > 0,
    selected: a.selected + b.selected,
    unmatched: a.unmatched + b.unmatched,
    changed,
    merged: a.merged + b.merged,
    skipped: a.skipped + b.skipped,
    failed: a.failed + b.failed,
    items: a.items + b.items,
    nested: a.nested + b.nested,
    errors: { ...a.errors, ...b.errors },
    ...(a.skippedIds || b.skippedIds
      ? { skippedIds: [...(a.skippedIds ?? []), ...(b.skippedIds ?? [])] }
      : {}),
  };
};

export interface BatchReplaceOutcome {
  total: IResponseBatchReplace;
  /** entity ids in the requests that answered */
  sent: number;
  /** set when a request failed; the run stopped there */
  error?: unknown;
}

export interface BatchReplaceRun {
  chunks: string[][];
  run(call: (ids: string[]) => Promise<IResponseBatchReplace>): Promise<BatchReplaceOutcome | null>;
}

/** One selection, fixed at creation, sent in order in requests of `size` ids. A
 * call made while another is pending resolves to null and sends nothing. */
export const createBatchReplaceRun = (
  ids: string[],
  size: number = MAX_BATCH_REPLACE_ENTITIES
): BatchReplaceRun => {
  const chunks = chunkIds([...ids], size);
  let pending = false;
  return {
    chunks,
    async run(call) {
      if (pending) {
        return null;
      }
      pending = true;
      let total = emptyBatchReplace();
      let sent = 0;
      try {
        for (const chunk of chunks) {
          total = sumBatchReplace(total, await call(chunk));
          sent += chunk.length;
        }
        return { total, sent };
      } catch (error) {
        return { total, sent, error };
      } finally {
        pending = false;
      }
    },
  };
};

export const groupReasons = (
  errors: Record<string, string>
): { reason: string; count: number }[] => {
  const counts = new Map<string, number>();
  for (const reason of Object.values(errors)) {
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return [...counts]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
};

const reasonList = (errors: Record<string, string>): string =>
  groupReasons(errors)
    .map(({ reason, count }) => `${count}x ${reason}`)
    .join(", ");

export const relationReplaceLines = (
  total: IResponseBatchReplace,
  names: { type: string; from: string; to: string }
): { headline: string; notes: string[]; canConfirm: boolean } => {
  const { selected, changed, merged, unmatched, failed } = total;
  const canConfirm = changed > 0;
  const headline = canConfirm
    ? `Replace ${names.type} "${names.from}" with "${names.to}" on ${changed} of ${selected} selected ${
        selected === 1 ? "entity" : "entities"
      }.`
    : selected === 1
      ? "The selected entity would not change."
      : `None of the ${selected} selected entities would change.`;

  const notes: string[] = [];
  if (merged > 0) {
    notes.push(
      `${merged} of them already ${merged === 1 ? "has" : "have"} "${names.to}". "${names.from}" is removed there.`
    );
  }
  if (unmatched > 0) {
    notes.push(
      unmatched === 1
        ? `1 selected entity has no ${names.type} "${names.from}" and stays as it is.`
        : `${unmatched} selected entities have no ${names.type} "${names.from}" and stay as they are.`
    );
  }
  if (failed > 0) {
    const reasons = reasonList(total.errors);
    notes.push(`${failed} cannot change${reasons ? `: ${reasons}` : ""}.`);
  }
  return { headline, notes, canConfirm };
};

/** The value `from: null` is the empty one: the metaprops of the type without a value. */
export const metapropReplaceLines = (
  total: IResponseBatchReplace,
  names: { type: string; from: string | null; to: string }
): { headline: string; notes: string[]; canConfirm: boolean } => {
  const { selected, changed, merged, skipped, unmatched, failed, items, nested } = total;
  const { type, from, to } = names;
  const canConfirm = changed > 0;
  const metaprops = `${items} ${items === 1 ? "metaprop" : "metaprops"} of type "${type}"`;
  const onSelected = `on ${changed} of ${selected} selected ${selected === 1 ? "entity" : "entities"}.`;
  const headline = canConfirm
    ? from === null
      ? `Fill the empty value of ${metaprops} with "${to}" ${onSelected}`
      : `Replace "${from}" with "${to}" in ${metaprops} ${onSelected}`
    : selected === 1
      ? "The selected entity would not change."
      : `None of the ${selected} selected entities would change.`;

  const notes: string[] = [];
  if (merged > 0) {
    const removed =
      from === null
        ? `${merged === 1 ? "Its" : "Their"} "${type}" without a value is removed there.`
        : `"${from}" is removed there.`;
    notes.push(
      `${merged} of them already ${merged === 1 ? "has" : "have"} "${type}" "${to}". ${removed}`
    );
  }
  if (skipped > 0) {
    const held = from === null ? `"${type}" without a value` : `"${from}"`;
    const remove = from === null ? "it" : `"${from}"`;
    notes.push(
      skipped === 1
        ? `1 selected entity already has "${type}" "${to}", but its ${held} has other settings (such as elvl or certainty) or subproperties. It stays as it is and stays selected; remove ${remove} there in Detail.`
        : `${skipped} selected entities already have "${type}" "${to}", but their ${held} has other settings (such as elvl or certainty) or subproperties. They stay as they are and stay selected; remove ${remove} there in Detail.`
    );
  }
  if (unmatched > 0) {
    const missing = from === null ? `"${type}" without a value` : `"${type}" "${from}"`;
    notes.push(
      unmatched === 1
        ? `1 selected entity has no ${missing} and stays as it is.`
        : `${unmatched} selected entities have no ${missing} and stay as they are.`
    );
  }
  if (nested > 0) {
    if (from === null) {
      notes.push(
        nested === 1
          ? `1 subproperty of type "${type}" without a value stays empty; it is not replaced.`
          : `${nested} subproperties of type "${type}" without a value stay empty; they are not replaced.`
      );
    } else {
      notes.push(
        nested === 1
          ? `"${from}" stays in 1 subproperty of type "${type}", which is not replaced.`
          : `"${from}" stays in ${nested} subproperties of type "${type}", which are not replaced.`
      );
    }
  }
  if (failed > 0) {
    const reasons = reasonList(total.errors);
    notes.push(`${failed} cannot change${reasons ? `: ${reasons}` : ""}.`);
  }
  return { headline, notes, canConfirm };
};

export const batchReplaceToast = (outcome: BatchReplaceOutcome, selected: number): string => {
  const { total, sent, error } = outcome;
  let message =
    error !== undefined
      ? `Stopped after ${sent} of ${selected} entities: ${total.changed} replaced`
      : `Replaced on ${total.changed} of ${selected} entities`;
  if (total.skipped > 0) {
    message += `, ${total.skipped} skipped`;
  }
  if (total.failed > 0) {
    const reasons = reasonList(total.errors);
    message += `, ${total.failed} could not change${reasons ? `: ${reasons}` : ""}`;
  }
  if (error !== undefined) {
    message += ". The next request failed; apply again to finish.";
  }
  return message;
};

/** The ids to keep selected after a save: null keeps the selection as it is (a
 * request failed, so the rows not sent are still to do); [] clears it; else the
 * skipped and the failed rows. */
export const rowsLeftSelected = ({ total, error }: BatchReplaceOutcome): string[] | null =>
  error !== undefined ? null : [...(total.skippedIds ?? []), ...Object.keys(total.errors)];
