import { IGeocodingPlaceType, defaultPlaceTypes, emptyGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, Rendered } from "../utils/test/renderForTest";
import { UseGeocodingLocations, useGeocodingLocations } from "./useGeocodingLocations";

const api = vi.hoisted(() => ({
  entitiesSearch: vi.fn(),
  entitiesClassifiedUnder: vi.fn(),
  entitiesGet: vi.fn(),
  isLoggedIn: () => true,
}));
vi.mock("api", () => ({ default: api }));

/**
 * A Location whose classifications could not be read looks like one with no
 * location type. The hook has to say the read failed, or the page cannot tell the
 * two apart.
 */

const types: IGeocodingPlaceType[] = [
  { ...defaultPlaceTypes()[0], id: "settlement", name: "settlement", conceptId: "c-settlement" },
];
const roles = { ...emptyGeocodingRoles(), placeTypes: types };

let result: UseGeocodingLocations;
const Probe = () => {
  result = useGeocodingLocations(roles, {});
  return null;
};

let view: Rendered;
const mount = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  view = render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
};

beforeEach(() => {
  api.entitiesSearch.mockReset().mockResolvedValue({ data: [{ id: "L1", labels: ["Desio"], props: [] }] });
  api.entitiesClassifiedUnder.mockReset();
  api.entitiesGet.mockReset().mockResolvedValue({ data: [] });
});
afterEach(() => view?.unmount());

describe("useGeocodingLocations and the location types", () => {
  it("lists the Locations and reports no type error where the classifications were read", async () => {
    api.entitiesClassifiedUnder.mockResolvedValue({
      data: { entities: { L1: [{ concept: "c-settlement", via: "c-settlement", inferred: false, shadowed: false }] }, truncated: [] },
    });
    await mount();
    expect(result.typesError).toBe(false);
    expect(result.locations.map((one) => one.placeTypes)).toEqual([["settlement"]]);
  });

  it("reports that the classifications could not be read, with the Locations still listed", async () => {
    api.entitiesClassifiedUnder.mockRejectedValue(new Error("down"));
    await mount();
    expect(result.typesError).toBe(true);
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0].placeTypes).toEqual([]);
  });
});
