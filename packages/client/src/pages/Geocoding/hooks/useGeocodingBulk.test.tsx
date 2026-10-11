import { IGeocodingContext, IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, Rendered } from "../utils/test/renderForTest";
import { GeocodingLocation } from "./useGeocodingLocations";
import { UseGeocodingBulk, useGeocodingBulk } from "./useGeocodingBulk";

const stream = vi.hoisted(() => vi.fn());
const toasts = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn(), success: vi.fn(), dismiss: vi.fn() }));

// the engine is the boundary: what is asserted is what the runs do with an
// answer that never comes, not what the engine would say
vi.mock("../utils/engine/engine", () => ({ engineSuggestStream: stream }));
vi.mock("react-toastify", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-toastify")>()),
  toast: toasts,
}));

const location = (id: string): GeocodingLocation =>
  ({ entity: { id, labels: [id] }, isGeocoded: false }) as unknown as GeocodingLocation;

const places = ["Roma", "Pavia", "Siena"].map(location);

let bulk: UseGeocodingBulk;
const Probe = (props: { marked: Set<string> }) => {
  bulk = useGeocodingBulk({
    user: { options: {} } as never,
    roles: {} as IGeocodingRoles,
    context: {} as IGeocodingContext,
    locations: places,
    markWritten: vi.fn(),
    marked: props.marked,
    setMarked: vi.fn(),
    write: vi.fn().mockResolvedValue(true),
    retype: vi.fn().mockResolvedValue(true),
    refresh: vi.fn(),
    clearSuggestions: vi.fn(),
    onSelect: vi.fn(),
    onShowOnMap: vi.fn(),
  });
  return null;
};

let view: Rendered;
beforeEach(() => {
  stream.mockReset();
  Object.values(toasts).forEach((fn) => fn.mockReset());
  view = render(<Probe marked={new Set(places.map((one) => one.entity.id))} />);
});
afterEach(() => view.unmount());

const stateOf = (id: string) => bulk.batch?.steps.find((step) => step.id === id)?.state;

describe("a batch over the marked Locations when the engine does not answer", () => {
  it("files the first as failed with the engine's message and asks no further", async () => {
    stream.mockRejectedValue(new Error("engine is down"));
    await act(async () => {
      await bulk.geocodeMarked();
    });
    expect(stream).toHaveBeenCalledTimes(1);
    expect(stateOf("Roma")).toBe("failed");
    expect(bulk.batch?.steps[0].note).toBe("engine is down");
    // not asked, so not filed as "skipped: no gazetteer offered a place"
    expect(stateOf("Pavia")).toBe("waiting");
    expect(stateOf("Siena")).toBe("waiting");
    expect(bulk.batch?.done).toBe(true);
  });
});

describe("a quick geocode when the engine does not answer", () => {
  it("says the engine failed rather than that the Location was left for the researcher", async () => {
    stream.mockRejectedValue(new Error("engine is down"));
    await act(async () => {
      await bulk.quickGeocode(places[0]);
    });
    expect(toasts.error).toHaveBeenCalledTimes(1);
    expect(String(toasts.error.mock.calls[0][0])).toContain("engine is down");
    expect(toasts.warn).not.toHaveBeenCalled();
  });
});

describe("stopping a run", () => {
  it("drops the request in flight and files the step as stopped rather than failed", async () => {
    stream.mockImplementation(
      (_query, _a, _b, signal: AbortSignal) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))),
        ),
    );
    let running: Promise<void>;
    await act(async () => {
      running = bulk.geocodeMarked();
    });
    await act(async () => {
      bulk.stopBulk();
      await running;
    });
    expect(stateOf("Roma")).toBe("skipped");
    expect(bulk.batch?.stopped).toBe(true);
    expect(stream).toHaveBeenCalledTimes(1);
  });
});
