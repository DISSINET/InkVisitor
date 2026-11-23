import { isDeepStrictEqual } from "node:util";
import { IProp } from "@inkvisitor/shared/types";

export type MetapropReplace =
  | { outcome: "unmatched" }
  | { outcome: "skipped" }
  | { outcome: "changed"; props: IProp[]; items: number; merged: boolean };

const listOf = (props: IProp[] | undefined): IProp[] => (Array.isArray(props) ? props : []);

const isPair = (prop: IProp, typeId: string, valueId: string): boolean =>
  prop.type?.entityId === typeId && (prop.value?.entityId ?? "") === valueId;

/** What two props of one type compare on: every field but `id`, `children`
 * and `value.entityId`. */
const settingsOf = (prop: IProp) => ({
  ...prop,
  id: undefined,
  children: undefined,
  value: { ...prop.value, entityId: undefined },
});

/** What replacing (T, X) with (T, Y) among the top-level metaprops of one entity
 * gives. `fromId` "" is the empty value. `props` is read, never changed. */
export function replaceMetaprops(
  props: IProp[] | undefined,
  typeId: string,
  fromId: string,
  toId: string
): MetapropReplace {
  const list = listOf(props);
  // ids repeat among the metaprops of one entity in stored data, so a match is
  // known by its index
  const isMatch = list.map((prop) => isPair(prop, typeId, fromId));
  const matches = list.filter((_, i) => isMatch[i]);
  if (!matches.length) {
    return { outcome: "unmatched" };
  }

  const targets = list.filter((prop) => isPair(prop, typeId, toId)).map(settingsOf);
  if (!targets.length) {
    return {
      outcome: "changed",
      props: list.map((prop, i) =>
        isMatch[i] ? { ...prop, value: { ...prop.value, entityId: toId } } : prop
      ),
      items: matches.length,
      merged: false,
    };
  }

  const droppable = (prop: IProp) =>
    !prop.children?.length && targets.some((t) => isDeepStrictEqual(settingsOf(prop), t));
  if (!matches.every(droppable)) {
    return { outcome: "skipped" };
  }
  return {
    outcome: "changed",
    props: list.filter((_, i) => !isMatch[i]),
    items: matches.length,
    merged: true,
  };
}

/** Subproperties, at any depth below the top level, of type `typeId` whose value is `fromId`. */
export function countNested(props: IProp[] | undefined, typeId: string, fromId: string): number {
  const count = (list: IProp[] | undefined): number =>
    listOf(list).reduce(
      (n, prop) => n + Number(isPair(prop, typeId, fromId)) + count(prop.children),
      0
    );
  return listOf(props).reduce((n, prop) => n + count(prop.children), 0);
}
