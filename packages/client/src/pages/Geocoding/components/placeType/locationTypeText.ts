import { IGeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";
import { LocationTypeEntry } from "../../hooks/usePlaceTypeAssignments";
import { findPlaceType } from "../../hooks/placeTypesContext";
import { kindInfo } from "./placeTypeIcons";

/**
 * The words that say what location types a Location has and how.
 *
 * One place for them, so that a list row, the panel head and the map's card say
 * the same of the same Location.
 */

/** The entries that are shown: those another location type does not lie below. */
export const shownEntries = (entries: LocationTypeEntry[]): LocationTypeEntry[] =>
  entries.filter((entry) => !entry.shadowed);

/**
 * One location type of a Location, as a line: its name, and where it comes from
 * when the Location is not classified under it directly.
 */
export const describeEntry = (
  entry: LocationTypeEntry,
  placeTypes: IGeocodingPlaceType[],
  viaLabel: (conceptId: string) => string,
): string => {
  const name = kindInfo(findPlaceType(placeTypes, entry.typeId)).label;
  return entry.inferred ? `${name} — inferred from ${viaLabel(entry.via)}` : name;
};

/** Every shown location type of a Location, one per line, or the words for none. */
export const describeEntries = (
  entries: LocationTypeEntry[],
  placeTypes: IGeocodingPlaceType[],
  viaLabel: (conceptId: string) => string,
): string => {
  const shown = shownEntries(entries);
  return shown.length
    ? shown.map((entry) => describeEntry(entry, placeTypes, viaLabel)).join("\n")
    : kindInfo(undefined).label;
};
