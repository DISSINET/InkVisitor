/**
 * Phase 3 pivot — caret always-in-bounds invariant (fuzz).
 *
 * The recurring class of bugs (#1/#3/#4) was the caret drifting out of bounds via
 * the visual clamp/wrap/repair dance. This fuzzes long sequences of real key
 * events from several starting documents and asserts, after EVERY key, that the
 * caret is a valid position:
 *   - yLine in [0, noLines-1]
 *   - xLine in [0, current visual line length]
 *   - the visual caret maps to a raw offset in [0, value.length]
 *   - selection endpoints (if any) are likewise valid
 *
 * Seeded PRNG ⇒ reproducible. If this ever fails, the seed + step pinpoint it.
 */
import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";

const mk = (text: string, mode: EditMode, charsAtLine: number): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(mode);
  a.text.updateCharsAtLine(charsAtLine);
  return a;
};

// Mulberry32 — tiny deterministic PRNG.
const prng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type KeySpec = { key: string; mods?: Partial<KeyboardEvent> };
const KEYS: KeySpec[] = [
  { key: "ArrowLeft" },
  { key: "ArrowRight" },
  { key: "ArrowUp" },
  { key: "ArrowDown" },
  { key: "ArrowLeft", mods: { shiftKey: true } },
  { key: "ArrowRight", mods: { shiftKey: true } },
  { key: "ArrowUp", mods: { shiftKey: true } },
  { key: "ArrowDown", mods: { shiftKey: true } },
  { key: "ArrowLeft", mods: { ctrlKey: true } },
  { key: "ArrowRight", mods: { ctrlKey: true } },
  { key: "Home" },
  { key: "End" },
  { key: "Home", mods: { ctrlKey: true } },
  { key: "End", mods: { ctrlKey: true } },
  { key: "a" },
  { key: "Z" },
  { key: " " },
  { key: "Backspace" },
  { key: "Delete" },
  { key: "Enter" },
];

const sendKey = (a: Annotator, spec: KeySpec) =>
  a.keys.onKeyDown({
    key: spec.key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    code: "",
    preventDefault: () => {},
    ...spec.mods,
  } as KeyboardEvent);

const assertPointInBounds = (a: Annotator, x: number, y: number, ctx: string) => {
  expect(`${ctx} yLine=${y}`).toBe(
    `${ctx} yLine=${Math.max(0, Math.min(y, a.text.noLines - 1)) === y ? y : "OOB"}`
  );
  const lineLen = (a.text.getLine(y) ?? "").length;
  expect(`${ctx} xLine=${x} (lineLen=${lineLen})`).toBe(
    `${ctx} xLine=${x >= 0 && x <= lineLen ? x : "OOB"} (lineLen=${lineLen})`
  );
  const off = a.text.offsetFromVisual(x, y);
  expect(`${ctx} offset=${off}`).toBe(
    `${ctx} offset=${off >= 0 && off <= a.text.value.length ? off : "OOB"}`
  );
};

const DOCS: Array<{ name: string; text: string; mode: EditMode; w: number }> = [
  { name: "short-multiline", text: "abcde\nfghij\nklmno", mode: EditMode.RAW, w: 100 },
  { name: "wrapped", text: "supercalifragilisticexpialidocious word two", mode: EditMode.RAW, w: 10 },
  { name: "empty", text: "", mode: EditMode.RAW, w: 100 },
  { name: "single", text: "x", mode: EditMode.RAW, w: 100 },
  { name: "highlight-tags", text: "ab<x>hello</x>cd\nmore text here", mode: EditMode.HIGHLIGHT, w: 100 },
];

describe("caret stays in bounds under fuzzed key sequences", () => {
  for (const doc of DOCS) {
    for (const seed of [1, 7, 42, 1337]) {
      test(`${doc.name} seed=${seed}`, () => {
        const a = mk(doc.text, doc.mode, doc.w);
        a.cursor.setPosition(0, 0);
        const rand = prng(seed);
        for (let step = 0; step < 200; step++) {
          const spec = KEYS[Math.floor(rand() * KEYS.length)];
          sendKey(a, spec);
          const ctx = `${doc.name} seed=${seed} step=${step} key=${spec.key}`;
          assertPointInBounds(a, a.cursor.xLine, a.cursor.yLine, ctx);
          if (a.cursor.selectStart) {
            assertPointInBounds(
              a,
              a.cursor.selectStart.xLine,
              a.cursor.selectStart.yLine,
              `${ctx} selStart`
            );
          }
          if (a.cursor.selectEnd) {
            assertPointInBounds(
              a,
              a.cursor.selectEnd.xLine,
              a.cursor.selectEnd.yLine,
              `${ctx} selEnd`
            );
          }
        }
      });
    }
  }
});
