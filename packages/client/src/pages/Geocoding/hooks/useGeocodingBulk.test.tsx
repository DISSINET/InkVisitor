import {
  IGeocodingContext,
  IGeocodingRoles,
  defaultCiteWithinKm,
} from "@inkvisitor/shared/types/geocoding";
import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import breslau from "../fixtures/suggest-breslau.json";
import { Suggestion } from "../types/engine";
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

const write = vi.hoisted(() => vi.fn());

let bulk: UseGeocodingBulk;
const MARKED = { accuracyWhenAgree: "c-agree", accuracyWhenScattered: "c-scattered" };

const Probe = (props: {
  marked: Set<string>;
  context?: Partial<IGeocodingContext>;
  marks?: Partial<IGeocodingRoles>;
}) => {
  bulk = useGeocodingBulk({
    user: { options: {} } as never,
    roles: {
      placeTypes: [],
      citeWithinKm: defaultCiteWithinKm(),
      ...MARKED,
      ...props.marks,
    } as unknown as IGeocodingRoles,
    context: {
      quickStrategy: "topScore",
      quickTakeOffRegion: true,
      ...props.context,
    } as IGeocodingContext,
    locations: places,
    markWritten: vi.fn(),
    marked: props.marked,
    setMarked: vi.fn(),
    write,
    retype: vi.fn().mockResolvedValue(true),
    refresh: vi.fn(),
    clearSuggestions: vi.fn(),
    onSelect: vi.fn(),
    onShowOnMap: vi.fn(),
    accuracyLabelOf: (accuracy) => `label of ${accuracy}`,
  });
  return null;
};

let view: Rendered;
beforeEach(() => {
  stream.mockReset();
  write.mockReset();
  Object.values(toasts).forEach((fn) => fn.mockReset());
  view = render(<Probe marked={new Set(places.map((one) => one.entity.id))} />);
});
afterEach(() => view.unmount());

const stateOf = (id: string) => bulk.batch?.steps.find((step) => step.id === id)?.state;

describe("a batch where the project marked no accuracy to take", () => {
  it.each([
    ["for scattered sources", { accuracyWhenScattered: "" }],
    ["for sources that agree", { accuracyWhenAgree: "" }],
  ])("asks the engine nothing and says what is missing, with none marked %s", async (_, marks) => {
    view.unmount();
    view = render(<Probe marked={new Set(places.map((one) => one.entity.id))} marks={marks} />);
    await act(async () => {
      await bulk.geocodeMarked();
    });
    expect(stream).not.toHaveBeenCalled();
    expect(bulk.batch?.steps[0].note).toContain("accuracy");
  });
});

describe("a suggestion chosen out of the batch window where no accuracy is marked for it", () => {
  it("writes nothing and says which mark is missing", async () => {
    view.unmount();
    view = render(
      <Probe marked={new Set(places.map((one) => one.entity.id))} marks={{ accuracyWhenAgree: "" }} />,
    );
    const agreeing = { lat: 41.9, lon: 12.5, spreadKm: 0, matches: [{}, {}] } as unknown as Suggestion;
    await act(async () => {
      await bulk.assignFromBatch({ id: places[0].entity.id, label: "Roma", state: "skipped" }, agreeing);
    });
    expect(write).not.toHaveBeenCalled();
    expect(String(toasts.warn.mock.calls[0]?.[0])).toContain("sources that agree");
  });
});

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

describe("a batch whose write is refused", () => {
  it("files the step as failed with a reason and stops, rather than reporting the engine as silent", async () => {
    stream.mockResolvedValue(breslau);
    write.mockResolvedValue(false);
    await act(async () => {
      await bulk.geocodeMarked();
    });
    expect(write).toHaveBeenCalledTimes(1);
    expect(stateOf("Roma")).toBe("failed");
    expect(bulk.batch?.steps[0].note).toContain("could not be saved");
    expect(stateOf("Pavia")).toBe("waiting");
  });
});

describe("a quick geocode in a corpus that names one location type for all of it", () => {
  const settlement = { recordPlaceType: false, defaultPlaceType: "settlement" };
  const entry = (inferred: boolean) => ({
    typeId: "settlement",
    inferred,
    via: "c-city",
    shadowed: false,
  });

  const quickWith = async (typeEntries: unknown[]) => {
    view.unmount();
    view = render(<Probe marked={new Set()} context={settlement} />);
    stream.mockResolvedValue(breslau);
    write.mockResolvedValue(true);
    await act(async () => {
      await bulk.quickGeocode({ ...places[0], typeEntries } as unknown as GeocodingLocation);
    });
    return write.mock.calls[0][0].placeType;
  };

  it("writes that location type for a Location that has none", async () => {
    expect(await quickWith([])).toBe("settlement");
  });

  it("writes none for a Location that already comes under it through a subclass", async () => {
    expect(await quickWith([entry(true)])).toBeUndefined();
  });
});

/**
 * A quick geocode asks the engine with the project's rule for a suggestion's
 * coordinate, and cites only the gazetteers whose records lie within the citing
 * distance of the search it ran.
 */
describe("what a quick geocode asks and cites", () => {
  const everySource = Object.fromEntries(
    (breslau as unknown as { suggestions: { matches: { source: string }[] }[] }).suggestions
      .flatMap((one) => one.matches.map((match) => match.source))
      .map((source) => [source, `r-${source}`]),
  );
  const everywhere = (km: number) =>
    Object.fromEntries(Object.keys(defaultCiteWithinKm()).map((type) => [type, km]));

  const quickWith = async (marks: Partial<IGeocodingRoles>) => {
    view.unmount();
    view = render(<Probe marked={new Set()} marks={{ resources: everySource, ...marks }} />);
    stream.mockResolvedValue(breslau);
    write.mockResolvedValue(true);
    await act(async () => {
      await bulk.quickGeocode(places[0]);
    });
  };

  it("sends the project's rule, and none where the project leaves the engine's own", async () => {
    await quickWith({ representative: "medoid" });
    expect(stream.mock.calls[0][0].representative).toBe("medoid");
    stream.mockClear();
    await quickWith({ representative: "" });
    expect("representative" in stream.mock.calls[0][0]).toBe(false);
  });

  it("cites by the citing distance: fewer gazetteers the shorter it is", async () => {
    await quickWith({ citeWithinKm: everywhere(1000) });
    const wide = write.mock.calls[0][0].provenance.length;
    write.mockClear();
    await quickWith({ citeWithinKm: everywhere(0.001) });
    const narrow = write.mock.calls[0][0].provenance.length;
    expect(wide).toBeGreaterThan(1);
    expect(narrow).toBeLessThan(wide);
  });
});
