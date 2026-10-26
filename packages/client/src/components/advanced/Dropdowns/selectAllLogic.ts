import { allEntities, empty } from "@inkvisitor/shared/dictionaries/entity";
import { DropdownItem } from "@inkvisitor/shared/types";
import { ChangeAction } from "components/basic/BaseDropdown/types";

const values = <T extends string>(items: DropdownItem[]): T[] =>
  items.map((i) => i.value as T);

/* The "last selected item is ANY" check works because the selection array is
   built specials-first and toggleSelection appends the clicked option last. */

export const resolveEntityMultiChange = <T extends string>(args: {
  selected: DropdownItem[];
  action: ChangeAction;
  options: DropdownItem[];
  disableEmpty: boolean;
}): T[] => {
  const { selected, action, options, disableEmpty } = args;

  const anyEquivalentValues = (): T[] => {
    const items: DropdownItem[] = [];
    if (!disableEmpty) {
      items.push(empty);
    }
    items.push(allEntities, ...options);
    return values(items);
  };

  const allClassesSelected = options.every((option) =>
    selected.some((s) => s.value === option.value)
  );
  const includesEmpty = selected.some((s) => s.value === empty.value);
  const includesAny = selected.some((s) => s.value === allEntities.value);

  if (selected.length > 0) {
    if (allClassesSelected && action === "deselect") {
      // empty was deselected (ANY still in) → keep as-is; ANY was deselected → collapse
      if (includesAny) {
        return values(selected);
      }
      return includesEmpty ? [empty.value as T] : [];
    }
    // a class removed by its chip or Backspace leaves ANY unlit, like a
    // deselect; checked before the last-item test, which a pop can leave on ANY
    if ((action === "pop" || action === "remove-chip") && includesAny && !allClassesSelected) {
      return values(selected.filter((o) => o.value !== allEntities.value));
    }
    if (selected[selected.length - 1].value === allEntities.value) {
      return anyEquivalentValues();
    }
    if (allClassesSelected && action === "select") {
      return anyEquivalentValues();
    }
    if (action === "deselect" && includesAny && !allClassesSelected) {
      return values(selected.filter((o) => o.value !== allEntities.value));
    }
  }
  return values(selected);
};

export const resolveAttributeMultiChange = <T extends string>(args: {
  selected: DropdownItem[];
  action: ChangeAction;
  options: DropdownItem[];
}): T[] => {
  const { selected, action, options } = args;

  const allWithoutAnySelected = options.every((option) =>
    selected.some((s) => s.value === option.value)
  );
  const includesAny = selected.some((s) => s.value === allEntities.value);

  if (selected.length > 0) {
    if (allWithoutAnySelected && action === "deselect") {
      return [];
    }
    // Backspace leaves ANY unlit, like a deselect; checked before the
    // last-item test, which a pop can leave on ANY
    if (action === "pop" && includesAny) {
      return values(selected.filter((o) => o.value !== allEntities.value));
    }
    if (selected[selected.length - 1].value === allEntities.value) {
      return values([allEntities, ...options]);
    }
    if (allWithoutAnySelected && action === "select") {
      return values([allEntities, ...options]);
    }
    if (action === "deselect" && includesAny) {
      return values(selected.filter((o) => o.value !== allEntities.value));
    }
  }
  return values(selected);
};
