import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, IStatement, ITerritory } from "@inkvisitor/shared/types";
import { Dropzone } from "components";
import { InstTemplate } from "constructors";
import React, { ReactElement, useState } from "react";
import { EntityDragItem } from "types";
import { getStoredUserRole } from "utils/userStorage";

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
}) => {
  const [isWrongDropCategory, setIsWrongDropCategory] = useState(false);

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

  const handleDropped = (newDropped: EntityDragItem, instantiateTemplate?: boolean) => {
    if (!isWrongDropCategory) {
      if (instantiateTemplate && !disableTemplateInstantiation) {
        newDropped.entity && handleInstantiateTemplate(newDropped.entity);
      } else {
        onSelected(newDropped.id);
        if (newDropped.entity) {
          onPicked(newDropped.entity);
        }
        newDropped.entity && onPicked(newDropped.entity);
      }
    }
  };

  const handleHoverred = (newHoverred: EntityDragItem) => {
    const hoverredCategory = newHoverred.entityClass;
    if (
      !categoryTypes.includes(hoverredCategory) ||
      (disableTemplatesAccept && newHoverred.isTemplate) ||
      newHoverred.isDiscouraged ||
      (newHoverred.isTemplate &&
        newHoverred.entityClass === EntityEnums.Class.Territory &&
        !territoryParentId) ||
      excludedActantIds.includes(newHoverred.id) ||
      excludedEntityClasses.includes(newHoverred.entityClass)
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
      isWrongDropCategory={isWrongDropCategory}
      disabled={disabled}
    >
      {children}
    </Dropzone>
  );
};
