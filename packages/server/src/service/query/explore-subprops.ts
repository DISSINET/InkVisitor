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
