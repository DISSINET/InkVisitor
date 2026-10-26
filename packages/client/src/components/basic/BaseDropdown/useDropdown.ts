import {
  autoUpdate,
  flip,
  offset,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from "@floating-ui/react";
import { DropdownItem } from "@inkvisitor/shared/types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  clearSelection,
  filterOptions,
  getDisabledIndices,
  popLastSelection,
  removeChip as removeChipOp,
  toggleSelection,
} from "./dropdownLogic";
import { ChangeMeta } from "./types";

const MENU_MAX_HEIGHT = 320;
const MENU_MIN_HEIGHT = 180;

/* size runs before flip: the menu is trimmed to the room on its side, but
   never below MENU_MIN_HEIGHT, so only a side too cramped to use still
   overflows and makes flip move the menu to the other side */
const menuMiddleware = [
  offset(1),
  size({
    padding: 10,
    apply({ rects, availableHeight, elements }) {
      elements.floating.style.width = `${rects.reference.width}px`;
      elements.floating.style.maxHeight = `${Math.min(
        MENU_MAX_HEIGHT,
        Math.max(availableHeight, MENU_MIN_HEIGHT),
      )}px`;
    },
  }),
  flip({ padding: 10, fallbackStrategy: "bestFit" }),
];

interface UseDropdownArgs<O extends DropdownItem> {
  options: O[];
  value: O[];
  multi: boolean;
  searchable: boolean;
  disabled: boolean;
  closeMenuOnSelect: boolean;
  onChange: (next: O[], meta: ChangeMeta<O>) => void;
}

/* Consumer contract:
   - spread getReferenceProps({ onKeyDown: onControlKeyDown }) on the control;
   - every option must get getItemProps({ active: i === activeIndex,
     selected: isSelected(option), onClick: () => selectOption(option) })
     AND ref={(el) => { itemsRef.current[i] = el }} — the active/selected
     keys drive floating-ui's aria-activedescendant wiring;
   - the search input is a child of the control; the control div is the
     floating reference. */
