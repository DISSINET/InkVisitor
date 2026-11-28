import { RelationEnums } from "@inkvisitor/shared/enums";
import { IResponseEntity, Relation } from "@inkvisitor/shared/types";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, LetterIcon } from "components";
import { EntityTag } from "components/advanced";
import { IcoCheck, IcoChevronRight } from "Theme/icons";
import { ButtonSize } from "types";
import {
  StyledPickerAside,
  StyledPickerBackdrop,
  StyledPickerCheck,
  StyledPickerDescription,
  StyledPickerFooter,
  StyledPickerCaption,
  StyledPickerHead,
  StyledPickerHeader,
  StyledPickerHeaderRow,
  StyledPickerHeading,
  StyledPickerLabel,
  StyledPickerList,
  StyledPickerNote,
  StyledPickerOption,
  StyledPickerRecordedAs,
  StyledPickerPanel,
  StyledPickerRelation,
  StyledPickerRow,
  StyledPickerSubmenu,
  StyledSubmenuToggle,
} from "./PlaceTypePickerStyles";
import { UNKNOWN_PLACE_TYPE, kindInfo, placeTypeInfo } from "./placeTypeIcons";
import { kindsForEngineType } from "../../utils/write/placeTypeEdits";
import { usePlaceTypeConcepts, usePlaceTypes, useViaLabel } from "../../hooks/placeTypesContext";
import {
  LocationTypeEntry,
  PlaceTypeNode,
  childrenOf,
  rootsOf,
} from "../../utils/context/placeTypeHierarchy";

/**
 * The one control for choosing what location type something is.
 *
 * Rendered into the document rather than into whatever opened it, because the
 * places it opens from — a virtualised list row, a menu already floating over
 * the map — clip their own children.
 *
 * A location type the project has mapped to no Concept is shown and disabled with the
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
  /** The panel's list of options scrolled. */
  onScroll?: () => void;
  /** Several options can be selected at once. */
  multiselectable?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Above the options, kept out of the list: what is asked. */
  header?: React.ReactNode;
  /** Controls that are not options, kept out of the list. */
  footer?: React.ReactNode;
}

/**
 * The backdrop, portal and positioned panel every picker built on this shape
 * shares — a card's accuracy list and its location-type list open from a
 * click and close the same three ways (Escape, a click outside, choosing an
 * option), so only the options inside tell the two apart.
 */
