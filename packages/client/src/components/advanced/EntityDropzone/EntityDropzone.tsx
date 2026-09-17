import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, IStatement, ITerritory } from "@inkvisitor/shared/types";
import { Dropzone } from "components";
import { InstTemplate } from "constructors";
import { useValueDropCopy } from "hooks/useValueDropCopy";
import React, { ReactElement, useState } from "react";
import { EntityDragItem } from "types";
import { getStoredUserRole } from "utils/userStorage";
import { canCreateEntities, copiesDroppedValue } from "utils/valueDropCopy";

interface EntityDropzone {
  categoryTypes: EntityEnums.ExtendedClass[];
  onSelected: (id: string) => void;
  onPicked?: (entity: IEntity) => void;
  excludedEntityClasses?: EntityEnums.Class[];
  excludedActantIds?: string[];

  isInsideTemplate?: boolean;
  disableTemplateInstantiation?: boolean;
  territoryParentId?: string;
  disableTemplatesAccept?: boolean;

  children: ReactElement;
  disabled?: boolean;
  /**
   * Refuses the drop while still registering as a target, so hovering it warns
   * the way a wrong entity class does. `disabled` instead leaves no target at
   * all, which reads as though the drag simply missed.
   */
  refuseDrop?: boolean;
  /**
   * Set on targets that move the entity rather than link it: a statement can
   * only leave a territory the user may write, so one dragged out of a
   * read-only territory is refused wherever it lands.
   */
  refuseReadOnlySource?: boolean;
  /**
   * Keeps the id of a dropped V instead of linking a copy of it. Set on targets
   * that point at an entity that already exists - a bookmark, a search filter,
   * a rule definition. A slot that stores a V links its own copy, see
   * copiesDroppedValue.
   */
  reuseDroppedValue?: boolean;
}
export const EntityDropzone: React.FC<EntityDropzone> = ({
  categoryTypes,
  onSelected,
  onPicked = () => {},
  excludedEntityClasses = [],
  excludedActantIds = [],

  isInsideTemplate = false,
  disableTemplateInstantiation,
  territoryParentId,
  disableTemplatesAccept,

  children,
  disabled,
  refuseDrop,
  refuseReadOnlySource,
  reuseDroppedValue,
}) => {
  const [isWrongDropCategory, setIsWrongDropCategory] = useState(false);
  const rejectsDrop = isWrongDropCategory || !!refuseDrop;

  const copyDroppedValue = useValueDropCopy();

  const copiesValue = (item: EntityDragItem) =>
    copiesDroppedValue({
      entityClass: item.entityClass,
      categoryTypes,
      reuseDroppedValue,
      canCreate: canCreateEntities(getStoredUserRole()),
    });

  const handleInstantiateTemplate = async (
    templateToDuplicate: IEntity | IStatement | ITerritory,
  ) => {
    const newEntity = await InstTemplate(
      templateToDuplicate,
      getStoredUserRole() as UserEnums.Role,
    );
    if (newEntity) {
      onSelected(newEntity.id);
      onPicked(newEntity);
    }
  };

  const handleDropped = async (newDropped: EntityDragItem, instantiateTemplate?: boolean) => {
    if (rejectsDrop) {
      return;
    }
    if (instantiateTemplate && !disableTemplateInstantiation) {
      newDropped.entity && handleInstantiateTemplate(newDropped.entity);
      return;
    }
    if (copiesValue(newDropped)) {
      const valueCopy = await copyDroppedValue(newDropped);
      if (valueCopy) {
        onSelected(valueCopy.id);
        onPicked(valueCopy);
      }
      return;
    }
    onSelected(newDropped.id);
    if (newDropped.entity) {
      onPicked(newDropped.entity);
    }
  };

  const handleHoverred = (newHoverred: EntityDragItem) => {
    const hoverredCategory = newHoverred.entityClass;
    if (
      !categoryTypes.includes(hoverredCategory) ||
      (disableTemplatesAccept && newHoverred.isTemplate) ||
      newHoverred.isDiscouraged ||
      (refuseReadOnlySource && newHoverred.entityIsReadOnly) ||
      (newHoverred.isTemplate &&
        newHoverred.entityClass === EntityEnums.Class.Territory &&
        !territoryParentId) ||
      excludedActantIds.includes(newHoverred.id) ||
      (excludedEntityClasses.includes(newHoverred.entityClass) && !copiesValue(newHoverred))
    ) {
      setIsWrongDropCategory(true);
    } else {
      setIsWrongDropCategory(false);
    }
  };

  return (
    <Dropzone
      onDrop={(newDropped: EntityDragItem, instantiateTemplate?: boolean) => {
        handleDropped(newDropped, instantiateTemplate);
      }}
      onHover={(newHoverred: EntityDragItem) => {
        handleHoverred(newHoverred);
      }}
      isInsideTemplate={isInsideTemplate}
      isWrongDropCategory={rejectsDrop}
      disabled={disabled}
    >
      {children}
    </Dropzone>
  );
};
