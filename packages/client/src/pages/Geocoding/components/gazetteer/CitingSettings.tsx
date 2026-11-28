import {
  CITE_WITHIN_ANY,
  GeocodingRepresentative,
  IGeocodingRoles,
  defaultCiteWithinKm,
} from "@inkvisitor/shared/types/geocoding";
import Dropdown from "components/advanced";
import { Input } from "components";
import React, { useId, useState } from "react";
import { IcoChevronDown } from "Theme/icons";
import {
  StyledCitingDistance,
  StyledCitingDistances,
  StyledCitingExplanation,
  StyledCitingLabel,
  StyledCitingRule,
  StyledCitingToggle,
  StyledCitingUnit,
} from "./CitingSettingsStyles";
import { RepresentativeRules } from "./RepresentativeRules";

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

/**
 * The rules the engine takes, by name only, the engine's own default first. What
 * each does is drawn in `RepresentativeRules`, opened beside the choice.
 */
export const RULES: { value: GeocodingRepresentative | ""; label: string }[] = [
  { value: "", label: "engine's default (place first)" },
  { value: "place-first", label: "place first" },
  { value: "agreement", label: "agreement" },
  { value: "best-score", label: "best score" },
  { value: "medoid", label: "medoid" },
  { value: "densest", label: "densest" },
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
  const [explaining, setExplaining] = useState(false);
  const explanation = useId();

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
        <StyledCitingToggle
          type="button"
          aria-expanded={explaining}
          aria-controls={explanation}
          $open={explaining}
          onClick={() => setExplaining((open) => !open)}
        >
          how the rules work
          <IcoChevronDown aria-hidden />
        </StyledCitingToggle>
      </StyledCitingRule>
      <StyledCitingExplanation id={explanation} hidden={!explaining}>
        {explaining ? (
          <RepresentativeRules selected={value.representative || "place-first"} />
        ) : null}
      </StyledCitingExplanation>
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
