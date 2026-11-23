import { describe, expect, it, vi } from "vitest";
import { IResponseBatchReplace } from "@inkvisitor/shared/types";
import {
  batchReplaceToast,
  chunkIds,
  createBatchReplaceRun,
  emptyBatchReplace,
  groupReasons,
  metapropReplaceLines,
  relationReplaceLines,
  rowsLeftSelected,
  sumBatchReplace,
} from "./batchReplace";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `e${i}`);
const answer = (patch: Partial<IResponseBatchReplace>): IResponseBatchReplace => ({
  ...emptyBatchReplace(),
  ...patch,
});
const names = { type: "Classification", from: "heretic", to: "dissident" };

describe("chunkIds", () => {
  it("splits at the request limit", () => {
    expect(chunkIds(ids(2500)).map((c) => c.length)).toEqual([1000, 1000, 500]);
  });
  it("gives no chunk for no ids", () => {
    expect(chunkIds([])).toEqual([]);
  });
  it("takes a size", () => {
    expect(chunkIds(["a", "b", "c"], 2)).toEqual([["a", "b"], ["c"]]);
  });
});

describe("sumBatchReplace", () => {
  it("adds every number and merges the errors", () => {
    const a = answer({
      selected: 3,
      unmatched: 1,
      changed: 1,
      merged: 1,
      skipped: 1,
      failed: 1,
      items: 2,
      nested: 3,
      errors: { x: "r1" },
    });
    const b = answer({
      selected: 4,
      unmatched: 2,
      changed: 2,
      merged: 0,
      skipped: 2,
      failed: 1,
      items: 5,
      nested: 1,
      errors: { y: "r2" },
    });
    expect(sumBatchReplace(a, b)).toEqual({
      result: true,
      selected: 7,
      unmatched: 3,
      changed: 3,
      merged: 1,
      skipped: 3,
      failed: 2,
      items: 7,
      nested: 4,
      errors: { x: "r1", y: "r2" },
    });
  });
  it("is true only when something changed", () => {
    expect(sumBatchReplace(answer({ selected: 1 }), answer({ selected: 1 })).result).toBe(false);
    expect(sumBatchReplace(answer({}), answer({ changed: 1 })).result).toBe(true);
  });
});

