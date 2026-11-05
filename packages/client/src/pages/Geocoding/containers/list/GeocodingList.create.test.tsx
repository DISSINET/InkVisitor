import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UseGeocodingBrowse } from "../../hooks/useGeocodingBrowse";
import { click, render, Rendered } from "../../utils/test/renderForTest";
import { GeocodingList } from "./GeocodingList";

/**
 * The list offers to make a Location only to someone who may, and the button
 * does nothing but ask the page to open the dialog.
 *
 * Everything the list draws beside its header is replaced: the header is what
 * is asserted, and the filters, the territory tree and the virtualised rows are
 * covered where they are their own subject.
 */

vi.mock("components/advanced", () => ({
  default: { Single: { Basic: () => null } },
  EntityTag: () => null,
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

let view: Rendered | null = null;

const mount = (onCreate?: () => void) => {
  const props = {
    browse,
    selectedId: undefined,
    onSelect: vi.fn(),
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
    onCreate,
  } as unknown as Parameters<typeof GeocodingList>[0];
  view = render(<GeocodingList {...props} />);
  return view;
};

afterEach(() => {
  view?.unmount();
  view = null;
});

describe("the new location button", () => {
  it("is not drawn when the page says this person may not create one", () => {
    mount(undefined);
    expect(view!.all("button")).toHaveLength(0);
  });

  it("asks the page to open the dialog, and does nothing else", () => {
    const onCreate = vi.fn();
    mount(onCreate);

    const buttons = view!.all("button");
    expect(buttons).toHaveLength(1);
    click(buttons[0]);

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(browse.clearFilters).not.toHaveBeenCalled();
  });
});
