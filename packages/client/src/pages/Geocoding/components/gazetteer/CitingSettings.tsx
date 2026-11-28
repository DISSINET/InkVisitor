import {
  CITE_WITHIN_ANY,
  GeocodingRepresentative,
  IGeocodingRoles,
  defaultCiteWithinKm,
} from "@inkvisitor/shared/types/geocoding";
import Dropdown from "components/advanced";
import { Input } from "components";
import React, { useId, useState } from "react";
import { IcoChevronDown, IcoInfo } from "Theme/icons";
import {
  StyledCitingBlock,
  StyledCitingBlockHead,
  StyledCitingBlockNote,
  StyledCitingDistance,
  StyledCitingDistances,
  StyledCitingLabel,
  StyledCitingRule,
  StyledCitingToggle,
  StyledCitingUnit,
} from "./CitingSettingsStyles";
import { PANELS, RepresentativeRules } from "./RepresentativeRules";

/**
 * How a suggestion's coordinate is chosen, and which gazetteers it cites: two
 * settings, each in its own block with what it decides.
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

const DEFAULT_RULE = PANELS.find((rule) => rule.isDefault)!;

/**
 * The rules the engine takes, by name only, the engine's own default first. What
 * each picks is said beside the choice; when to choose it, in the guide below.
 */
export const RULES: { value: GeocodingRepresentative | ""; label: string }[] = [
  { value: "", label: `engine's default (${DEFAULT_RULE.name})` },
  ...PANELS.map((rule) => ({ value: rule.key, label: rule.name })),
];

/** What the rule chosen picks, in a sentence; the engine's default says which rule that is. */
export const ruleSummary = (representative: GeocodingRepresentative | ""): string =>
  representative
    ? (PANELS.find((rule) => rule.key === representative)?.summary ?? "")
    : `The engine's own rule, ${DEFAULT_RULE.name}: ${DEFAULT_RULE.summary.charAt(0).toLowerCase()}${DEFAULT_RULE.summary.slice(1)}`;

const ANY_LABEL = "none, or any";

export const CitingSettings: React.FC<CitingSettings> = ({ value, onChange, placeTypes }) => {
  const defaults = defaultCiteWithinKm();
  // the engine's list where it answers; the types a distance is known for
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
  const [guiding, setGuiding] = useState(false);
  const guide = useId();

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
      <StyledCitingBlock>
        <StyledCitingBlockHead>Coordinate of a suggestion</StyledCitingBlockHead>
        <StyledCitingRule>
          <Dropdown.Single.Basic
            width="full"
            options={RULES}
            value={value.representative}
            onChange={(rule) =>
              onChange({ ...value, representative: rule as GeocodingRepresentative | "" })
            }
          />
          <StyledCitingBlockNote aria-live="polite">
            {ruleSummary(value.representative)}
          </StyledCitingBlockNote>
        </StyledCitingRule>
        <StyledCitingToggle
          type="button"
          aria-expanded={guiding}
          aria-controls={guide}
          $open={guiding}
          onClick={() => setGuiding((open) => !open)}
        >
          <IcoInfo aria-hidden />
          Guide: which rule suits your project?
          <IcoChevronDown aria-hidden />
        </StyledCitingToggle>
        {/* kept while hidden, so the case shown survives closing and opening it */}
        <div id={guide} hidden={!guiding}>
          <RepresentativeRules selected={value.representative || DEFAULT_RULE.key} />
        </div>
      </StyledCitingBlock>
      <StyledCitingBlock>
        <StyledCitingBlockHead>Citing distance</StyledCitingBlockHead>
        <StyledCitingBlockNote>
          A Location given a suggestion&apos;s coordinate cites each gazetteer with a record within
          this distance of it, by the search&apos;s gazetteer location type, in place of those an
          earlier suggestion cited.
        </StyledCitingBlockNote>
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
      </StyledCitingBlock>
    </>
  );
};
