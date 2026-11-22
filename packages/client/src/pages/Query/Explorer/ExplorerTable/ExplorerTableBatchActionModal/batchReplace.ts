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

/** One selection, fixed at creation, sent in order. A call made while another
 * is pending resolves to null and sends nothing. */
export const createBatchReplaceRun = (ids: string[]): BatchReplaceRun => {
  const chunks = chunkIds([...ids]);
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
    const reasons = groupReasons(total.errors)
      .map(({ reason, count }) => `${count}x ${reason}`)
      .join(", ");
    notes.push(`${failed} cannot change: ${reasons}.`);
  }
  return { headline, notes, canConfirm };
};

export const batchReplaceToast = (outcome: BatchReplaceOutcome, selected: number): string => {
  const { total, sent, error } = outcome;
  if (error !== undefined) {
    return `Stopped after ${sent} of ${selected} entities: ${total.changed} replaced, the rest were not sent. Apply again to finish.`;
  }
  const failed = total.failed > 0 ? `, ${total.failed} could not change` : "";
  return `Replaced on ${total.changed} of ${selected} entities${failed}`;
};
