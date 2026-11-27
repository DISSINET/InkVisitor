import {
  CITE_WITHIN_ANY,
  GeocodingRepresentative,
  IGeocodingRoles,
  defaultCiteWithinKm,
} from "@inkvisitor/shared/types/geocoding";
import Dropdown from "components/advanced";
import { Input } from "components";
import React, { useState } from "react";
import {
  StyledCitingDistance,
  StyledCitingDistances,
  StyledCitingLabel,
  StyledCitingRule,
  StyledCitingUnit,
} from "./CitingSettingsStyles";

/**
 * How a suggestion's coordinate is chosen, and which gazetteers it cites.
 *
 * Both are the owner's, so every researcher's Locations are coded the same way.
 * The rule goes to the engine with every search; the distances are applied here,
 * when a suggestion is written.
 */

type CitingSettingsValue = Pick<IGeocodingRoles, "representative" | "citeWithinKm">;

interface CitingSettings {
  value: CitingSettingsValue;
  onChange: (next: CitingSettingsValue) => void;
  /** The gazetteer location types a search can name, as the engine words them; absent while it is not reached. */
  placeTypes?: { id: string; label: string }[];
}

/** The rules the engine takes, in its own words shortened, the engine's own default first. */
const RULES: { value: GeocodingRepresentative | ""; label: string }[] = [
  { value: "", label: "the engine's default (place first)" },
  {
    value: "place-first",
    label: "place first: the record most sources agree on, among those found by the place's own name",
  },
  { value: "agreement", label: "agreement: the record most sources agree on" },
  {
    value: "best-score",
    label: "best score: the record with the highest match score, the engine's rule before 0.8",
  },
  {
    value: "medoid",
    label: "medoid: the record with the smallest total distance to the other gazetteers' records",
  },
  {
    value: "densest",
    label: "densest: the record with the most other gazetteers' records close around it",
  },
];

const ANY_LABEL = "none, or any";

export const CitingSettings: React.FC<CitingSettings> = ({ value, onChange, placeTypes }) => {
  const defaults = defaultCiteWithinKm();
  // the engine's own list where it answers; the types a distance is known for
  // where it does not, so the table never loses a row to an engine that is down
  const types = (
    placeTypes?.length
      ? placeTypes.filter((type) => type.id !== "any")
      : Object.keys(defaults)
          .filter((id) => id !== CITE_WITHIN_ANY)
          .map((id) => ({ id, label: id }))
  ).concat({ id: CITE_WITHIN_ANY, label: ANY_LABEL });

  // a field whose text was refused is drawn anew, so it shows the distance that
  // holds rather than the text: the field keeps what was typed while the value
  // it is given stays the same
  const [refused, setRefused] = useState<Record<string, number>>({});

  const setDistance = (type: string, typed: string) => {
    const km = Number(typed.trim().replace(",", "."));
    const valid = !!typed.trim() && Number.isFinite(km) && km > 0;
    if (!valid) {
      setRefused((current) => ({ ...current, [type]: (current[type] ?? 0) + 1 }));
    }
    onChange({
      ...value,
      citeWithinKm: {
        ...value.citeWithinKm,
        // anything but a positive distance is the default again
        [type]: valid ? km : (defaults[type] ?? defaults[CITE_WITHIN_ANY]),
      },
    });
  };

  return (
    <>
      <StyledCitingRule>
        <StyledCitingLabel>coordinate of a suggestion</StyledCitingLabel>
        <Dropdown.Single.Basic
          width="full"
          options={RULES}
          value={value.representative}
          onChange={(rule) =>
            onChange({ ...value, representative: rule as GeocodingRepresentative | "" })
          }
        />
      </StyledCitingRule>
      <StyledCitingDistances>
        {types.map((type) => (
          <StyledCitingDistance key={type.id || "any"}>
            <StyledCitingLabel>{type.label}</StyledCitingLabel>
            {/* text, which commits when the field is left: a number field here
                commits only through its arrows */}
            <Input
              key={refused[type.id] ?? 0}
              type="text"
              width={64}
              value={String(
                value.citeWithinKm[type.id] ?? defaults[type.id] ?? defaults[CITE_WITHIN_ANY],
              )}
              onChangeFn={(typed) => setDistance(type.id, typed)}
            />
            <StyledCitingUnit>km</StyledCitingUnit>
          </StyledCitingDistance>
        ))}
      </StyledCitingDistances>
    </>
  );
};
