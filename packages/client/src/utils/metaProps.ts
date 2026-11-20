import { IProp } from "@inkvisitor/shared/types";

// Each function returns a new tree and leaves `props` untouched: the Editor saves the
// difference between its edited statement and the cached one, so the cached props must not change.

export const addChildMetaProp = (props: IProp[], parentId: string, newProp: IProp): IProp[] =>
  props.map((prop) => ({
    ...prop,
    children:
      prop.id === parentId
        ? [...prop.children, newProp]
        : addChildMetaProp(prop.children, parentId, newProp),
  }));

export const updateMetaProp = (
  props: IProp[],
  propId: string,
  changes: Partial<IProp>,
): IProp[] =>
  props.map((prop) =>
    prop.id === propId
      ? { ...prop, ...changes }
      : { ...prop, children: updateMetaProp(prop.children, propId, changes) },
  );

export const removeMetaProp = (props: IProp[], propId: string): IProp[] =>
  props
    .filter((prop) => prop.id !== propId)
    .map((prop) => ({ ...prop, children: removeMetaProp(prop.children, propId) }));

export const moveMetaProp = (
  props: IProp[],
  propId: string,
  oldIndex: number,
  newIndex: number,
): IProp[] => {
  if (props.some((prop) => prop.id === propId)) {
    const moved = [...props];
    moved.splice(newIndex, 0, moved.splice(oldIndex, 1)[0]);
    return moved;
  }
  return props.map((prop) => ({
    ...prop,
    children: moveMetaProp(prop.children, propId, oldIndex, newIndex),
  }));
};