export const FloatingPicker: React.FC<FloatingPicker> = ({
  anchor,
  ariaLabel,
  onScroll,
  multiselectable,
  onClose,
  children,
  header,
  footer,
}) => {
  const { panel, position } = useFloatingPickerPosition(anchor);

  // the keyboard goes into the panel when it opens and back to what opened it
  // when it closes: the panel is drawn in a portal, away from its opener
  useEffect(() => {
    const opener = document.activeElement;
    panel.current?.querySelector<HTMLElement>("[role=option]:not(:disabled)")?.focus();
    return () => {
      if (opener instanceof HTMLElement && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [panel]);

  // up and down move within the list the focused option is in: a list of
  // subclasses opened beside it is a list of its own, entered with the right arrow
  const moveFocus = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    // drawn in a portal, the panel's keys still bubble to whatever opened it
    event.stopPropagation();
    const focused = document.activeElement as HTMLElement | null;
    const list =
      (focused && panel.current?.contains(focused) && focused.closest("[role=listbox]")) ||
      panel.current?.querySelector("[role=listbox]");
    const options = Array.from(
      list?.querySelectorAll<HTMLElement>("[role=option]:not(:disabled)") ?? []
    ).filter((option) => option.closest("[role=listbox]") === list);
    if (!options.length) {
      return;
    }
    event.preventDefault();
    const at = options.indexOf(document.activeElement as HTMLElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    options[(at + step + options.length) % options.length].focus();
  };

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
      // the vocabulary is longer than the panel is tall, so its list scrolls.
      // That scrolling moves the panel nowhere and must not close it — only
      // the page moving underneath it does
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
        role="dialog"
        aria-label={ariaLabel}
        onKeyDown={moveFocus}
      >
        {header}
        <StyledPickerList
          role="listbox"
          aria-label={ariaLabel}
          aria-multiselectable={multiselectable || undefined}
          onScroll={(event) => event.target === event.currentTarget && onScroll?.()}
        >
          {children}
        </StyledPickerList>
        {footer}
      </StyledPickerPanel>
    </>,
    document.body
  );
};

interface ChoiceTag {
  entity: IResponseEntity;
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
export const ChoiceTag: React.FC<ChoiceTag> = ({ entity, fullWidth, highlighted, withTooltip }) => (
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

interface PickerHeader {
  /** What is asked, as a caption. */
  caption: string;
  /** What the answer is recorded as, said after "recorded as" at the caption's right. */
  recordedAs: React.ReactNode;
  /** What the choice is about, a line each, under the caption. */
  notes?: React.ReactNode[];
}

/** The header of a picker: what is asked, what the answer is recorded as, and what it is about. */
export const PickerHeader: React.FC<PickerHeader> = ({ caption, recordedAs, notes = [] }) => (
  <StyledPickerHeader>
    <StyledPickerHeaderRow>
      <StyledPickerCaption>{caption}</StyledPickerCaption>
      <StyledPickerRecordedAs>
        recorded as
        {recordedAs}
      </StyledPickerRecordedAs>
    </StyledPickerHeaderRow>
    {notes.filter(Boolean).map((note, index) => (
      <StyledPickerNote key={index}>{note}</StyledPickerNote>
    ))}
  </StyledPickerHeader>
);

const CLASSIFICATION = RelationEnums.Type.Classification;

/**
 * The heading of a question about location types: what the answer is recorded
 * as, a Classification of the Location under the location type's Concept.
 */
const ClassificationHeading: React.FC = () => (
  <StyledPickerHeading data-hint="A location type is recorded as a Classification (CLA) relation from the Location to the location type's Concept.">
    <LetterIcon letter={CLASSIFICATION} color="info" />
    <StyledPickerRelation>{Relation.RelationRules[CLASSIFICATION]?.label}</StyledPickerRelation>
  </StyledPickerHeading>
);

interface PlaceTypePicker {
  anchor: FloatingPickerAnchor;
  /**
   * How the Location stands to the project's location types, where it is one
   * Location: those it is classified under are ticked, and those it only comes
   * under through a subclass or a synonym are shown, not offered, with where
   * from. Absent for a run over many Locations, where there is no one answer.
   */
  held?: LocationTypeEntry[];
  /**
   * The gazetteer location type the sources gave, which is a starting point and not an
   * answer: the location types that answer to it are marked, the favourite first.
   */
  suggested?: string | null;
  /**
   * The wording for choosing no location type at all, or absent to leave that out.
   * Only where one click chooses; in a list that is ticked there is no such row,
   * since unticking is how a location type goes.
   */
  clearLabel?: string;
  /** What choosing none does, said under its wording, where the wording alone does not say how far it reaches. */
  clearDescription?: string;
  /** What the choice is about, said in the header: where the coordinate is that the location type goes with. */
  note?: string;
  /** One click chooses one location type, which is added to the others, and the list closes. */
  onChoose?: (placeType: string | null) => void;
  /**
   * A click ticks or unticks one location type and the list stays open, so
   * several can be set in one visit. Resolves to whether it was written: where
   * it was not, the tick goes back.
   */
  onToggle?: (placeType: string, on: boolean) => Promise<boolean> | void;
  onClose: () => void;
}

/** How long the pointer rests on an option before its subclasses open beside it. */
const HOVER_OPEN_MS = 150;

/**
 * The subclasses of an option, opened beside the row they belong to: to its
 * right, or to its left where the right has no room, and moved up where it
 * would run off the bottom.
 */
const PickerSubmenu: React.FC<{
  row: HTMLElement | null;
  level: number;
  label: string;
  onScroll: () => void;
  children: React.ReactNode;
}> = ({ row, level, label, onScroll, children }) => {
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: -10000, top: 0 });

  // measured after mounting, for the same reason the panel is: its height is
  // that of what it lists
  useLayoutEffect(() => {
    if (!row) {
      return;
    }
    const box = row.getBoundingClientRect();
    const height = Math.min(menu.current?.offsetHeight || PANEL_MAX_HEIGHT, PANEL_MAX_HEIGHT);
    setPosition({
      left:
        box.right + PANEL_WIDTH <= window.innerWidth - 8
          ? box.right
          : Math.max(8, box.left - PANEL_WIDTH),
      top: Math.max(8, Math.min(box.top, window.innerHeight - 8 - height)),
    });
  }, [row]);

  return (
    <StyledPickerSubmenu
      ref={menu}
      role="listbox"
      aria-label={label}
      data-level={level}
      $left={position.left}
      $top={position.top}
      $width={PANEL_WIDTH}
      $maxHeight={PANEL_MAX_HEIGHT}
      onScroll={(event) => event.target === event.currentTarget && onScroll()}
    >
      {children}
    </StyledPickerSubmenu>
  );
};

// a focus the browser draws a ring for: it does for the keyboard, and not for
// the focus a list puts on its first option when a pointer opened it
const byKeyboard = (element: Element): boolean => {
  try {
    return element.matches(":focus-visible");
  } catch {
    return false;
  }
};

/**
 * Whether an option is the one the pointer is over or the keyboard has moved
 * to, so its Concept's tag can be drawn selected.
 *
 * The pointer is read from the browser's own enter and leave on `element`, not
 * React's: the tag's tooltip is drawn in a portal, and React counts a pointer
 * over the tooltip as still inside the option, which leaves the option lit
 * after the pointer has moved on to the next one.
 */
export const useOptionHighlight = (element: React.RefObject<HTMLElement | null>) => {
  const [pointed, setPointed] = useState(false);
  const [keyed, setKeyed] = useState(false);
  useEffect(() => {
    const node = element.current;
    if (!node) {
      return;
    }
    const enter = () => setPointed(true);
    const leave = () => setPointed(false);
    node.addEventListener("mouseenter", enter);
    node.addEventListener("mouseleave", leave);
    return () => {
      node.removeEventListener("mouseenter", enter);
      node.removeEventListener("mouseleave", leave);
    };
  }, [element]);
  return {
    highlighted: pointed || keyed,
    focusHandlers: {
      onFocus: (event: React.FocusEvent<HTMLElement>) => setKeyed(byKeyboard(event.currentTarget)),
      onBlur: () => setKeyed(false),
    },
  };
};

/** What a row of the picker needs of the picker it is in. */
interface RowContext {
  openPath: string[];
  shownChildren: (kind: PlaceTypeNode) => PlaceTypeNode[];
  answering: PlaceTypeNode[];
  toggling: boolean;
  busy: boolean;
  ticked: Record<string, boolean>;
  entryOf: (kind: PlaceTypeNode) => LocationTypeEntry | undefined;
  directOf: (kind: PlaceTypeNode) => boolean;
  concepts: Record<string, IResponseEntity>;
  viaLabel: (conceptId: string) => string;
  hover: (level: number, kind: PlaceTypeNode | null, hasChildren: boolean) => void;
  open: (level: number, kindId: string | null) => void;
  toggle: (kindId: string, on: boolean) => void;
  onChoose?: (placeType: string | null) => void;
  focusOnOpen: React.MutableRefObject<number | null>;
}

/** One option, with the toggle and the list of its subclasses where it has any. */
const PickerRow: React.FC<{ kind: PlaceTypeNode; level: number; ctx: RowContext }> = ({
  kind,
  level,
  ctx,
}) => {
  const {
    openPath,
    shownChildren,
    answering,
    toggling,
    busy,
    ticked,
    entryOf,
    directOf,
    concepts,
    viaLabel,
    hover,
    open,
    toggle,
    onChoose,
    focusOnOpen,
  } = ctx;
  const row = useRef<HTMLDivElement>(null);
  const children = shownChildren(kind);
  const isOpen = openPath[level] === kind.id && children.length > 0;
  const mapped = !!kind.conceptId;
  const fits = answering.includes(kind);
  const info = kindInfo(kind);
  const Icon = info.icon;
  const entry = entryOf(kind);
  const direct = directOf(kind);
  const inferred = !!entry?.inferred && !(kind.id in ticked);
  const offered =
    mapped && !inferred && !busy && (toggling ? kind.active || direct : kind.active && !direct);
  const concept = concepts[kind.conceptId];
  const clickable = offered || children.length > 0;
  const { highlighted, focusHandlers } = useOptionHighlight(row);

  return (
    <StyledPickerRow
      ref={row}
      // a list of subclasses sits inside the row it opened from, so a pointer
      // arriving on a subclass enters both rows, outer first; the one timer
      // they share leaves the subclass's the last word. The event goes on to
      // the tag inside, whose tooltip opens on it
      onMouseEnter={() => hover(level, kind, children.length > 0)}
    >
      <StyledPickerOption
        type="button"
        role="option"
        aria-selected={direct}
        aria-haspopup={children.length > 0 ? "listbox" : undefined}
        aria-expanded={children.length > 0 ? isOpen : undefined}
        data-option-level={level}
        data-option-id={kind.id}
        disabled={!clickable}
        aria-disabled={!offered || undefined}
        {...focusHandlers}
        $current={direct}
        $suggested={fits}
        onClick={() => {
          if (!offered) {
            open(level, children.length ? kind.id : null);
            return;
          }
          if (toggling) {
            toggle(kind.id, !direct);
          } else {
            onChoose?.(kind.id);
          }
        }}
        onKeyDown={(event) => {
          // the picker is drawn in a portal, so its keys still bubble to the
          // row or card that opened it, which has arrow keys of its own
          if (
            event.key === "ArrowRight" ||
            event.key === "ArrowLeft" ||
            (event.key === "Escape" && level > 0)
          ) {
            event.stopPropagation();
          }
          if (event.key === "ArrowRight" && children.length) {
            event.preventDefault();
            focusOnOpen.current = level + 1;
            open(level, kind.id);
          } else if ((event.key === "ArrowLeft" || event.key === "Escape") && level > 0) {
            // back to the option the list was opened from; Escape in the first
            // list closes the whole picker
            event.preventDefault();
            const parent = openPath[level - 1];
            open(level - 1, null);
            document
              .querySelector<HTMLElement>(
                `[data-option-level="${level - 1}"][data-option-id="${parent}"]`
              )
              ?.focus();
          }
        }}
      >
        <Icon />
        <StyledPickerLabel>
          <StyledPickerHead>
            {concept ? (
              <ChoiceTag entity={concept} fullWidth highlighted={highlighted && clickable} withTooltip />
            ) : (
              info.label
            )}
            {fits ? (
              <StyledPickerAside>
                {kind.favorite && answering.length > 1 ? "★ favourite" : "what the sources call it"}
              </StyledPickerAside>
            ) : null}
          </StyledPickerHead>
          {!mapped ? (
            <StyledPickerDescription>
              No Concept is assigned for this location type.
            </StyledPickerDescription>
          ) : inferred ? (
            <StyledPickerDescription>
              Already applies through {viaLabel(entry!.via)}.
            </StyledPickerDescription>
          ) : direct && !toggling ? (
            <StyledPickerDescription>This place already has it.</StyledPickerDescription>
          ) : !kind.active && !direct ? (
            <StyledPickerDescription>
              Deactivated: not offered for a new assignment.
            </StyledPickerDescription>
          ) : null}
        </StyledPickerLabel>
        {direct ? (
          <StyledPickerCheck aria-hidden>
            <IcoCheck />
          </StyledPickerCheck>
        ) : null}
      </StyledPickerOption>
      {children.length ? (
        <StyledSubmenuToggle
          type="button"
          tabIndex={-1}
          $open={isOpen}
          aria-label={`subclasses of ${kind.name}`}
          onClick={() => open(level, isOpen ? null : kind.id)}
        >
          <IcoChevronRight />
        </StyledSubmenuToggle>
      ) : null}
      {isOpen ? (
        <PickerSubmenu
          row={row.current}
          level={level + 1}
          label={`subclasses of ${kind.name}`}
          onScroll={() => open(level + 1, null)}
        >
          {children.map((child) => (
            <PickerRow key={child.id} kind={child} level={level + 1} ctx={ctx} />
          ))}
        </PickerSubmenu>
      ) : null}
    </StyledPickerRow>
  );
};

/**
 * The one control for choosing what location type something is, the subclass
 * tree of each opening beside it.
 *
 * The first list holds the location types the project set up. One whose
 * Concept has subclasses opens them in a list beside it on hover, on its arrow
 * or with the right arrow key, and so on down the tree; any of them, a group
 * included, is chosen by clicking it. A deactivated Concept is not offered: it
 * is left out, or shown only as the way to subclasses that are offered.
 */
export const PlaceTypePicker: React.FC<PlaceTypePicker> = ({
  anchor,
  held,
  suggested,
  clearLabel,
  clearDescription,
  note,
  onChoose,
  onToggle,
  onClose,
}) => {
  const kinds = usePlaceTypes();
  const concepts = usePlaceTypeConcepts();
  const viaLabel = useViaLabel();
  const below = useMemo(() => childrenOf(kinds), [kinds]);
  // the favourite leads the location types that answer to the suggestion; the rest keep
  // the order the project listed them in
  const roots = rootsOf(kinds);
  const answering = kindsForEngineType(kinds, suggested);
  const ordered = [...answering, ...roots.filter((one) => !answering.includes(one))];
  const engineLabel = suggested ? placeTypeInfo(suggested).label : "";
  const toggling = !!onToggle;

  // a tick shows as soon as it is made, and the Location's own list replaces it
  // when that arrives; until then another click waits, so two writes on one
  // Location never overtake each other
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const heldKey = JSON.stringify(held ?? null);
  useEffect(() => setTicked({}), [heldKey]);

  /** The node whose subclasses are open at each level, the first list being level 0. */
  const [openPath, setOpenPath] = useState<string[]>([]);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusOnOpen = useRef<number | null>(null);
  useEffect(() => () => (hoverTimer.current ? clearTimeout(hoverTimer.current) : undefined), []);

  // the first option of a list opened from the keyboard takes the focus
  useEffect(() => {
    if (focusOnOpen.current === null) {
      return;
    }
    const level = focusOnOpen.current;
    focusOnOpen.current = null;
    document
      .querySelector<HTMLElement>(`[data-level="${level}"] [role=option]:not(:disabled)`)
      ?.focus();
  }, [openPath]);

  const toggle = async (kindId: string, on: boolean) => {
    setTicked((current) => ({ ...current, [kindId]: on }));
    setBusy(true);
    const written = await onToggle?.(kindId, on);
    setBusy(false);
    if (written === false) {
      setTicked((current) => {
        const next = { ...current };
        delete next[kindId];
        return next;
      });
    }
  };

  const entryOf = (kind: PlaceTypeNode) => held?.find((one) => one.typeId === kind.id);
  // set on this Location itself, or only through a subclass or a synonym
  const directOf = (kind: PlaceTypeNode) => {
    const entry = entryOf(kind);
    return kind.id in ticked ? ticked[kind.id] : !!entry && !entry.inferred;
  };

  // a Concept is listed where it is offered, where the Location has it (so it
  // can be taken off), or where something offered lies below it
  const shownCache = new Map<string, boolean>();
  const isShown = (kind: PlaceTypeNode, trail: Set<string> = new Set()): boolean => {
    if (shownCache.has(kind.id)) {
      return shownCache.get(kind.id)!;
    }
    const deeper = new Set(trail).add(kind.id);
    const shown =
      (kind.active && !!kind.conceptId) ||
      directOf(kind) ||
      (below.get(kind.id) ?? []).some((child) => !trail.has(child.id) && isShown(child, deeper));
    shownCache.set(kind.id, shown);
    return shown;
  };
  const shownChildren = (kind: PlaceTypeNode) =>
    (below.get(kind.id) ?? []).filter((child) => isShown(child));

  const open = (level: number, kindId: string | null) =>
    setOpenPath((current) =>
      kindId === null ? current.slice(0, level) : [...current.slice(0, level), kindId]
    );

  // one timer for every row, so passing over a row on the way into a list
  // already open does not close it
  const hover = (level: number, kind: PlaceTypeNode | null, hasChildren: boolean) => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }
    hoverTimer.current = setTimeout(
      () => open(level, kind && hasChildren ? kind.id : null),
      HOVER_OPEN_MS
    );
  };

  const ctx: RowContext = {
    openPath,
    shownChildren,
    answering,
    toggling,
    busy,
    ticked,
    entryOf,
    directOf,
    concepts,
    viaLabel,
    hover,
    open,
    toggle,
    onChoose,
    focusOnOpen,
  };

  return (
    <FloatingPicker
      anchor={anchor}
      ariaLabel="Location type"
      multiselectable={toggling}
      onClose={onClose}
      onScroll={() => open(0, null)}
      header={
        <PickerHeader
          caption={toggling ? "location types of this place" : "add a location type"}
          recordedAs={<ClassificationHeading />}
          notes={[
            note,
            answering.length > 1 ? (
              <>
                {answering.length} of your location types answer to &ldquo;{engineLabel}&rdquo;,
                the gazetteers&apos; word for it — the starred one is your favourite.
              </>
            ) : null,
          ]}
        />
      }
      footer={
        toggling ? (
          <StyledPickerFooter>
            <Button label="done" color="primary" size={ButtonSize.Small} onClick={onClose} />
          </StyledPickerFooter>
        ) : null
      }
    >
      {clearLabel && !toggling ? (
        <StyledPickerOption
          type="button"
          role="option"
          aria-selected={false}
          onMouseEnter={() => hover(0, null, false)}
          onClick={() => onChoose?.(null)}
        >
          <UNKNOWN_PLACE_TYPE.icon />
          <StyledPickerLabel>
            {clearLabel}
            {clearDescription ? (
              <StyledPickerDescription>{clearDescription}</StyledPickerDescription>
            ) : null}
          </StyledPickerLabel>
        </StyledPickerOption>
      ) : null}

      {ordered
        .filter((kind) => isShown(kind) || !kind.conceptId)
        .map((kind) => (
          <PickerRow key={kind.id} kind={kind} level={0} ctx={ctx} />
        ))}
    </FloatingPicker>
  );
};
