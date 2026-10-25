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

    const help = view.container.querySelector("svg")!.closest("div") as HTMLElement;
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
});