export const useDropdown = <O extends DropdownItem>({
  options,
  value,
  multi,
  searchable,
  disabled,
  closeMenuOnSelect,
  onChange,
}: UseDropdownArgs<O>) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // the index of the currently highlighted option
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // the options that are currently visible in the menu
  const filtered = useMemo(
    () => (searchable ? filterOptions(options, search) : options),
    [options, search, searchable],
  );

  // refs to the DOM elements of the options
  const itemsRef = useRef<Array<HTMLElement | null>>([]);
  // refs to the labels of the options
  const labelsRef = useRef<Array<string | null>>([]);
  // update the labels ref to the labels of the filtered options
  labelsRef.current = filtered.map((o) => o.label);

  /* Trim stale nodes after filtering to prevent ArrowDown walking past the last real row */
  useEffect(() => {
    itemsRef.current.length = filtered.length;
  }, [filtered]);

  const disabledIdx = getDisabledIndices(filtered);

  const isSelected = (option: O) => value.some((v) => v.value === option.value);

  /* only seeds the highlight while not filtering — during a search the
     first-match effect owns the highlight, and a moving selectedIndex would
     re-trigger floating-ui's own seeding effect on every keystroke */
  const firstSelectedIndex = filtered.findIndex(isSelected);
  const selectedIndex = !search && firstSelectedIndex !== -1 ? firstSelectedIndex : null;

  /* Typing a filter always re-anchors the highlight to the first match; an
     emptied filter goes back to the selected option, or the first one */
  useEffect(() => {
    if (search) {
      setActiveIndex(filtered.length > 0 ? 0 : null);
    } else if (open) {
      const firstEnabledIndex = filtered.findIndex((o) => !o.isDisabled);
      setActiveIndex(selectedIndex ?? (firstEnabledIndex !== -1 ? firstEnabledIndex : null));
    }
  }, [search, filtered.length]);

  /* the highlight scrolls into view only after a key press or on opening, so
     hovering an option at the menu's edge never jerks the list under the
     pointer */
  const scrollOnNavRef = useRef(false);

  const openMenu = () => {
    scrollOnNavRef.current = true;
    setOpen(true);
  };

  const closeMenu = () => {
    scrollOnNavRef.current = false;
    setOpen(false);
    setSearch("");
    setActiveIndex(null);
  };

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (next) => (next ? openMenu() : closeMenu()),
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: menuMiddleware,
  });

  // toggle is off so a click in the search input keeps the menu and the typed
  // filter; the control's own onClick closes the menu on clicks elsewhere
  const click = useClick(context, {
    enabled: !disabled,
    keyboardHandlers: false,
    toggle: false,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "listbox" });
  const listNav = useListNavigation(context, {
    listRef: itemsRef,
    activeIndex,
    // the pointer leaving the menu reports null; the last highlight stays, so
    // Enter still picks the option the pointer was on
    onNavigate: (index) => {
      if (index != null) {
        setActiveIndex(index);
      }
    },
    // with nothing selected, an open menu highlights its first option, ready
    // for Enter
    focusItemOnOpen: true,
    virtual: true, // focus stays on the control/input; aria-activedescendant tracks
    loop: true,
    disabledIndices: (index) => index >= filtered.length || disabledIdx.includes(index),
    selectedIndex,
    // Element.scrollIntoView also scrolls every ancestor, #page-content
    // included, whose overflow is hidden, so the effect below scrolls the
    // menu alone
    scrollItemIntoView: false,
  });
  const typeahead = useTypeahead(context, {
    listRef: labelsRef,
    activeIndex,
    onMatch: setActiveIndex,
    enabled: !searchable && open,
  });

  useEffect(() => {
    if (!open || activeIndex == null || !scrollOnNavRef.current) return;
    scrollOnNavRef.current = false;
    // waits a frame for the size middleware to set the menu's max height
    const frame = requestAnimationFrame(() => {
      const menu = refs.floating.current;
      const item = itemsRef.current[activeIndex];
      if (!menu || !item) return;
      const menuTop = menu.getBoundingClientRect().top + menu.clientTop;
      const menuBottom = menuTop + menu.clientHeight;
      const { top, bottom } = item.getBoundingClientRect();
      if (top < menuTop) {
        menu.scrollTop -= menuTop - top;
      } else if (bottom > menuBottom) {
        menu.scrollTop += bottom - menuBottom;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [open, activeIndex]);

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNav,
    typeahead,
  ]);

  const emit = (result: { next: O[]; meta: ChangeMeta<O> }) => onChange(result.next, result.meta);

  const selectOption = (option: O) => {
    if (option.isDisabled) {
      return;
    }
    emit(toggleSelection(value, option, multi));
    if (closeMenuOnSelect) {
      closeMenu();
    } else {
      setSearch("");
    }
  };

  const removeChip = (option: O) => emit(removeChipOp(value, option));
  // clearing means the user wants nothing selected, so the open menu goes too
  const clear = () => {
    emit(clearSelection<O>());
    closeMenu();
  };

  /* Enter/arrow/backspace behavior on the control; the floating-ui hooks
     handle arrow navigation while open, Esc, and outside-click dismissal. */
  const onControlKeyDown = (e: React.KeyboardEvent) => {
    scrollOnNavRef.current = true;
    if (e.key === "Enter") {
      if (open) {
        // an open menu owns Enter: document-level shortcuts (Explorer's run
        // search) must not react to the Enter that picks an option
        e.stopPropagation();
      }
      if (open && activeIndex != null && filtered[activeIndex]) {
        e.preventDefault();
        selectOption(filtered[activeIndex]);
      }
    } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) {
      e.preventDefault();
      openMenu();
    } else if (e.key === " " && !open && !searchable) {
      e.preventDefault();
      openMenu();
    } else if (e.key === "Backspace" && multi && !search && value.length > 0) {
      emit(popLastSelection(value));
    } else if (e.key === "Tab") {
      // a single dropdown takes the highlighted option on Tab; in a multi one
      // that option may already be selected, and Tab would deselect it
      if (open && !multi && activeIndex != null && filtered[activeIndex]) {
        selectOption(filtered[activeIndex]);
      }
      closeMenu();
    }
  };

  return {
    open,
    openMenu,
    closeMenu,
    search,
    setSearch,
    filtered,
    activeIndex,
    refs,
    floatingStyles,
    getReferenceProps,
    getFloatingProps,
    getItemProps,
    itemsRef,
    selectOption,
    removeChip,
    clear,
    isSelected,
    onControlKeyDown,
  };
};
