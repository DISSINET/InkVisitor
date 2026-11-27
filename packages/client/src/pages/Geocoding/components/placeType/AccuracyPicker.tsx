import { GeocodingAccuracy } from "@inkvisitor/shared/types/geocoding";
import { EntityTag } from "components/advanced";
import React, { useRef } from "react";
import { AccuracyEntry, useAccuracies } from "../../hooks/accuraciesContext";
import {
  FloatingPicker,
  FloatingPickerAnchor,
  PickerHeader,
  useOptionHighlight,
} from "./PlaceTypePicker";
import {
  StyledPickerAside,
  StyledPickerHead,
  StyledPickerHeading,
  StyledPickerLabel,
  StyledPickerOption,
} from "./PlaceTypePickerStyles";

/**
 * The one control for choosing how precisely a coordinate locates a place.
 *
 * Built on the same panel as the location-type picker, and opened the same way,
 * because the two are asked one after the other about the same coordinate. Drawn
 * differently they read as two unrelated controls, and the smaller of them reads
 * as the lesser question — which it is not: accuracy is written on every
 * Location, and the location type is not.
 */

interface AccuracyPicker {
  anchor: FloatingPickerAnchor;
  /** Marked as where the value stands, if anywhere. */
  current?: GeocodingAccuracy | null;
  /**
   * Marked as what the evidence argues for — the spread of a suggestion's own
   * sources. A starting point rather than an answer, like the sources' name for
   * a location type.
   */
  suggested?: GeocodingAccuracy | null;
  /** Said under the caption, where the evidence for the choice belongs. */
  note?: string;
  onChoose: (accuracy: GeocodingAccuracy) => void;
  onClose: () => void;
}

/**
 * The project's accuracies, in the order the owner listed them, each as its
 * Concept's tag on one line, under a header naming the Concept they are recorded as.
 */
export const AccuracyPicker: React.FC<AccuracyPicker> = ({
  anchor,
  current,
  suggested,
  note,
  onChoose,
  onClose,
}) => {
  const { entries } = useAccuracies();
  return (
    <FloatingPicker
      anchor={anchor}
      ariaLabel="Accuracy"
      onClose={onClose}
      header={
        <PickerHeader
          caption="accuracy"
          recordedAs={<AccuracyHeading />}
          notes={[
            note,
            entries.length
              ? null
              : "No accuracies are listed yet; an owner sets them in Global geocoding.",
          ]}
        />
      }
    >
      {entries.map((entry) => (
        <AccuracyOption
          key={entry.conceptId}
          entry={entry}
          current={current === entry.conceptId}
          suggested={suggested === entry.conceptId}
          onChoose={onChoose}
        />
      ))}
    </FloatingPicker>
  );
};

interface AccuracyOption {
  entry: AccuracyEntry;
  current: boolean;
  suggested: boolean;
  onChoose: (accuracy: GeocodingAccuracy) => void;
}

/** One accuracy of the picker, its tag drawn selected while the pointer or the keyboard is on it. */
const AccuracyOption: React.FC<AccuracyOption> = ({ entry, current, suggested, onChoose }) => {
  const option = useRef<HTMLButtonElement>(null);
  const { highlighted, focusHandlers } = useOptionHighlight(option);
  return (
    <StyledPickerOption
      ref={option}
      type="button"
      role="option"
      aria-selected={current}
      $current={current}
      $suggested={suggested}
      onClick={() => onChoose(entry.conceptId)}
      {...focusHandlers}
    >
      <StyledPickerLabel>
        <AccuracyTag entry={entry} highlighted={highlighted} withTooltip>
          {suggested ? <StyledPickerAside>what its sources argue for</StyledPickerAside> : null}
        </AccuracyTag>
      </StyledPickerLabel>
    </StyledPickerOption>
  );
};

interface ChoiceTag {
  entity: NonNullable<AccuracyEntry["entity"]>;
  fullWidth?: boolean;
  /** Drawn selected. */
  highlighted?: boolean;
  /** The entity's own tooltip on hover. */
  withTooltip?: boolean;
}

/**
 * A Concept's tag inside a control that does the choosing or heads a list of
 * choices: its own click, drag, copy and menu are off, so a click reaches the
 * control.
 */
const ChoiceTag: React.FC<ChoiceTag> = ({ entity, fullWidth, highlighted, withTooltip }) => (
  <EntityTag
    entity={entity}
    fullWidth={fullWidth}
    isSelected={highlighted}
    disableTooltip={!withTooltip}
    tooltipPassThrough
    disableDrag
    disableCopyToClipboard
    disableDoubleClick
    disableContextMenu
  />
);

interface AccuracyTag {
  entry: AccuracyEntry;
  /** Drawn selected, for the option the pointer or the keyboard is on. */
  highlighted?: boolean;
  /** The Concept's own tooltip on hover; off where the control has a hint of its own. */
  withTooltip?: boolean;
  /** Said on the tag's line, after it. */
  children?: React.ReactNode;
}

/**
 * An accuracy as its Concept's tag, inside a control that does the choosing. A
 * plain description stands in while the Concept loads or where it was deleted.
 */
export const AccuracyTag: React.FC<AccuracyTag> = ({
  entry,
  highlighted,
  withTooltip,
  children,
}) => (
  <StyledPickerHead>
    {entry.entity ? (
      <ChoiceTag entity={entry.entity} fullWidth highlighted={highlighted} withTooltip={withTooltip} />
    ) : (
      entry.label || "an accuracy whose Concept cannot be read"
    )}
    {children}
  </StyledPickerHead>
);

/**
 * The heading of a question about accuracy: the Concept the answer is recorded
 * under on the coordinate, the one assigned for localisation accuracy in Global
 * geocoding.
 */
export const AccuracyHeading: React.FC = () => {
  const { roleConcept } = useAccuracies();
  return roleConcept ? (
    <StyledPickerHeading>
      <ChoiceTag entity={roleConcept} withTooltip />
    </StyledPickerHeading>
  ) : (
    <StyledPickerHeading data-hint="The accuracy is recorded on the coordinate under the Concept assigned for localisation accuracy in Global geocoding, and none is assigned yet.">
      accuracy
    </StyledPickerHeading>
  );
};
