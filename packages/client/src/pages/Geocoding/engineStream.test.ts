import { afterEach, describe, expect, it, vi } from "vitest";
import { __testing } from "./engine";
import { __testing as panel } from "./GeocodingSuggestions";
import { SuggestResponse } from "./engineTypes";

const { consumeSuggestStream, fixtureStream } = __testing;

/**
 * Whether a `/suggest/stream` request sends a preview before its answer is the
 * engine's decision, not the caller's: a query it has answered within the last
 * six hours arrives as one `final` frame and nothing else. Anything that waits
 * for `provisional` therefore hangs on exactly the requests that were meant to
 * be instant.
 */

const streamOf = (chunks: string[]): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
};

const frame = (event: string, body: Partial<SuggestResponse>) =>
  `event: ${event}\ndata: ${JSON.stringify(body)}\n\n`;

const preview = {
  phase: "provisional",
  suggestions: [{ label: "first" }],
} as unknown as SuggestResponse;
const answer = {
  phase: "final",
  cached: false,
  suggestions: [{ label: "second" }, { label: "first" }],
} as unknown as SuggestResponse;

describe("consumeSuggestStream", () => {
  it("resolves on a final frame that arrived with no preview before it", async () => {
    const onProvisional = vi.fn();
    const result = await consumeSuggestStream(
      streamOf([frame("final", { ...answer, cached: true })]),
      onProvisional,
      vi.fn(),
    );
    expect(result.cached).toBe(true);
    expect(onProvisional).not.toHaveBeenCalled();
  });

  it("returns the final frame rather than the preview it replaces", async () => {
    const onProvisional = vi.fn();
    const result = await consumeSuggestStream(
      streamOf([frame("provisional", preview), frame("final", answer)]),
      onProvisional,
      vi.fn(),
    );
    expect(result.suggestions.map((s) => s.label)).toEqual(["second", "first"]);
    expect(onProvisional).toHaveBeenCalledTimes(1);
    const seen = onProvisional.mock.calls[0][0].suggestions;
    expect(seen.map((s: { label: string }) => s.label)).toEqual(["first"]);
  });

  it("refuses a stream that closed after the preview", async () => {
    await expect(
      consumeSuggestStream(streamOf([frame("provisional", preview)]), vi.fn(), vi.fn()),
    ).rejects.toThrow(/without a final result/);
  });

  it("reads a frame split across two chunks", async () => {
    const whole = frame("final", answer);
    const cut = Math.floor(whole.length / 2);
    const result = await consumeSuggestStream(
      streamOf([whole.slice(0, cut), whole.slice(cut)]),
      vi.fn(),
      vi.fn(),
    );
    expect(result.suggestions).toHaveLength(2);
  });

  it("takes a frame naming itself provisional in the body as the preview", async () => {
    const onProvisional = vi.fn();
    await consumeSuggestStream(
      streamOf([`data: ${JSON.stringify(preview)}\n\n`, frame("final", answer)]),
      onProvisional,
      vi.fn(),
    );
    expect(onProvisional).toHaveBeenCalledTimes(1);
  });

  it("reports the request id from the opening frame and renders nothing for it", async () => {
    const onAccepted = vi.fn();
    const onProvisional = vi.fn();
    const result = await consumeSuggestStream(
      streamOf([
        'event: accepted\ndata: {"phase":"accepted","requestId":"e07a3678"}\n\n',
        frame("provisional", preview),
        frame("final", answer),
      ]),
      onProvisional,
      onAccepted,
    );
    expect(onAccepted).toHaveBeenCalledWith("e07a3678");
    expect(onProvisional).toHaveBeenCalledTimes(1);
    expect(result.suggestions).toHaveLength(2);
  });

  it("refuses a stream carrying an opening frame and nothing else", async () => {
    // the opening frame has no suggestions at all, so treating it as the answer
    // is not a wrong list but a crash in whatever reads one
    await expect(
      consumeSuggestStream(
        streamOf(['event: accepted\ndata: {"phase":"accepted","requestId":"e07a3678"}\n\n']),
        vi.fn(),
        vi.fn(),
      ),
    ).rejects.toThrow(/without a final result/);
  });

  it("refuses a stream that ended on an error frame", async () => {
    await expect(
      consumeSuggestStream(
        streamOf([
          'event: accepted\ndata: {"phase":"accepted","requestId":"e07a3678"}\n\n',
          'event: error\ndata: {"phase":"error","message":"upstream refused"}\n\n',
        ]),
        vi.fn(),
        vi.fn(),
      ),
    ).rejects.toThrow(/without a final result/);
  });

  it("reads a last frame that arrived without its blank-line terminator", async () => {
    const whole = frame("final", answer);
    const result = await consumeSuggestStream(streamOf([whole.trimEnd()]), vi.fn(), vi.fn());
    expect(result.suggestions).toHaveLength(2);
  });

  it("ignores a frame whose data is not json", async () => {
    const result = await consumeSuggestStream(
      streamOf(["event: final\ndata: {oops\n\n", frame("final", answer)]),
      vi.fn(),
      vi.fn(),
    );
    expect(result.suggestions).toHaveLength(2);
  });
});

