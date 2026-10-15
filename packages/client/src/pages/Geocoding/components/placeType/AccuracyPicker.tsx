import { GeocodingAccuracy } from "@inkvisitor/shared/types/geocoding";
import React from "react";
import { FloatingPicker, FloatingPickerAnchor } from "./PlaceTypePicker";
import {
  StyledPickerDescription,
  StyledPickerLabel,
  StyledPickerOption,
  StyledPickerTitle,
} from "./PlaceTypePickerStyles";

/**
 * The one control for choosing how precisely a coordinate locates a place.
 *
 * Built on the same panel as the kind-of-place picker, and opened the same way,
 * because the two are asked one after the other about the same coordinate. Drawn
 * differently they read as two unrelated controls, and the smaller of them reads
 * as the lesser question — which it is not: accuracy is written on every
 * Location, and the kind of place is not.
 */

export const ACCURACY_ORDER: GeocodingAccuracy[] = [
  GeocodingAccuracy.Precise,
  GeocodingAccuracy.Approximate,
  GeocodingAccuracy.Region,
  GeocodingAccuracy.Unknown,
];

/**
 * What each accuracy claims, in the terms the researcher is deciding in.
 *
 * Written from the coordinate outward — how far from the point the place could
 * be — rather than from the sources inward, because the choice is made looking
 * at a map and a spread, not at a provenance record.
 */
export const ACCURACY_MEANING: Record<GeocodingAccuracy, string> = {
  [GeocodingAccuracy.Precise]: "The point is the place, to within a village or a street.",
  [GeocodingAccuracy.Approximate]: "The right locality, but not the exact spot.",
  [GeocodingAccuracy.Region]: "Somewhere in a wider area — a province, a valley, a diocese.",
  [GeocodingAccuracy.Unknown]: "A coordinate worth recording, with no claim about how close it is.",
};

interface AccuracyPicker {
  anchor: FloatingPickerAnchor;
  /** Marked as where the value stands, if anywhere. */
  current?: GeocodingAccuracy | null;
  /**
   * Marked as what the evidence argues for — the spread of a suggestion's own
   * sources. A starting point rather than an answer, like the sources' name for
   * a kind of place.
   */
  suggested?: GeocodingAccuracy | null;
  /** Said under the title, where the evidence for the choice belongs. */
  note?: string;
  onChoose: (accuracy: GeocodingAccuracy) => void;
  onClose: () => void;
}

export const AccuracyPicker: React.FC<AccuracyPicker> = ({
  anchor,
  current,
  suggested,
  note,
  onChoose,
  onClose,
}) => (
  <FloatingPicker anchor={anchor} ariaLabel="Accuracy" onClose={onClose}>
    <StyledPickerTitle>
      how precisely is it known?
      {note ? ` — ${note}` : ""}
    </StyledPickerTitle>
    {ACCURACY_ORDER.map((accuracy) => (
      <StyledPickerOption
        key={accuracy}
        type="button"
        role="option"
        aria-selected={current === accuracy}
        $current={current === accuracy}
        $suggested={suggested === accuracy}
        onClick={() => onChoose(accuracy)}
      >
        <StyledPickerLabel>
          {accuracy}
          {suggested === accuracy ? " · what its sources argue for" : ""}
          <StyledPickerDescription>{ACCURACY_MEANING[accuracy]}</StyledPickerDescription>
        </StyledPickerLabel>
      </StyledPickerOption>
    ))}
  </FloatingPicker>
);
