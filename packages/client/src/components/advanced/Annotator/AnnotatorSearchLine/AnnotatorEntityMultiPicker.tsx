import { IEntity } from "@inkvisitor/shared/types";
import React from "react";
import { EntitySuggester } from "../../EntitySuggester/EntitySuggester";
import { EntityTag } from "../../EntityTag/EntityTag";
import { StyledEntityMultiPickerRow } from "./AnnotatorFindReplaceModalStyles";

interface AnnotatorEntityMultiPicker {
  entities: IEntity[];
  onPick: (entity: IEntity) => void;
  onRemove: (entityId: string) => void;
  placeholder?: string;
}

/**
 * Picked entities as tags plus a suggester that stays mounted, so several
 * entities accumulate before one action consumes the whole list.
 */
export const AnnotatorEntityMultiPicker: React.FC<AnnotatorEntityMultiPicker> = ({
  entities,
  onPick,
  onRemove,
  placeholder = "select entity",
}) => (
  <StyledEntityMultiPickerRow>
    {entities.map((entity) => (
      <EntityTag
        key={entity.id}
        entity={entity}
        unlinkButton={{ onClick: () => onRemove(entity.id) }}
      />
    ))}
    <EntitySuggester
      placeholder={placeholder}
      inputWidth="full"
      excludedActantIds={entities.map((entity) => entity.id)}
      onPicked={onPick}
    />
  </StyledEntityMultiPickerRow>
);
