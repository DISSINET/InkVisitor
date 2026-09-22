import { DropdownItem } from "@inkvisitor/shared/types";
import { Input } from "components";
import { IcoSearch } from "Theme/icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  StyledChip,
  StyledChipDrop,
  StyledChipField,
  StyledChipRow,
  StyledChipValue,
  StyledChipNoMatch,
  StyledChipContent,
  StyledChipSearch,
  StyledChipMenu,
  StyledChipMenuHead,
  StyledChipMenuTop,
  StyledChipOption,
  StyledChipOptionCount,
  StyledClearAll,
} from "./GeocodingListStyles";
import { ANY, GeocodingFilters } from "./useGeocodingBrowse";

/**
 * The filters, on screen rather than behind a toggle.
 *
 * A control reading "any" spends a whole field's width saying nothing, and six
 * of them fill the panel above the list they exist to narrow. A chip is as wide
 * as its content: unset it is a dashed outline the eye skips, set it states its
 * value and carries its own dismissal — so turning a filter off never means
 * opening it to choose "any" first.
 *
 * Every chip opens the same thing: its options as a list, chosen in one click.
 * A long list gains a field that narrows it, which is a different amount of the
 * same menu rather than a different control.
 */

/**
 * The option count from which the menu carries a search field.
 *
 * Below it the whole list is on screen and a field to narrow it is one more
 * thing to read; the language dictionary offers 490 and is unusable without one.
 */
const SEARCH_FROM = 10;

export interface FilterChip {
  key: keyof GeocodingFilters;
  /** What the chip says when nothing is chosen. */
  label: string;
  options: DropdownItem[];
  /**
   * How many rows each option would leave, by option value.
   *
   * Shown beside the option it belongs to. Only some filters can be counted:
   * an option with no figure is still a row in the same list.
   */
  counts?: Record<string, number>;
  /**
   * What the chip opens, where a list of options is the wrong shape for the
   * filter. A territory is a position in a tree and is found by typing, so it
   * has no list to offer.
   *
   * Drawn inside the same menu the option lists use. Opened in place under the
   * chip row instead, it sat outside the menu element this component watches
   * for clicks, so the first press on anything in it — the suggester's own
   * field included — was read as a press outside the menu and closed it.
   */
  content?: React.ReactNode;
  /** What the chip reads when set, where the value is not one of `options`. */
  valueLabel?: string;
}

interface GeocodingFilterChips {
  chips: FilterChip[];
  filters: GeocodingFilters;
  setFilter: (key: keyof GeocodingFilters, value: string) => void;
  /** Every filter back to "any", in one action. */
  onClearAll: () => void;
}

