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

interface UseDropdownArgs<O extends DropdownItem> {
  options: O[];
  value: O[];
  multi: boolean;
  searchable: boolean;
  disabled: boolean;
  closeMenuOnSelect: boolean;
  onChange: (next: O[], meta: ChangeMeta<O>) => void;
}

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (searchable ? filterOptions(options, search) : options),
    [options, search, searchable]
  );

  const itemsRef = useRef<Array<HTMLElement | null>>([]);
  const labelsRef = useRef<Array<string | null>>([]);
  labelsRef.current = filtered.map((o) => o.label);

  /* Trim stale nodes after filtering to prevent ArrowDown walking past the last real row */
  useEffect(() => {
    itemsRef.current.length = filtered.length;
  }, [filtered]);

  /* Typing a filter always re-anchors the highlight to the first match */
  useEffect(() => {
    if (search) {
      setActiveIndex(filtered.length > 0 ? 0 : null);
    }
  }, [search, filtered.length]);

  const disabledIdx = getDisabledIndices(filtered);

  const closeMenu = () => {
    setOpen(false);
    setSearch("");
    setActiveIndex(null);
  };

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (next) => (next ? setOpen(true) : closeMenu()),
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(1),
      flip({ padding: 10 }),
      size({
        padding: 10,
        apply({ rects, availableHeight, elements }) {
          // menu tracks the control width; 18rem cap ≙ the old menu-list max-height
          elements.floating.style.width = `${rects.reference.width}px`;
          elements.floating.style.maxHeight = `min(${availableHeight}px, 18rem)`;
        },
      }),
    ],
  });

  const click = useClick(context, { enabled: !disabled, keyboardHandlers: false });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "listbox" });
  const listNav = useListNavigation(context, {
    listRef: itemsRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true, // focus stays on the control/input; aria-activedescendant tracks
    loop: true,
    disabledIndices: (index) =>
      index >= filtered.length || disabledIdx.includes(index),
    /* only seeds the highlight while not filtering — during a search the
       first-match effect owns the highlight, and a moving selectedIndex would
       re-trigger floating-ui's own seeding effect on every keystroke */
    selectedIndex: !search && value.length > 0
      ? (() => {
          const i = filtered.findIndex((o) => value.some((v) => v.value === o.value));
          return i === -1 ? null : i;
        })()
      : null,
  });
  const typeahead = useTypeahead(context, {
    listRef: labelsRef,
    activeIndex,
    onMatch: setActiveIndex,
    enabled: !searchable && open,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [click, dismiss, role, listNav, typeahead]
  );

  const emit = (result: { next: O[]; meta: ChangeMeta<O> }) =>
    onChange(result.next, result.meta);

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
  const clear = () => emit(clearSelection<O>());
  const isSelected = (option: O) =>
    value.some((v) => v.value === option.value);

  /* Enter/arrow/backspace behavior on the control; the floating-ui hooks
     handle arrow navigation while open, Esc, and outside-click dismissal. */
  const onControlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (open && activeIndex != null && filtered[activeIndex]) {
        e.preventDefault();
        selectOption(filtered[activeIndex]);
      }
    } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === " " && !open && !searchable) {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === "Backspace" && multi && !search && value.length > 0) {
      emit(popLastSelection(value));
    } else if (e.key === "Tab") {
      closeMenu();
    }
  };

  /* Consumer contract:
     - spread getReferenceProps({ onKeyDown: onControlKeyDown }) on the control;
     - every option must get getItemProps({ active: i === activeIndex,
       selected: isSelected(option), onClick: () => selectOption(option) })
       AND ref={(el) => { itemsRef.current[i] = el }} — the active/selected
       keys drive floating-ui's aria-activedescendant wiring;
     - the search input is a child of the control; the control div is the
       floating reference. */
  return {
    open,
    setOpen,
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
