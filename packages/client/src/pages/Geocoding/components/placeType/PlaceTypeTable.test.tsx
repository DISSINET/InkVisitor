import {
  ENGINE_PLACE_TYPE_INFO,
  GEOCODING_PLACE_TYPES,
  defaultPlaceTypes,
} from "@inkvisitor/shared/types/geocoding";
import React, { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { render, Rendered } from "../../utils/test/renderForTest";
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

describe("PlaceTypeTable", () => {
  it("says what each gazetteer location type covers, on the column title", async () => {
    view = render(
      <PlaceTypeTable
        value={defaultPlaceTypes()}
        onChange={() => undefined}
        renderConcept={() => null}
        counts={{}}
        countsLoading={false}
        countsFailed={false}
      />,
    );
    expect(document.body.textContent).not.toContain("The twelve types the gazetteers use");

    const help = view.container.querySelector("button[aria-label*='gazetteer location type']")!;
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
        renderConcept={() => null}
        counts={{}}
        countsLoading={false}
        countsFailed={false}
      />,
    );
    const help = view.container.querySelector("button[aria-label*='gazetteer location type']")!;
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
        renderConcept={() => null}
        counts={{}}
        pendingTypes={[kinds[1].id]}
        countsLoading={false}
        countsFailed={false}
      />,
    );
    const counts = view.all("[class*='Count'], [class*='count']").map((node) => node.textContent);
    expect(counts.filter((text) => text?.includes("…"))).toHaveLength(1);
    expect(counts.filter((text) => text?.trim() === "0")).toHaveLength(kinds.length - 1);
  });
});
