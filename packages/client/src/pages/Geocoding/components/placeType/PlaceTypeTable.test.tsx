import {
  ENGINE_PLACE_TYPE_INFO,
  GEOCODING_PLACE_TYPES,
  defaultPlaceTypes,
} from "@inkvisitor/shared/types/geocoding";
import { IGeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expandPlaceTypes } from "../../utils/context/placeTypeHierarchy";
import { click, render, Rendered } from "../../utils/test/renderForTest";
import { PlaceTypeTable } from "./PlaceTypeTable";

/**
 * A researcher adding a location type such as "church" has to pair it with one
 * of the twelve gazetteer location types, whose names mean more than they say.
 */

let view: Rendered | null = null;

afterEach(() => {
  view?.unmount();
  view = null;
  document.body.innerHTML = "";
});

/** No subclass trees: what the table has while the Concepts' answer is awaited. */
const tree = {
  nodes: [],
  concepts: {},
  detailOf: () => "",
  onDetailChange: () => undefined,
};

describe("PlaceTypeTable", () => {
  it("says what each gazetteer type covers, on the column title", async () => {
    view = render(
      <PlaceTypeTable
        value={defaultPlaceTypes()}
        onChange={() => undefined}
        {...tree}
        renderConcept={() => null}
        counts={{}}
        countsLoading={false}
        countsFailed={false}
      />
    );
    expect(document.body.textContent).not.toContain("The twelve types the gazetteers use");

    const help = view.container.querySelector("button[aria-label*='gazetteer type']")!;
    await act(async () => {
      // React derives mouseenter from mouseover
      help.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    const text = document.body.textContent ?? "";
    expect(text).toContain("The twelve types the gazetteers use");
    for (const type of GEOCODING_PLACE_TYPES) {
      expect(text).toContain(ENGINE_PLACE_TYPE_INFO[type].description);
    }
    // the one that covers a church is the one whose name does not say so
    expect(text).toContain("A church, chapel, monastery, abbey or other religious foundation.");
  });

  it("opens the same help from the keyboard", async () => {
    view = render(
      <PlaceTypeTable
        value={defaultPlaceTypes()}
        onChange={() => undefined}
        {...tree}
        renderConcept={() => null}
        counts={{}}
        countsLoading={false}
        countsFailed={false}
      />
    );
    const help = view.container.querySelector("button[aria-label*='gazetteer type']")!;
    await act(async () => {
      // React derives focus from focusin
      help.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });
    expect(document.body.textContent).toContain("The twelve types the gazetteers use");
    await act(async () => {
      help.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
    expect(document.body.textContent).not.toContain("The twelve types the gazetteers use");
  });

  it("shows an unknown count for a location type whose Concept is not yet answered, not zero", () => {
    const kinds = defaultPlaceTypes().map((one, index) => ({ ...one, conceptId: `c-${index}` }));
    view = render(
      <PlaceTypeTable
        value={kinds}
        onChange={() => undefined}
        {...tree}
        renderConcept={() => null}
        counts={{}}
        pendingTypes={[kinds[1].id]}
        countsLoading={false}
        countsFailed={false}
      />
    );
    const counts = view.all("[class*='Count'], [class*='count']").map((node) => node.textContent);
    expect(counts.filter((text) => text?.includes("…"))).toHaveLength(1);
    expect(counts.filter((text) => text?.trim() === "0")).toHaveLength(kinds.length - 1);
  });
});

describe("PlaceTypeTable, with the subclass tree of each location type", () => {
  // path <- road <- highway, path <- street, and a lane way under both road and street
  const tree = {
    nodes: [
      { id: "c-path", parents: [] },
      { id: "c-road", parents: ["c-path"] },
      { id: "c-street", parents: ["c-path"] },
      { id: "c-highway", parents: ["c-road"] },
      { id: "c-lane", parents: ["c-road", "c-street"] },
    ],
    aliases: {},
  };
  const labels: Record<string, { label: string; detail: string }> = {
    "c-path": { label: "path", detail: "any way" },
    "c-road": { label: "road", detail: "for carts" },
    "c-street": { label: "street", detail: "in a town" },
    "c-highway": { label: "highway", detail: "between towns" },
    "c-lane": { label: "lane way", detail: "" },
  };
  const ways: IGeocodingPlaceType = {
    ...defaultPlaceTypes()[8],
    id: "ways",
    name: "ways",
    conceptId: "c-path",
    inactive: [],
  };

  const mountTree = (
    value: IGeocodingPlaceType[] = [ways],
    props: Partial<React.ComponentProps<typeof PlaceTypeTable>> = {}
  ) => {
    const onChange = vi.fn();
    const onDetailChange = vi.fn();
    view = render(
      <PlaceTypeTable
        value={value}
        onChange={onChange}
        nodes={expandPlaceTypes(value, { "c-path": tree }, labels)}
        concepts={{}}
        detailOf={(conceptId) => labels[conceptId]?.detail ?? ""}
        onDetailChange={onDetailChange}
        renderConcept={() => <span>root tag</span>}
        counts={{}}
        countsLoading={false}
        countsFailed={false}
        {...props}
      />
    );
    return { onChange, onDetailChange };
  };
  const rowTexts = () => view!.all("[class*='KindRow']").map((row) => row.textContent);
  const rowOf = (label: string) =>
    view!.all("[class*='KindRow']").find((row) => row.textContent?.includes(label))!;

  it("draws every subclass as a row of its own below its root, a subclass of two superclasses under each", () => {
    mountTree();
    const texts = rowTexts();
    expect(texts.length).toBe(1 + 5);
    expect(texts.filter((text) => text?.includes("lane way"))).toHaveLength(2);
    expect(texts.findIndex((text) => text?.includes("highway"))).toBeGreaterThan(
      texts.findIndex((text) => text?.includes("road"))
    );
  });

  it("indents a row by its depth in the tree", () => {
    mountTree();
    const indent = (label: string) =>
      getComputedStyle(rowOf(label).querySelector("[class*='TreeCell']")!).paddingLeft;
    expect(indent("road")).not.toBe(indent("highway"));
  });

  it("keeps the mark and the gazetteer type to the root: a subclass row offers neither", () => {
    mountTree([{ ...ways, engineType: "port" }]);
    const root = rowOf("root tag");
    expect(root.querySelector("button[aria-label^='mark for']")).not.toBeNull();
    // the gazetteer type dropdown shows its value as text
    expect(root.textContent).toContain("port");
    for (const label of ["for carts", "between towns", "in a town"]) {
      expect(rowOf(label).querySelector("button[aria-label^='mark for']")).toBeNull();
      expect(rowOf(label).textContent).not.toContain("port");
    }
  });

  it("folds the rows below a row, and shows them again", () => {
    mountTree();
    const toggle = rowOf("for carts").querySelector<HTMLButtonElement>("button[aria-expanded]")!;
    click(toggle);
    expect(rowTexts().some((text) => text?.includes("highway"))).toBe(false);
    // the lane way under the street is not folded with the road
    expect(rowTexts().filter((text) => text?.includes("lane way"))).toHaveLength(1);
    click(toggle);
    expect(rowTexts().some((text) => text?.includes("highway"))).toBe(true);
  });

  it("deactivates a subclass by unticking it, on the location type at its root", () => {
    const { onChange } = mountTree();
    click(rowOf("for carts").querySelector("[role=checkbox]"));
    expect(onChange).toHaveBeenCalledWith([{ ...ways, inactive: ["c-road"] }]);
  });

  it("activates it again by ticking it", () => {
    const { onChange } = mountTree([{ ...ways, inactive: ["c-road", "c-street"] }]);
    click(rowOf("for carts").querySelector("[role=checkbox]"));
    expect(onChange).toHaveBeenCalledWith([{ ...ways, inactive: ["c-street"] }]);
  });

  it("hides the deactivated rows on request and keeps the active ones below them", () => {
    mountTree([{ ...ways, inactive: ["c-road"] }]);
    const toggle = view!
      .all("[role=checkbox]")
      .find((box) => box.closest("label, div")?.textContent?.includes("show deactivated"))!;
    click(toggle);
    expect(rowTexts().some((text) => text?.includes("for carts"))).toBe(false);
    expect(rowTexts().some((text) => text?.includes("highway"))).toBe(true);
  });

  it("shows the Concept's detail as the description, and hands what is typed back by Concept", () => {
    const { onDetailChange } = mountTree();
    const field = rowOf("for carts").querySelector<HTMLTextAreaElement>("textarea")!;
    expect(field.value).toBe("for carts");
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
      setter.call(field, "for carts and riders");
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(onDetailChange).toHaveBeenCalledWith("c-road", "for carts and riders");
  });

  it("names the column of gazetteer types as such", () => {
    mountTree();
    expect(view!.container.textContent).toContain("gazetteer type");
    expect(view!.container.textContent).not.toContain("gazetteer location type");
  });
});
