import { DropdownItem } from "@inkvisitor/shared/types";
import { ChangeMeta } from "./types";

export const filterOptions = <O extends DropdownItem>(
  options: O[],
  search: string
): O[] => {
  const needle = search.trim().toLowerCase();
  if (!needle) {
    return options;
  }
  return options.filter((o) => o.label.toLowerCase().includes(needle));
};

export const toggleSelection = <O extends DropdownItem>(
  current: O[],
  option: O,
  multi: boolean
): { next: O[]; meta: ChangeMeta<O> } => {
  if (!multi) {
    return { next: [option], meta: { action: "select", option } };
  }
  const alreadySelected = current.some((o) => o.value === option.value);
  if (alreadySelected) {
    return {
      next: current.filter((o) => o.value !== option.value),
      meta: { action: "deselect", option },
    };
  }
  return { next: [...current, option], meta: { action: "select", option } };
};

export const removeChip = <O extends DropdownItem>(
  current: O[],
  option: O
): { next: O[]; meta: ChangeMeta<O> } => ({
  next: current.filter((o) => o.value !== option.value),
  meta: { action: "remove-chip", option },
});

export const popLastSelection = <O extends DropdownItem>(
  current: O[]
): { next: O[]; meta: ChangeMeta<O> } => ({
  next: current.slice(0, -1),
  meta: { action: "pop", option: current[current.length - 1] },
});

export const clearSelection = <O extends DropdownItem>(): {
  next: O[];
  meta: ChangeMeta<O>;
} => ({ next: [], meta: { action: "clear" } });

export const getDisabledIndices = (options: DropdownItem[]): number[] =>
  options.reduce<number[]>((acc, o, i) => {
    if (o.isDisabled) {
      acc.push(i);
    }
    return acc;
  }, []);
