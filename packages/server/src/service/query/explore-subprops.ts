import { IEntity, IProp, IResponseQuerySubProp } from "@inkvisitor/shared/types";

const hasSubProps = (props: IProp[]): boolean => props.some((prop) => prop.children?.length);

/**
 * The props of one type grouped by their value entity, for an "Entity Property
 * value" cell. Empty unless one of those props has subproperties; then every
 * prop of the type is kept, so the tooltip lists all the cell's values.
 */
export const groupPropsByValue = (
  props: IProp[],
  propertyTypeId: string
): Record<string, IProp[]> => {
  const typeProps = props.filter(
    (prop) => prop.type?.entityId === propertyTypeId && prop.value?.entityId
  );
  if (!hasSubProps(typeProps)) {
    return {};
  }
  const out: Record<string, IProp[]> = {};
  for (const prop of typeProps) {
    const valueId = prop.value.entityId;
    out[valueId] = (out[valueId] ?? []).concat(prop);
  }
  return out;
};

/**
 * The props grouped by their type entity, for an "Entity Property types" cell.
 * Empty unless one of the props has subproperties; then every prop is kept, so
 * the tooltip lists all the cell's types with their values.
 */
export const groupPropsByType = (props: IProp[]): Record<string, IProp[]> => {
  if (!hasSubProps(props)) {
    return {};
  }
  const out: Record<string, IProp[]> = {};
  for (const prop of props) {
    const typeId = prop.type?.entityId;
    if (typeId) {
      out[typeId] = (out[typeId] ?? []).concat(prop);
    }
  }
  return out;
};

/** Type and value entity ids referenced anywhere in the given prop trees. */
export const collectSubPropEntityIds = (props: IProp[]): string[] => {
  const ids: string[] = [];
  for (const prop of props) {
    if (prop.type?.entityId) {
      ids.push(prop.type.entityId);
    }
    if (prop.value?.entityId) {
      ids.push(prop.value.entityId);
    }
    ids.push(...collectSubPropEntityIds(prop.children ?? []));
  }
  return ids;
};

/**
 * Swaps the entity ids in the prop trees for the loaded entities. A prop with
 * neither side loaded and nothing nested under it has nothing to show and is
 * dropped.
 */
export const resolveSubProps = (
  props: IProp[],
  entityById: Record<string, IEntity>
): IResponseQuerySubProp[] => {
  const out: IResponseQuerySubProp[] = [];
  for (const prop of props) {
    const type = entityById[prop.type?.entityId];
    const value = entityById[prop.value?.entityId];
    const children = resolveSubProps(prop.children ?? [], entityById);
    if (!type && !value && !children.length) {
      continue;
    }
    out.push({ type, value, children });
  }
  return out;
};

/**
 * The subproperty types under a set of props, merged: each subproperty type
 * appears once per level however many props use it, and its own subproperty
 * types merge the same way below it. Values are left out; a node carries only
 * its type. Subproperties without a loaded type are skipped.
 */
export const resolveSubPropTypes = (
  props: IProp[],
  entityById: Record<string, IEntity>
): IResponseQuerySubProp[] => {
  const childrenByType: Record<string, IProp[]> = {};
  const typeOrder: string[] = [];
  for (const prop of props) {
    for (const child of prop.children ?? []) {
      const typeId = child.type?.entityId;
      if (!typeId || !entityById[typeId]) {
        continue;
      }
      if (!childrenByType[typeId]) {
        childrenByType[typeId] = [];
        typeOrder.push(typeId);
      }
      childrenByType[typeId].push(child);
    }
  }
  return typeOrder.map((typeId) => ({
    type: entityById[typeId],
    children: resolveSubPropTypes(childrenByType[typeId], entityById),
  }));
};
