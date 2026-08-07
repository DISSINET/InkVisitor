import { DropdownItem } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import {
  clearSelection,
  filterOptions,
  getDisabledIndices,
  popLastSelection,
  removeChip,
  toggleSelection,
} from "./dropdownLogic";

const A: DropdownItem = { value: "A", label: "Action" };
const B: DropdownItem = { value: "B", label: "Being" };
const C: DropdownItem = { value: "C", label: "Concept" };
const DIS: DropdownItem = { value: "D", label: "Disabled", isDisabled: true };

describe("filterOptions", () => {
  it("returns all options for empty/whitespace search", () => {
    expect(filterOptions([A, B], "")).toEqual([A, B]);
    expect(filterOptions([A, B], "   ")).toEqual([A, B]);
  });
  it("matches case-insensitive substrings of the label", () => {
    expect(filterOptions([A, B, C], "cep")).toEqual([C]);
    expect(filterOptions([A, B, C], "ACT")).toEqual([A]);
  });
  it("matches nothing when no label contains the needle", () => {
    expect(filterOptions([A, B], "xyz")).toEqual([]);
  });
});

describe("toggleSelection", () => {
  it("single: replaces the selection and reports select", () => {
    expect(toggleSelection([A], B, false)).toEqual({
      next: [B],
      meta: { action: "select", option: B },
    });
  });
  it("single: re-selecting the same option keeps it selected", () => {
    expect(toggleSelection([A], A, false).next).toEqual([A]);
  });
  it("multi: appends unselected option and reports select", () => {
    expect(toggleSelection([A], B, true)).toEqual({
      next: [A, B],
      meta: { action: "select", option: B },
    });
  });
  it("multi: removes already-selected option and reports deselect", () => {
    expect(toggleSelection([A, B], A, true)).toEqual({
      next: [B],
      meta: { action: "deselect", option: A },
    });
  });
});

describe("removeChip / clearSelection", () => {
  it("removeChip filters by value and reports remove-chip", () => {
    expect(removeChip([A, B], A)).toEqual({
      next: [B],
      meta: { action: "remove-chip", option: A },
    });
  });
  it("clearSelection empties and reports clear", () => {
    expect(clearSelection()).toEqual({ next: [], meta: { action: "clear" } });
  });
});

describe("popLastSelection", () => {
  it("drops the last selection and reports pop with that option", () => {
    expect(popLastSelection([A, B])).toEqual({
      next: [A],
      meta: { action: "pop", option: B },
    });
  });
  // Backspace is gated on value.length > 0 in useDropdown, so the empty-array
  // case (option: undefined) is never reached in practice — not asserted here.
});

describe("getDisabledIndices", () => {
  it("lists indices of isDisabled options", () => {
    expect(getDisabledIndices([A, DIS, B])).toEqual([1]);
    expect(getDisabledIndices([A, B])).toEqual([]);
  });
});
