import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { UserOptions } from "@inkvisitor/shared/types/response-user";
import { CEntity } from "constructors";

/**
 * A V is an endpoint: the "40" in "having 40 years" and the "40" in "owning 40
 * bottles of wine" are two entities, never one shared between the two slots. A
 * slot that stores a V therefore links a copy of a dropped V rather than the
 * dragged entity itself. Lookup targets - bookmarks, search filters, rule
 * definitions - point at an entity that already exists, so they pass
 * reuseDroppedValue and keep the dragged id.
 */
export const copiesDroppedValue = ({
  entityClass,
  categoryTypes,
  reuseDroppedValue,
  canCreate,
}: {
  entityClass: EntityEnums.Class | EntityEnums.Extension;
  categoryTypes: EntityEnums.ExtendedClass[];
  reuseDroppedValue?: boolean;
  canCreate: boolean;
}): boolean =>
  entityClass === EntityEnums.Class.Value &&
  !reuseDroppedValue &&
  canCreate &&
  categoryTypes.includes(EntityEnums.Class.Value);

/** The copy is a new entity, so the drop needs the same rights a create needs. */
export const canCreateEntities = (userRole: string | null, disableCreate?: boolean): boolean =>
  !disableCreate && !!userRole && userRole !== UserEnums.Role.Viewer;

/**
 * The copy carries the label the user sees and nothing else - detail, props,
 * references and relations belong to the entity that was dragged, not to the
 * new endpoint. CEntity gives a V the Approved status and the user's language.
 */
export const buildValueCopy = (source: IEntity, userOptions: UserOptions): IEntity => {
  const copy = CEntity(userOptions, EntityEnums.Class.Value, source.labels?.[0] ?? "");
  return source.labels?.length ? { ...copy, labels: [...source.labels] } : copy;
};