describe("createBatchReplaceRun", () => {
  it("splits at the request limit", () => {
    expect(createBatchReplaceRun(ids(2500)).chunks.map((c) => c.length)).toEqual([1000, 1000, 500]);
  });

  it("splits at a given size", () => {
    expect(createBatchReplaceRun(ids(450), 200).chunks.map((c) => c.length)).toEqual([
      200, 200, 50,
    ]);
  });

  it("keeps the chunks fixed when the source array changes", () => {
    const source = ids(1500);
    const run = createBatchReplaceRun(source);
    source.push("late");
    source.length = 0;
    expect(run.chunks.map((c) => c.length)).toEqual([1000, 500]);
  });

  it("sends the chunks in order and sums the answers", async () => {
    const run = createBatchReplaceRun(ids(2500));
    const seen: number[] = [];
    const outcome = await run.run(async (c) => {
      seen.push(c.length);
      return answer({ selected: c.length, changed: c.length });
    });
    expect(seen).toEqual([1000, 1000, 500]);
    expect(outcome?.sent).toBe(2500);
    expect(outcome?.total.changed).toBe(2500);
    expect(outcome?.error).toBeUndefined();
  });

  it("refuses a second run while one is pending", async () => {
    const run = createBatchReplaceRun(ids(2500));
    const call = vi.fn(async (c: string[]) => answer({ selected: c.length }));
    const [first, second] = await Promise.all([run.run(call), run.run(call)]);
    expect(second).toBeNull();
    expect(first?.sent).toBe(2500);
    expect(call).toHaveBeenCalledTimes(3);
  });

  it("stops at a rejected request and reports what was answered", async () => {
    const run = createBatchReplaceRun(ids(2500));
    const failure = new Error("boom");
    const first = answer({ result: true, selected: 1000, changed: 990 });
    const call = vi
      .fn<(c: string[]) => Promise<IResponseBatchReplace>>()
      .mockResolvedValueOnce(first)
      .mockRejectedValueOnce(failure);
    const outcome = await run.run(call);
    expect(outcome?.sent).toBe(1000);
    expect(outcome?.total).toEqual(first);
    expect(outcome?.error).toBe(failure);
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("runs again after a run has finished", async () => {
    const run = createBatchReplaceRun(ids(10));
    const call = async (c: string[]) => answer({ selected: c.length });
    expect((await run.run(call))?.sent).toBe(10);
    expect((await run.run(call))?.sent).toBe(10);
  });

  it("runs again after a run has failed", async () => {
    const run = createBatchReplaceRun(ids(10));
    await run.run(async () => {
      throw new Error("x");
    });
    expect((await run.run(async (c) => answer({ selected: c.length })))?.sent).toBe(10);
  });
});

describe("groupReasons", () => {
  it("sorts by count descending, then by reason", () => {
    expect(groupReasons({ 1: "b", 2: "a", 3: "c", 4: "c", 5: "b", 6: "z" })).toEqual([
      { reason: "b", count: 2 },
      { reason: "c", count: 2 },
      { reason: "a", count: 1 },
      { reason: "z", count: 1 },
    ]);
  });
});

describe("relationReplaceLines", () => {
  const t = answer({
    result: true,
    selected: 300,
    changed: 295,
    merged: 5,
    unmatched: 3,
    failed: 2,
    errors: { a: "permission denied", b: "relation not valid for these entities" },
  });

  it("states the headline and the notes", () => {
    expect(relationReplaceLines(t, names)).toEqual({
      headline:
        'Replace Classification "heretic" with "dissident" on 295 of 300 selected entities.',
      notes: [
        '5 of them already have "dissident". "heretic" is removed there.',
        '3 selected entities have no Classification "heretic" and stay as they are.',
        "2 cannot change: 1x permission denied, 1x relation not valid for these entities.",
      ],
      canConfirm: true,
    });
  });

  it("cannot confirm when nothing would change, and still lists the notes", () => {
    const lines = relationReplaceLines({ ...t, changed: 0, merged: 0, result: false }, names);
    expect(lines.headline).toBe("None of the 300 selected entities would change.");
    expect(lines.canConfirm).toBe(false);
    expect(lines.notes).toHaveLength(2);
  });

  it("uses the singular forms", () => {
    const one = answer({
      result: true,
      selected: 1,
      changed: 1,
      merged: 1,
      unmatched: 1,
      failed: 1,
      errors: { a: "permission denied" },
    });
    expect(relationReplaceLines(one, names)).toEqual({
      headline: 'Replace Classification "heretic" with "dissident" on 1 of 1 selected entity.',
      notes: [
        '1 of them already has "dissident". "heretic" is removed there.',
        '1 selected entity has no Classification "heretic" and stays as it is.',
        "1 cannot change: 1x permission denied.",
      ],
      canConfirm: true,
    });
  });

  it("words the cannot-change note without a reason list when no reason is known", () => {
    expect(relationReplaceLines(answer({ selected: 3, changed: 1, failed: 2 }), names).notes).toEqual([
      "2 cannot change.",
    ]);
    expect(relationReplaceLines(answer({ selected: 2, changed: 1, failed: 1 }), names).notes).toEqual([
      "1 cannot change.",
    ]);
  });

  it("has no notes when everything changes cleanly", () => {
    expect(
      relationReplaceLines(answer({ result: true, selected: 2, changed: 2 }), names).notes
    ).toEqual([]);
  });
});

describe("batchReplaceToast", () => {
  it("reports a complete run", () => {
    const total = answer({ selected: 300, changed: 295 });
    expect(batchReplaceToast({ total, sent: 300 }, 300)).toBe("Replaced on 295 of 300 entities");
  });
  it("adds the failures with their reasons", () => {
    const total = answer({
      selected: 300,
      changed: 295,
      failed: 2,
      errors: { a: "permission denied", b: "update failed" },
    });
    expect(batchReplaceToast({ total, sent: 300 }, 300)).toBe(
      "Replaced on 295 of 300 entities, 2 could not change: 1x permission denied, 1x update failed"
    );
  });
  it("adds the failures when no reason is known", () => {
    const total = answer({ selected: 300, changed: 295, failed: 2 });
    expect(batchReplaceToast({ total, sent: 300 }, 300)).toBe(
      "Replaced on 295 of 300 entities, 2 could not change"
    );
  });
  it("reports a stopped run", () => {
    const total = answer({ selected: 1000, changed: 990 });
    expect(batchReplaceToast({ total, sent: 1000, error: new Error("x") }, 2500)).toBe(
      "Stopped after 1000 of 2500 entities: 990 replaced. The next request failed; apply again to finish."
    );
  });
  it("reports a stopped run with failures", () => {
    const total = answer({
      selected: 1000,
      changed: 990,
      failed: 10,
      errors: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [`e${i}`, "permission denied"])
      ),
    });
    expect(batchReplaceToast({ total, sent: 1000, error: new Error("x") }, 2500)).toBe(
      "Stopped after 1000 of 2500 entities: 990 replaced, 10 could not change: 10x permission denied. The next request failed; apply again to finish."
    );
  });
});

