import { defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import breslau from "../../fixtures/suggest-breslau.json";
import { PlaceTypesProvider } from "../../hooks/placeTypesContext";
import type { Suggestion } from "../../types/engine";
import { render, Rendered } from "../../utils/test/renderForTest";
import { SuggestionCard } from "./GeocodingSuggestions";

/**
 * The gazetteers' twelve location types are another vocabulary from the
 * project's own, and the marks on the page belong to the project's. A card says
 * what the gazetteers call a place in words, among its other facts.
 */

let view: Rendered | null = null;
afterEach(() => {
  view?.unmount();
  view = null;
  document.body.innerHTML = "";
});

const card = (suggestion: Suggestion) => {
  view = render(
    <PlaceTypesProvider placeTypes={defaultPlaceTypes()}>
      <SuggestionCard
        suggestion={suggestion}
        index={0}
        total={1}
        topScore={suggestion.score}
        mergeRadiusKm={25}
        band={undefined as never}
        pendingHere={null}
        accuracyMenuOpen={false}
        menuAnchor={null}
        allMatches={false}
        onToggleMatches={vi.fn()}
        onShowOnMap={vi.fn()}
        onUseAs={vi.fn()}
        onOpenAccuracyMenu={vi.fn()}
        onCloseAccuracyMenu={vi.fn()}
        onPickTypeStepAccuracy={vi.fn()}
        onCancelPending={vi.fn()}
        onChooseKind={vi.fn()}
        preview
      />
    </PlaceTypesProvider>,
  );
  return view.container;
};

const first = breslau.suggestions[0] as unknown as Suggestion;

describe("SuggestionCard, what the gazetteers call the place", () => {
  it("says it in words among the facts, and draws no mark for it beside the name", () => {
    const container = card({ ...first, placeType: "settlement" });
    expect(container.textContent).toContain("settlement by the gazetteers");
    // a mark beside the name would carry the gazetteers' type as its hint
    expect(container.querySelector('[data-hint="settlement"]')).toBeNull();
  });

  it("says nothing where no source named a type, rather than that none is recorded", () => {
    const container = card({ ...first, placeType: null as never });
    expect(container.textContent).not.toContain("by the gazetteers");
    expect(container.textContent).not.toContain("not recorded");
  });

  it("says nothing of a type the engine has added since, which the page has no words for", () => {
    const container = card({ ...first, placeType: "volcano" as never });
    expect(container.textContent).not.toContain("by the gazetteers");
  });
});
