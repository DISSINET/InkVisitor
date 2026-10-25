import { IResponseClassifiedUnder } from "@inkvisitor/shared/types";
import { IGeocodingPlaceType, defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, Rendered } from "../utils/test/renderForTest";
import {
  PlaceTypeAssignments,
  orderedEntries,
  usePlaceTypeAssignments,
} from "./usePlaceTypeAssignments";

const api = vi.hoisted(() => ({
  entitiesClassifiedUnder: vi.fn(),
  entitiesGet: vi.fn(),
  isLoggedIn: () => true,
}));
vi.mock("api", () => ({ default: api }));

/**
 * What the page learns of the Concept hierarchy is what the server says: which of
 * the project's Concepts each classified entity comes under, and how. These test
 * what the page does with that, and that it asks once.
 */

const types: IGeocodingPlaceType[] = [
  { ...defaultPlaceTypes()[0], id: "settlement", name: "settlement", conceptId: "c-settlement" },
  { ...defaultPlaceTypes()[1], id: "fortress", name: "fortress", conceptId: "c-fortress" },
  { ...defaultPlaceTypes()[2], id: "church", name: "church", conceptId: "c-church" },
  { ...defaultPlaceTypes()[3], id: "unassigned", name: "unassigned", conceptId: "" },
];

const one = (concept: string, via: string, shadowed = false) => ({
  concept,
  via,
  inferred: via !== concept,
  shadowed,
});

describe("orderedEntries", () => {
  it("puts what a Location is classified under before what it is inferred to be, then what is shadowed", () => {
    const entries = orderedEntries(types, [
      one("c-settlement", "c-city", true),
      one("c-church", "c-parish church"),
      one("c-fortress", "c-fortress"),
    ]);
    expect(entries.map((entry) => [entry.typeId, entry.inferred, entry.shadowed])).toEqual([
      ["fortress", false, false],
      ["church", true, false],
      ["settlement", true, true],
    ]);
  });

  it("keeps the order the project lists its location types within each kind", () => {
    const entries = orderedEntries(types, [
      one("c-church", "c-church"),
      one("c-settlement", "c-settlement"),
    ]);
    expect(entries.map((entry) => entry.typeId)).toEqual(["settlement", "church"]);
  });

  it("drops a Concept that no location type is assigned", () => {
    expect(orderedEntries(types, [one("c-something-else", "c-something-else")])).toEqual([]);
  });
});

let result: PlaceTypeAssignments;
const Probe = (props: { types: IGeocodingPlaceType[]; only?: Set<string> }) => {
  result = usePlaceTypeAssignments(props.types, props.only);
  return null;
};

let view: Rendered;
let client: QueryClient;
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
const mount = async (props: React.ComponentProps<typeof Probe>) => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  view = render(
    <QueryClientProvider client={client}>
      <Probe {...props} />
    </QueryClientProvider>,
  );
  await settle();
};
const remount = async (props: React.ComponentProps<typeof Probe>) => {
  view.update(
    <QueryClientProvider client={client}>
      <Probe {...props} />
    </QueryClientProvider>,
  );
  await settle();
};

const answer = (response: IResponseClassifiedUnder) =>
  api.entitiesClassifiedUnder.mockResolvedValue({ data: response });

beforeEach(() => {
  api.entitiesClassifiedUnder.mockReset();
  api.entitiesGet.mockReset().mockResolvedValue({ data: [] });
});
afterEach(() => view?.unmount());

describe("usePlaceTypeAssignments", () => {
  it("asks once for every assigned Concept, and for none that is not assigned", async () => {
    answer({ entities: {}, truncated: [] });
    await mount({ types });
    expect(api.entitiesClassifiedUnder).toHaveBeenCalledTimes(1);
    expect(api.entitiesClassifiedUnder.mock.calls[0][0]).toEqual([
      "c-church",
      "c-fortress",
      "c-settlement",
    ]);
  });

  it("asks nothing where no location type has a Concept", async () => {
    await mount({ types: types.map((one) => ({ ...one, conceptId: "" })) });
    expect(api.entitiesClassifiedUnder).not.toHaveBeenCalled();
    expect(result.typesByLocation.size).toBe(0);
    expect(result.isLoading).toBe(false);
  });

  it("gives each Location the location types the server says it comes under", async () => {
    answer({
      entities: {
        direct: [one("c-settlement", "c-settlement")],
        inferred: [one("c-settlement", "c-city")],
      },
      truncated: [],
    });
    await mount({ types });
    expect(result.typesByLocation.get("direct")).toEqual([
      { typeId: "settlement", inferred: false, via: "c-settlement", shadowed: false },
    ]);
    expect(result.typesByLocation.get("inferred")).toEqual([
      { typeId: "settlement", inferred: true, via: "c-city", shadowed: false },
    ]);
    expect(result.typesByLocation.has("nobody")).toBe(false);
  });

  it("counts what reads as a type, inferred ones among them, and leaves out what is shadowed", async () => {
    answer({
      entities: {
        a: [one("c-settlement", "c-settlement")],
        b: [one("c-settlement", "c-city")],
        c: [one("c-settlement", "c-city", true), one("c-church", "c-church")],
      },
      truncated: [],
    });
    await mount({ types });
    expect(result.countByType).toMatchObject({ settlement: 2, church: 1, fortress: 0 });
    expect(result.inferredByType).toMatchObject({ settlement: 1, church: 0 });
  });

  it("counts only the Locations it is given, and the rest still have their types", async () => {
    answer({
      entities: {
        location: [one("c-settlement", "c-settlement")],
        group: [one("c-settlement", "c-settlement")],
      },
      truncated: [],
    });
    await mount({ types, only: new Set(["location"]) });
    expect(result.countByType.settlement).toBe(1);
    expect(result.typesByLocation.has("group")).toBe(true);
  });

  it("names the location types whose Concept had more subclasses than could be followed", async () => {
    answer({ entities: {}, truncated: ["c-settlement"] });
    await mount({ types });
    expect(result.truncatedTypes).toEqual(["settlement"]);
  });

  it("calls the count of a Concept just assigned unknown rather than zero while its answer is awaited", async () => {
    answer({ entities: { a: [one("c-settlement", "c-settlement")] }, truncated: [] });
    await mount({ types });
    expect(result.pendingTypes).toEqual([]);

    // the next answer never arrives
    api.entitiesClassifiedUnder.mockReturnValue(new Promise(() => undefined));
    await remount({
      types: types.map((one) => (one.id === "unassigned" ? { ...one, conceptId: "c-new" } : one)),
    });

    expect(result.pendingTypes).toEqual(["unassigned"]);
    // what was already answered stays on screen meanwhile
    expect(result.countByType.settlement).toBe(1);
  });

  it("fetches the Concepts a type is inferred through, and only those, for the tooltip", async () => {
    api.entitiesGet.mockResolvedValue({ data: [{ id: "c-city", labels: ["city"] }] });
    answer({
      entities: {
        a: [one("c-settlement", "c-settlement")],
        b: [one("c-settlement", "c-city")],
      },
      truncated: [],
    });
    await mount({ types });
    expect(api.entitiesGet).toHaveBeenCalledWith(["c-city"]);
    expect(result.viaLabels).toEqual({ "c-city": "city" });
  });

  it("reports a failed request rather than reading it as no location types", async () => {
    api.entitiesClassifiedUnder.mockRejectedValue(new Error("down"));
    await mount({ types });
    expect(result.error).toBeTruthy();
  });
});
