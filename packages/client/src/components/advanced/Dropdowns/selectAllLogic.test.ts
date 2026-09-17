import { allEntities, empty } from "@inkvisitor/shared/dictionaries/entity";
import { DropdownItem } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import {
  resolveAttributeMultiChange,
  resolveEntityMultiChange,
} from "./selectAllLogic";

const A: DropdownItem = { value: "A", label: "Action" };
const B: DropdownItem = { value: "B", label: "Being" };
const C: DropdownItem = { value: "C", label: "Concept" };
const OPTS = [A, B, C];
const ANY = allEntities; // value: EntityEnums.Extension.Any
const E = empty; //         value: EntityEnums.Extension.Empty

describe("resolveEntityMultiChange (parity with pre-rewrite EntityMultiDropdown)", () => {
  it("plain select adds the option", () => {
    expect(
      resolveEntityMultiChange({ selected: [B], action: "select", options: OPTS, disableEmpty: false })
    ).toEqual(["B"]);
  });

  it("selecting ANY expands to empty + ANY + all classes", () => {
    expect(
      resolveEntityMultiChange({ selected: [B, ANY], action: "select", options: OPTS, disableEmpty: false })
    ).toEqual([E.value, ANY.value, "A", "B", "C"]);
  });

  it("selecting ANY with disableEmpty expands without empty", () => {
    expect(
      resolveEntityMultiChange({ selected: [B, ANY], action: "select", options: OPTS, disableEmpty: true })
    ).toEqual([ANY.value, "A", "B", "C"]);
  });

  it("selecting the last missing class lights ANY (expands to any-equivalent)", () => {
    expect(
      resolveEntityMultiChange({ selected: [A, B, C], action: "select", options: OPTS, disableEmpty: false })
    ).toEqual([E.value, ANY.value, "A", "B", "C"]);
  });

  it("deselecting one class while ANY lit drops ANY and that class", () => {
    // display order: specials first, classes after (variant builds value that way)
    expect(
      resolveEntityMultiChange({ selected: [E, ANY, A, B], action: "deselect", options: OPTS, disableEmpty: false })
    ).toEqual([E.value, "A", "B"]);
  });

  it("deselecting ANY when everything selected keeps only empty (empty was selected)", () => {
    expect(
      resolveEntityMultiChange({ selected: [E, A, B, C], action: "deselect", options: OPTS, disableEmpty: false })
    ).toEqual([E.value]);
  });

  it("deselecting ANY when all classes but no empty selected clears", () => {
    expect(
      resolveEntityMultiChange({ selected: [A, B, C], action: "deselect", options: OPTS, disableEmpty: true })
    ).toEqual([]);
  });

  it("deselecting empty while all classes + ANY stay selected keeps them (ANY value retained)", () => {
    expect(
      resolveEntityMultiChange({ selected: [ANY, A, B, C], action: "deselect", options: OPTS, disableEmpty: false })
    ).toEqual([ANY.value, "A", "B", "C"]);
  });

  it("plain deselect below all-selected just returns the remainder", () => {
    expect(
      resolveEntityMultiChange({ selected: [A], action: "deselect", options: OPTS, disableEmpty: false })
    ).toEqual(["A"]);
  });

  it("deselecting to empty selection returns []", () => {
    expect(
      resolveEntityMultiChange({ selected: [], action: "deselect", options: OPTS, disableEmpty: false })
    ).toEqual([]);
  });

  it("clear returns []", () => {
    expect(
      resolveEntityMultiChange({ selected: [], action: "clear", options: OPTS, disableEmpty: false })
    ).toEqual([]);
  });

  it("remove-chip of a class while ANY lit retains ANY in values (display recomputes)", () => {
    // parity quirk: old code's remove-value fell through to the default branch
    expect(
      resolveEntityMultiChange({ selected: [E, ANY, A, B], action: "remove-chip", options: OPTS, disableEmpty: false })
    ).toEqual([E.value, ANY.value, "A", "B"]);
  });

  it("popping (Backspace) while ANY lit falls through unchanged — parity with old pop-value", () => {
    expect(
      resolveEntityMultiChange({ selected: [E, ANY, A, B], action: "pop", options: OPTS, disableEmpty: false })
    ).toEqual([E.value, ANY.value, "A", "B"]);
  });
});

describe("resolveAttributeMultiChange (parity with pre-rewrite AttributeMultiDropdown)", () => {
  it("plain select adds the option", () => {
    expect(
      resolveAttributeMultiChange({ selected: [B], action: "select", options: OPTS })
    ).toEqual(["B"]);
  });

  it("selecting ANY expands to ANY + all options", () => {
    expect(
      resolveAttributeMultiChange({ selected: [B, ANY], action: "select", options: OPTS })
    ).toEqual([ANY.value, "A", "B", "C"]);
  });

  it("selecting the last missing option lights ANY", () => {
    expect(
      resolveAttributeMultiChange({ selected: [A, B, C], action: "select", options: OPTS })
    ).toEqual([ANY.value, "A", "B", "C"]);
  });

  it("remove-chip (the merged 'N selected' chip) clears everything", () => {
    expect(
      resolveAttributeMultiChange({ selected: [ANY, A, B], action: "remove-chip", options: OPTS })
    ).toEqual([]);
  });

  it("deselecting one option when all were selected clears everything", () => {
    // selected still contains all options at decision time (parity with old branch order)
    expect(
      resolveAttributeMultiChange({ selected: [ANY, A, B, C], action: "deselect", options: OPTS })
    ).toEqual([]);
  });

  it("deselecting one option while ANY lit (not all selected anymore) drops ANY", () => {
    expect(
      resolveAttributeMultiChange({ selected: [ANY, A, B], action: "deselect", options: OPTS })
    ).toEqual(["A", "B"]);
  });

  it("empty selection returns []", () => {
    expect(
      resolveAttributeMultiChange({ selected: [], action: "deselect", options: OPTS })
    ).toEqual([]);
  });

  it("popping (Backspace) while ANY lit falls through unchanged — parity with old pop-value", () => {
    expect(
      resolveAttributeMultiChange({ selected: [ANY, A, B], action: "pop", options: OPTS })
    ).toEqual([ANY.value, "A", "B"]);
  });
});
