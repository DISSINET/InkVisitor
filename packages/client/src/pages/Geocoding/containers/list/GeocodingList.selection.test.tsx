import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GeocodingLocation } from "../../hooks/useGeocodingLocations";
import { UseGeocodingBrowse } from "../../hooks/useGeocodingBrowse";
import { click, render, Rendered } from "../../utils/test/renderForTest";
import { GeocodingList } from "./GeocodingList";

/**
 * The list says what is selected, or that nothing is, in a bar that is always
 * there, and gives the one way to leave nothing selected.
 *
 * Everything the list draws beside that bar is replaced: the bar is what is
 * asserted.
 */

vi.mock("components/advanced", () => ({
  default: { Single: { Basic: () => null } },
  // the tag names the Location, which is what makes the bar readable
  EntityTag: ({ entity }: { entity: { labels: string[] } }) => <b data-tag>{entity.labels[0]}</b>,
}));
vi.mock("./GeocodingTerritoryFilter", () => ({
  GeocodingTerritoryFilter: () => null,
  useTerritoryLabel: () => undefined,
}));
vi.mock("./GeocodingFilterChips", () => ({ GeocodingFilterChips: () => null }));
vi.mock("react-window", () => ({ List: () => null }));
vi.mock("../../hooks/useGeocodingListScroll", () => ({
  useGeocodingListScroll: () => ({
    bodyRef: { current: null },
    parked: { above: [], below: [] },
    gutter: 0,
    goToGroup: vi.fn(),
    goToRow: vi.fn(),
  }),
}));

const browse = {
  all: [],
  visible: [],
  groups: [],
  isLoading: false,
  error: null,
  filters: { label: "", territoryId: "any", subTerritories: "included" },
  setFilter: vi.fn(),
  groupBy: "none",
  setGroupBy: vi.fn(),
  toggleGroup: vi.fn(),
  createdByOptions: [],
  optionCounts: { accuracy: {}, placeType: {} },
  placeTypeOptions: [],
  languageOptions: [],
  statusOptions: [],
  clearFilters: vi.fn(),
} as unknown as UseGeocodingBrowse;

const garsten = { entity: { id: "L1", labels: ["Garsten"] } } as unknown as GeocodingLocation;
const onDeselect = vi.fn();

let view: Rendered | null = null;
const mount = (over: { selected?: GeocodingLocation; canPlaceNew?: boolean } = {}) => {
  const props = {
    browse,
    selected: over.selected,
    selectedId: over.selected?.entity.id,
    onSelect: vi.fn(),
    onDeselect,
    canPlaceNew: over.canPlaceNew ?? true,
    onToggleType: vi.fn(),
    onShowOnMap: vi.fn(),
    onGeocode: vi.fn(),
    engineReady: true,
    marked: new Set<string>(),
    onMark: vi.fn(),
    onClearMarks: vi.fn(),
    onMarkedRetype: undefined,
    markedProgress: undefined,
    onCancelMarkedRetype: vi.fn(),
    onMarkedGeocode: undefined,
    onQuickGeocode: vi.fn(),
    quickBusyId: null,
    quickStrategy: "clearWinner",
    batch: null,
    onShowBatch: vi.fn(),
    onDismissBatch: vi.fn(),
  } as unknown as Parameters<typeof GeocodingList>[0];
  view = render(<GeocodingList {...props} />);
  return view;
};

afterEach(() => {
  view?.unmount();
  view = null;
  onDeselect.mockReset();
});

const bar = () => document.querySelector("[data-selection-bar]") as HTMLElement;

describe("the selection bar", () => {
  it("says which Location is selected, and offers to clear it", () => {
    mount({ selected: garsten });
    expect(bar().textContent).toContain("selected");
    expect(bar().querySelector("[data-tag]")?.textContent).toBe("Garsten");
    expect(bar().textContent).not.toContain("nothing selected");

    click(bar().querySelector("button"));
    expect(onDeselect).toHaveBeenCalledTimes(1);
  });

  it("says that nothing is selected, with nothing to clear", () => {
    mount();
    expect(bar().textContent).toContain("nothing selected");
    expect(bar().querySelector("button")).toBeNull();
    expect(bar().querySelector("[data-tag]")).toBeNull();
  });

  it("says what a click on the map does when nothing is selected, where it can start a Location", () => {
    mount({ canPlaceNew: true });
    expect(bar().textContent).toContain("click the map to start a new location");
  });

  it("does not promise a new Location where the page will not make one", () => {
    mount({ canPlaceNew: false });
    expect(bar().textContent).toContain("pick a row to geocode it");
    expect(bar().textContent).not.toContain("new location");
  });
});