export const GeocodingFilterChips: React.FC<GeocodingFilterChips> = ({
  chips,
  filters,
  setFilter,
  onClearAll,
}) => {
  const [open, setOpen] = useState<{
    key: keyof GeocodingFilters;
    anchor: { left: number; top: number };
  } | null>(null);

  /** Narrows a long option list. Belongs to the open menu, so it opens empty. */
  const [search, setSearch] = useState("");

  const menu = useRef<HTMLDivElement | null>(null);
  /** The chip the menu belongs to, so it can follow the chip rather than close. */
  const anchorOf = useRef<HTMLButtonElement | null>(null);

  // the menu is portalled to the body so the panel's own overflow cannot clip
  // it, which also means it does not move with the panel. It follows its chip
  // instead of closing, which is what a menu does everywhere else
  useEffect(() => {
    if (!open) {
      return;
    }
    const follow = () => {
      const chip = anchorOf.current;
      if (!chip) {
        return;
      }
      const box = chip.getBoundingClientRect();
      setOpen((current) =>
        current ? { ...current, anchor: { left: box.left, top: box.bottom + 2 } } : current,
      );
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(null);
      }
    };
    const onDown = (event: MouseEvent) => {
      if (!menu.current?.contains(event.target as Node)) {
        setOpen(null);
      }
    };
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open?.key]);

  // ANY is the only sentinel for "not filtering". An empty string is a value a
  // filter can hold - the language dictionary offers one, labelled "empty" -
  // and reading it as unset leaves a chip saying nothing while the list is cut
  // to a fortieth of its size
  /**
   * What a chip holds when it is not filtering.
   *
   * The first option by convention, which every chip here builds as "any".
   * Reading it from the list rather than assuming a sentinel is what stops a
   * filter that uses a different one from showing an undroppable chip.
   */
  const unsetOf = (chip: FilterChip) =>
    chip.options.length ? chip.options[0].value : ANY;

  const anySet = chips.some((chip) => filters[chip.key] !== unsetOf(chip));
  const opened = open ? chips.find((chip) => chip.key === open.key) : undefined;

  const searchable = !opened?.content && (opened?.options.length || 0) >= SEARCH_FROM;
  const shown = useMemo(() => {
    const options = opened?.options || [];
    const needle = search.trim().toLowerCase();
    return needle ? options.filter((option) => option.label.toLowerCase().includes(needle)) : options;
  }, [opened, search]);

  const labelFor = (chip: FilterChip) =>
    chip.valueLabel ||
    chip.options.find((option) => option.value === filters[chip.key])?.label ||
    String(filters[chip.key]);

  return (
    <StyledChipRow role="group" aria-label="Filters">
      {chips.map((chip) => {
        const set = filters[chip.key] !== unsetOf(chip);
        return (
          <StyledChip
            key={chip.key}
            type="button"
            $on={set}
            aria-expanded={open?.key === chip.key}
            title={set ? `${chip.label}: ${labelFor(chip)}` : `filter by ${chip.label}`}
            onClick={(event) => {
              anchorOf.current = event.currentTarget;
              const box = event.currentTarget.getBoundingClientRect();
              setSearch("");
              setOpen((current) =>
                current?.key === chip.key
                  ? null
                  : { key: chip.key, anchor: { left: box.left, top: box.bottom + 2 } },
              );
            }}
          >
            <StyledChipField>{chip.label}</StyledChipField>
            {set ? <StyledChipValue>{labelFor(chip)}</StyledChipValue> : null}
            {set ? (
              // its own control rather than a click zone inside the chip, so it
              // is reachable by keyboard and announced as what it does
              <StyledChipDrop
                as="span"
                role="button"
                tabIndex={0}
                aria-label={`drop the ${chip.label} filter`}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen(null);
                  setFilter(chip.key, unsetOf(chip));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    setOpen(null);
                    setFilter(chip.key, unsetOf(chip));
                  }
                }}
              >
                ×
              </StyledChipDrop>
            ) : null}
          </StyledChip>
        );
      })}

      {anySet ? (
        <StyledClearAll type="button" onClick={onClearAll}>
          clear all
        </StyledClearAll>
      ) : null}

      {open && opened
        ? createPortal(
            <StyledChipMenu
              ref={menu}
              $left={open.anchor.left}
              $top={open.anchor.top}
              role="listbox"
              aria-label={opened.label}
            >
              {/* the name of the filter and, where the list is long enough to
                  need it, the field that narrows it: both stay put while the
                  options scroll under them */}
              <StyledChipMenuTop>
                <StyledChipMenuHead>{opened.label}</StyledChipMenuHead>
                {searchable ? (
                  <StyledChipSearch>
                    <Input
                      value={search}
                      onChangeFn={setSearch}
                      placeholder={`search ${opened.label}…`}
                      icon={<IcoSearch />}
                      onEscapePressFn={() => setOpen(null)}
                      changeOnType
                      autoFocus
                      width="full"
                    />
                  </StyledChipSearch>
                ) : null}
              </StyledChipMenuTop>
              {opened.content ? <StyledChipContent>{opened.content}</StyledChipContent> : null}
              {(opened.content ? [] : shown).map((option) => (
                <StyledChipOption
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={filters[opened.key] === option.value}
                  $on={filters[opened.key] === option.value}
                  onClick={() => {
                    setFilter(opened.key, option.value);
                    setOpen(null);
                  }}
                >
                  {option.label}
                  {/* what this option would leave, counted under every other
                      filter in force - the figure that turns choosing one from
                      a guess into a decision */}
                  {opened.counts?.[option.value] !== undefined ? (
                    <StyledChipOptionCount>{opened.counts[option.value]}</StyledChipOptionCount>
                  ) : null}
                </StyledChipOption>
              ))}
              {opened.content || shown.length ? null : (
                <StyledChipNoMatch>
                  {search.trim() ? `nothing matches “${search.trim()}”` : "nothing to choose from"}
                </StyledChipNoMatch>
              )}
            </StyledChipMenu>,
            document.body,
          )
        : null}
    </StyledChipRow>
  );
};
