import { IEntity, IProp, IResponseQuerySubProp } from "@inkvisitor/shared/types";

/**
 * Subproperties of the props of one type, grouped by the value entity they hang
 * under. Props sharing a value merge their subproperties; values without any
 * are left out.
 */
export const groupSubPropsByValue = (
  props: IProp[],
  propertyTypeId: string
): Record<string, IProp[]> => {
  const out: Record<string, IProp[]> = {};
  for (const prop of props) {
    const valueId = prop.value?.entityId;
    if (prop.type?.entityId !== propertyTypeId || !valueId || !prop.children?.length) {
      continue;
    }
    out[valueId] = (out[valueId] ?? []).concat(prop.children);
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
 * Swaps the entity ids in the prop trees for the loaded entities. A subproperty
 * with neither side loaded and nothing nested under it has nothing to show and
 * is dropped.
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
 * First-level props grouped by type, for the types where at least one prop has
 * subproperties. Every prop of such a type is kept, so the type's values all
 * show next to the ones that carry subproperties.
 */
export const groupPropsWithSubPropsByType = (props: IProp[]): Record<string, IProp[]> => {
  const byType: Record<string, IProp[]> = {};
  for (const prop of props) {
    const typeId = prop.type?.entityId;
    if (typeId) {
      byType[typeId] = (byType[typeId] ?? []).concat(prop);
    }
  }
  const out: Record<string, IProp[]> = {};
  for (const [typeId, typeProps] of Object.entries(byType)) {
    if (typeProps.some((prop) => prop.children?.length)) {
      out[typeId] = typeProps;
    }
  }
  return out;
};

/**
 * The props of one type as tree nodes under that type: each node is a prop's
 * value with its subproperties, the type itself being the parent.
 */
export const resolvePropsUnderType = (
  props: IProp[],
  entityById: Record<string, IEntity>
): IResponseQuerySubProp[] => {
  const out: IResponseQuerySubProp[] = [];
  for (const prop of props) {
    const value = entityById[prop.value?.entityId];
    const children = resolveSubProps(prop.children ?? [], entityById);
    if (!value && !children.length) {
      continue;
    }
    out.push({ value, children });
  }
  return out;
};
