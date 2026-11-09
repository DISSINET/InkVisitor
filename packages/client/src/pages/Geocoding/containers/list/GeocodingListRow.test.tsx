import { IGeocodingPlaceType, defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlaceTypesProvider } from "../../hooks/placeTypesContext";
import { GeocodingLocation } from "../../hooks/useGeocodingLocations";
import { LocationTypeEntry } from "../../hooks/usePlaceTypeAssignments";
import { render, Rendered } from "../../utils/test/renderForTest";
import { GeocodingListRow } from "./GeocodingListRow";

/**
 * A row shows every location type of its Location side by side, the ones only
 * inferred paler, and counts what it has no room for.
 */

vi.mock("components/advanced", () => ({ EntityTag: () => null }));

const types: IGeocodingPlaceType[] = defaultPlaceTypes()
  .slice(0, 5)
  .map((one) => ({ ...one, conceptId: `c-${one.id}` }));

const entry = (index: number, over: Partial<LocationTypeEntry> = {}): LocationTypeEntry => ({
  typeId: types[index].id,
  inferred: false,
  via: `c-${types[index].id}`,
  shadowed: false,
  ...over,
});

const rowOf = (typeEntries: LocationTypeEntry[]) => {
  const location = {
    entity: { id: "L1", labels: ["Desio"] },
    isGeocoded: false,
    problem: null,
    placeType: typeEntries.find((one) => !one.shadowed)?.typeId ?? null,
    placeTypes: [],
    typeEntries,
  } as unknown as GeocodingLocation;
  const rowProps = {
    items: [{ kind: "row", location }],
    selectedId: undefined,
    engineReady: true,
    marked: new Set<string>(),
    onMarkRow: vi.fn(),
    onSelect: vi.fn(),
    onShowOnMap: vi.fn(),
    onGeocode: vi.fn(),
    onQuickGeocode: vi.fn(),
    quickStrategy: "topScore",
    quickBusyId: null,
    onToggleGroup: vi.fn(),
    onPick: vi.fn(),
  };
  const props = { index: 0, style: {}, ariaAttributes: {}, ...rowProps } as unknown as Parameters<
    typeof GeocodingListRow
  >[0];
  return (
    <PlaceTypesProvider placeTypes={types}>
      <GeocodingListRow {...props} />
    </PlaceTypesProvider>
  );
};

let view: Rendered;
afterEach(() => view?.unmount());

const marks = () => view.all("[data-row-type] > span");

describe("a list row's location types", () => {
  it("draws one mark for a Location with one location type, and no count", () => {
    view = render(rowOf([entry(0)]));
    expect(view.all("[data-row-type] svg")).toHaveLength(1);
    expect(view.texts("[data-row-type]")[0]).not.toContain("+");
  });

  it("draws each location type side by side, the inferred one paler than the direct one", () => {
    view = render(rowOf([entry(0), entry(1, { inferred: true, via: "c-city" })]));
    const [direct, inferred] = marks().map((node) => getComputedStyle(node).opacity);
    expect(marks()).toHaveLength(2);
    expect(direct).toBe("1");
    expect(inferred).toBe("0.5");
  });

  it("counts the location types beyond the three it has room for", () => {
    view = render(rowOf([0, 1, 2, 3, 4].map((index) => entry(index))));
    expect(marks().filter((node) => node.querySelector("svg"))).toHaveLength(3);
    expect(view.texts("[data-row-type]")[0]).toContain("+2");
  });

  it("leaves out a location type another lies below", () => {
    view = render(rowOf([entry(0), entry(1, { shadowed: true })]));
    expect(marks().filter((node) => node.querySelector("svg"))).toHaveLength(1);
  });
});