describe("metaprop replace", () => {
  const metaNames = { type: "office", from: "bishop", to: "archbishop" };
  const empty = { ...metaNames, from: null };
  const t = answer({
    result: true,
    selected: 300,
    changed: 290,
    merged: 4,
    skipped: 3,
    unmatched: 5,
    failed: 2,
    items: 340,
    nested: 7,
    skippedIds: ["s1", "s2", "s3"],
    errors: { a: "permission denied", b: "cannot use template in entity instance" },
  });

  describe("metapropReplaceLines", () => {
    it("states the headline and the notes", () => {
      expect(metapropReplaceLines(t, metaNames)).toEqual({
        headline:
          'Replace "bishop" with "archbishop" in 340 metaprops of type "office" on 290 of 300 selected entities.',
        notes: [
          '4 of them already have "office" "archbishop". "bishop" is removed there.',
          '3 selected entities already have "office" "archbishop", but their "bishop" has other settings (such as elvl or certainty) or subproperties. They stay as they are and stay selected; remove "bishop" there in Detail.',
          '5 selected entities have no "office" "bishop" and stay as they are.',
          '"bishop" stays in 7 subproperties of type "office", which are not replaced.',
          "2 cannot change: 1x cannot use template in entity instance, 1x permission denied.",
        ],
        canConfirm: true,
      });
    });

    it("words the empty value", () => {
      expect(metapropReplaceLines(t, empty)).toEqual({
        headline:
          'Fill the empty value of 340 metaprops of type "office" with "archbishop" on 290 of 300 selected entities.',
        notes: [
          '4 of them already have "office" "archbishop". Their "office" without a value is removed there.',
          '3 selected entities already have "office" "archbishop", but their "office" without a value has other settings (such as elvl or certainty) or subproperties. They stay as they are and stay selected; remove "office" without a value there in Detail.',
          '5 selected entities have no "office" without a value and stay as they are.',
          '7 subproperties of type "office" without a value stay empty; they are not replaced.',
          "2 cannot change: 1x cannot use template in entity instance, 1x permission denied.",
        ],
        canConfirm: true,
      });
    });

    it("uses the singular forms", () => {
      expect(
        metapropReplaceLines(
          answer({ result: true, selected: 1, changed: 1, items: 1, nested: 1 }),
          metaNames
        )
      ).toEqual({
        headline:
          'Replace "bishop" with "archbishop" in 1 metaprop of type "office" on 1 of 1 selected entity.',
        notes: ['"bishop" stays in 1 subproperty of type "office", which is not replaced.'],
        canConfirm: true,
      });
      expect(metapropReplaceLines(answer({ selected: 1, skipped: 1 }), metaNames)).toEqual({
        headline: "The selected entity would not change.",
        notes: [
          '1 selected entity already has "office" "archbishop", but its "bishop" has other settings (such as elvl or certainty) or subproperties. It stays as it is and stays selected; remove "bishop" there in Detail.',
        ],
        canConfirm: false,
      });
      expect(metapropReplaceLines(answer({ selected: 1, unmatched: 1 }), metaNames).notes).toEqual([
        '1 selected entity has no "office" "bishop" and stays as it is.',
      ]);
    });

    it("uses the singular forms of the empty value", () => {
      expect(
        metapropReplaceLines(
          answer({
            result: true,
            selected: 3,
            changed: 1,
            merged: 1,
            skipped: 1,
            unmatched: 1,
            items: 1,
            nested: 1,
          }),
          empty
        )
      ).toEqual({
        headline:
          'Fill the empty value of 1 metaprop of type "office" with "archbishop" on 1 of 3 selected entities.',
        notes: [
          '1 of them already has "office" "archbishop". Its "office" without a value is removed there.',
          '1 selected entity already has "office" "archbishop", but its "office" without a value has other settings (such as elvl or certainty) or subproperties. It stays as it is and stays selected; remove "office" without a value there in Detail.',
          '1 selected entity has no "office" without a value and stays as it is.',
          '1 subproperty of type "office" without a value stays empty; it is not replaced.',
        ],
        canConfirm: true,
      });
    });

    it("cannot confirm when nothing would change", () => {
      const skippedNote =
        '2 selected entities already have "office" "archbishop", but their "bishop" has other settings (such as elvl or certainty) or subproperties. They stay as they are and stay selected; remove "bishop" there in Detail.';
      expect(metapropReplaceLines(answer({ selected: 2, skipped: 2 }), metaNames)).toEqual({
        headline: "None of the 2 selected entities would change.",
        notes: [skippedNote],
        canConfirm: false,
      });
    });
  });

  it("counts the skipped in the toast", () => {
    expect(batchReplaceToast({ total: t, sent: 300 }, 300)).toBe(
      "Replaced on 290 of 300 entities, 3 skipped, 2 could not change: 1x cannot use template in entity instance, 1x permission denied"
    );
  });

  it("concatenates the skipped ids of two answers", () => {
    expect(
      sumBatchReplace(answer({ skippedIds: ["a"] }), answer({ skippedIds: ["b"] })).skippedIds
    ).toEqual(["a", "b"]);
    expect(sumBatchReplace(answer({}), answer({ skippedIds: ["b"] })).skippedIds).toEqual(["b"]);
    expect("skippedIds" in sumBatchReplace(answer({}), answer({}))).toBe(false);
  });

  describe("rowsLeftSelected", () => {
    it("keeps the skipped and the failed rows", () => {
      expect(rowsLeftSelected({ total: t, sent: 300 })).toEqual(["s1", "s2", "s3", "a", "b"]);
    });
    it("clears the selection when every row changed", () => {
      expect(
        rowsLeftSelected({ total: answer({ result: true, selected: 3, changed: 3 }), sent: 3 })
      ).toEqual([]);
    });
    it("keeps the selection as it is when a request failed", () => {
      expect(rowsLeftSelected({ total: t, sent: 100, error: new Error() })).toBeNull();
    });
  });
});