/**
 * The recorded response is served on the same call the page makes, because a
 * second code path for it is a path nobody runs and nobody notices going wrong.
 */
describe("fixtureStream", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("delivers a preview and then the answer that replaces it", async () => {
    vi.useFakeTimers();
    const onProvisional = vi.fn();
    const pending = fixtureStream(onProvisional, vi.fn());
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(onProvisional).toHaveBeenCalledTimes(1);
    const preview = onProvisional.mock.calls[0][0];
    expect(preview.phase).toBe("provisional");
    // the preview is a different object, so replacing the list is a real
    // replacement rather than the same array read twice
    expect(preview).not.toBe(result);
    expect(result.suggestions).toHaveLength(preview.suggestions.length);
  });

  it("leaves the rating and what it is measured on out of the preview", async () => {
    vi.useFakeTimers();
    const onProvisional = vi.fn();
    const pending = fixtureStream(onProvisional, vi.fn());
    await vi.runAllTimersAsync();
    const result = await pending;

    const preview = onProvisional.mock.calls[0][0];
    expect("margin" in preview).toBe(false);
    expect("contextEvaluated" in preview).toBe(false);
    expect("log" in preview).toBe(false);
    // the radius every scatter flag is measured against, so a preview carrying
    // it would flag cards a frame before the order they sit in is settled
    expect("mergeRadiusKm" in preview).toBe(false);
    expect(result.mergeRadiusKm).toBeGreaterThan(0);
    expect(result.margin).not.toBeUndefined();
  });

  it("reports a request id, so the progress watch has the same shape as a real run", async () => {
    vi.useFakeTimers();
    const onAccepted = vi.fn();
    const pending = fixtureStream(vi.fn(), onAccepted);
    await vi.runAllTimersAsync();
    await pending;
    expect(onAccepted).toHaveBeenCalledTimes(1);
    expect(onAccepted.mock.calls[0][0]).toBeTruthy();
  });

  it("rejects when the caller abandons it, the way a real request does", async () => {
    const controller = new AbortController();
    const pending = fixtureStream(vi.fn(), vi.fn(), controller.signal);
    controller.abort();
    await expect(pending).rejects.toThrow(/Aborted/);
  });
});

/**
 * `elapsed_ms` is honest on a cached response and still misleading: it measures
 * the cache, not the work the reader takes the number for.
 */
describe("timing", () => {
  it("names the cache rather than timing it", () => {
    expect(panel.timing({ cached: true, elapsed_ms: 2 } as SuggestResponse)).toBe(
      "from the engine's cache",
    );
  });

  it("reports the duration of a response the engine actually computed", () => {
    expect(panel.timing({ cached: false, elapsed_ms: 8666 } as SuggestResponse)).toBe("8.7s");
  });

  it("reports a duration where the engine says nothing about its cache", () => {
    expect(panel.timing({ elapsed_ms: 11100 } as SuggestResponse)).toBe("11.1s");
  });
});
