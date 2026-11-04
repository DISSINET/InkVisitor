import { ENGINE_PLACE_TYPE_INFO, GeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";
import type { EngineSuggester } from "../../types/engine";

/**
 * What the engine says about a source, in words a researcher can act on.
 *
 * The catalogue carries slugs (`low-countries`), language codes (`de`), a
 * licence record and two figures. Shown raw they are a puzzle; this turns each
 * into a phrase and leaves the decision of what to show to the component.
 */

/** A slug as words: `low-countries` → `low countries`. */
export const slugLabel = (slug: string): string => slug.replace(/[-_]+/g, " ");

/** A language code as its English name, or the code itself where the runtime does not know it. */
export const languageName = (code: string): string => {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/** An engine place type as the label the page uses for it elsewhere. */
export const placeTypeName = (type: string): string =>
  ENGINE_PLACE_TYPE_INFO[type as GeocodingPlaceType]?.label ?? slugLabel(type);

export interface CoverageGroup {
  title: string;
  items: string[];
}

/**
 * What a source declares it is good for, one group per dimension.
 *
 * A dimension it declares nothing for is left out rather than shown empty: for
 * a general-purpose service the absence is the whole statement, and the caller
 * says it once instead of four times.
 */
export const coverageGroups = (coverage: EngineSuggester["coverage"]): CoverageGroup[] =>
  (
    [
      { title: "regions", items: (coverage.regions ?? []).map(slugLabel) },
      { title: "periods", items: (coverage.periods ?? []).map(slugLabel) },
      { title: "languages", items: (coverage.languages ?? []).map(languageName) },
      { title: "kinds of place", items: (coverage.placeTypes ?? []).map(placeTypeName) },
    ] as CoverageGroup[]
  ).filter((group) => group.items.length > 0);

export type ChipTone = "good" | "caution" | "bad" | "neutral";

export interface Chip {
  label: string;
  tone: ChipTone;
}

type License = NonNullable<EngineSuggester["info"]["license"]>;

/** The licence's practical consequences, as chips: what it allows and what it asks. */
export const licenceChips = (license: License): Chip[] => {
  const chips: Chip[] = [{ label: license.label, tone: "neutral" }];
  chips.push(
    license.commercialUse === "yes"
      ? { label: "commercial use allowed", tone: "good" }
      : license.commercialUse === "no"
        ? { label: "non-commercial only", tone: "bad" }
        : { label: "check the terms for commercial use", tone: "caution" },
  );
  if (license.attribution) {
    chips.push({ label: "credit required", tone: "neutral" });
  }
  if (license.shareAlike) {
    chips.push({ label: "share-alike", tone: "neutral" });
  }
  return chips;
};

/** The size of a source's own data in a sentence, or why there is none to measure. */
export const sizeSentence = (footprint: EngineSuggester["footprint"]): string =>
  footprint
    ? `${footprint.records.toLocaleString()} records, spread over ${footprint.cells.toLocaleString()} one-degree map squares`
    : "queried online, so its size is not measured";

/** How much the engine trusts the source by default, and the floor a researcher can lower it to. */
export const weightSentence = (weight: EngineSuggester["weight"]): string =>
  weight.default === weight.min
    ? `Counted at ${weight.default} of a full source, and this cannot be changed.`
    : `Counted at ${weight.default} of a full source by default; a researcher can lower it to ${weight.min}.`;

/** Whether this source is a local file of records or an online service. */
export const categoryLabel = (category: EngineSuggester["category"]): string =>
  category === "file" ? "local records" : "online service";
