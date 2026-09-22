import { IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  StyledPickerBackdrop,
  StyledPickerDescription,
  StyledPickerLabel,
  StyledPickerOption,
  StyledPickerPanel,
  StyledPickerTitle,
} from "./PlaceTypePickerStyles";
import { NO_PLACE_TYPE_VALUE, UNKNOWN_PLACE_TYPE, placeTypeChoices } from "./placeTypeIcons";

/**
 * The one control for choosing what kind of place something is.
 *
 * Rendered into the document rather than into whatever opened it, because the
 * places it opens from — a virtualised list row, a menu already floating over
 * the map — clip their own children.
 *
 * A kind the project has mapped to no Concept is shown and disabled with the
 * reason on it. Hiding it would misrepresent the vocabulary, and offering it
 * only for the write to refuse afterwards wastes the decision.
 */

/** Anchors a floating picker to the control that opened it. */
export type FloatingPickerAnchor = { left: number; top: number; bottom: number };

const PANEL_WIDTH = 320;
const PANEL_MAX_HEIGHT = 420;

/**
 * Where a listbox-style panel sits, measured against the control that opened
 * it — shared by every picker built on this panel, since each opens from a
 * different place (a card, a caret, a map marker) and none knows in advance
 * which side of its anchor it fits on.
 */
const useFloatingPickerPosition = (anchor: FloatingPickerAnchor) => {
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: anchor.left, top: anchor.bottom });

  // measured after mounting: a panel's height depends on what it holds and
  // the anchor can sit anywhere, so which side it opens on is not knowable
  // before it has a height
  useLayoutEffect(() => {
    const height = Math.min(panel.current?.offsetHeight || PANEL_MAX_HEIGHT, PANEL_MAX_HEIGHT);
    const fitsBelow = anchor.bottom + height <= window.innerHeight - 8;
    setPosition({
      left: Math.min(Math.max(8, anchor.left), window.innerWidth - PANEL_WIDTH - 8),
      top: fitsBelow ? anchor.bottom : Math.max(8, anchor.top - height),
    });
  }, [anchor.left, anchor.top, anchor.bottom]);

  return { panel, position };
};

interface FloatingPicker {
  anchor: FloatingPickerAnchor;
  ariaLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * The backdrop, portal and positioned panel every picker built on this shape
 * shares — a card's accuracy list and its kind-of-place list open from a
 * click and close the same three ways (Escape, a click outside, choosing an
 * option), so only the options inside tell the two apart.
 */
export const FloatingPicker: React.FC<FloatingPicker> = ({
  anchor,
  ariaLabel,
  onClose,
  children,
}) => {
  const { panel, position } = useFloatingPickerPosition(anchor);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /**
   * Closes when anything under the panel scrolls.
   *
   * The panel is fixed to the viewport and its position was measured once, from
   * a control that scrolls with its list. Left open, it stays where it was while
   * the card that opened it moves away — so it ends up floating over a different
   * place, offering to write a coordinate for the one it no longer names.
   *
   * Captured, because a scroll event does not bubble and the element that
   * scrolls is somewhere below.
   */
  useEffect(() => {
    const onScroll = (event: Event) => {
      // the panel is taller than the vocabulary it lists, so it scrolls itself.
      // Its own scrolling moves it nowhere and must not close it — only the
      // page moving underneath it does
      if (panel.current?.contains(event.target as Node)) {
        return;
      }
      onClose();
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [onClose, panel]);

  return createPortal(
    <>
      <StyledPickerBackdrop onClick={onClose} />
      <StyledPickerPanel
        ref={panel}
        $left={position.left}
        $top={position.top}
        $width={PANEL_WIDTH}
        $maxHeight={PANEL_MAX_HEIGHT}
        role="listbox"
        aria-label={ariaLabel}
      >
        {children}
      </StyledPickerPanel>
    </>,
    document.body,
  );
};

interface PlaceTypePicker {
  anchor: FloatingPickerAnchor;
  roles: IGeocodingRoles;
  /** Marked as where the value stands, if anywhere. */
  current: string | null | undefined;
  /** Marked as what the sources called it, which is a starting point and not an answer. */
  suggested?: string | null;
  /** The wording for choosing no kind at all, or absent to leave that out. */
  clearLabel?: string;
  onChoose: (placeType: string | null) => void;
  onClose: () => void;
}

export const PlaceTypePicker: React.FC<PlaceTypePicker> = ({
  anchor,
  roles,
  current,
  suggested,
  clearLabel,
  onChoose,
  onClose,
}) => (
  <FloatingPicker anchor={anchor} ariaLabel="Kind of place" onClose={onClose}>
    <StyledPickerTitle>what kind of place is it?</StyledPickerTitle>

    {clearLabel ? (
      <StyledPickerOption
        type="button"
        role="option"
        aria-selected={!current}
        $current={!current}
        onClick={() => onChoose(null)}
      >
        <UNKNOWN_PLACE_TYPE.icon />
        <StyledPickerLabel>
          {clearLabel}
          <StyledPickerDescription>{UNKNOWN_PLACE_TYPE.description}</StyledPickerDescription>
        </StyledPickerLabel>
      </StyledPickerOption>
    ) : null}

    {placeTypeChoices().map(({ value, info }) => {
      const mapped = !!roles.placeTypes[value as keyof typeof roles.placeTypes];
      const Icon = info.icon;
      return (
        <StyledPickerOption
          key={value}
          type="button"
          role="option"
          aria-selected={current === value}
          disabled={!mapped}
          $current={current === value}
          $suggested={suggested === value}
          onClick={() => onChoose(value)}
        >
          <Icon />
          <StyledPickerLabel>
            {info.label}
            {suggested === value ? " · what the sources call it" : ""}
            <StyledPickerDescription>
              {mapped ? info.description : "No Concept is assigned for this kind."}
            </StyledPickerDescription>
          </StyledPickerLabel>
        </StyledPickerOption>
      );
    })}
  </FloatingPicker>
);
