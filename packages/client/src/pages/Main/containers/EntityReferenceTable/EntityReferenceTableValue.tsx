import { EntityEnums } from "@shared/enums";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  EntityDropzone,
  EntityTag,
  EntitySuggester,
} from "components/advanced";
import React from "react";
import { StyledGridValue } from "./EntityReferenceTableStyles";
import { IEntity, IReference } from "@shared/types";

interface EntityReferenceTableValue {
  reference: IReference;
  valueEntity?: IEntity;
  resourceEntity?: IEntity;
  handleChangeValue: (
    refId: string,
    newValueId: string,
    instantUpdate?: boolean
  ) => void;
  isInsideTemplate?: boolean;
  territoryParentId?: string;
  alwaysShowCreateModal?: boolean;
  openDetailOnCreate?: boolean;

  disabled?: boolean;
}
export const EntityReferenceTableValue: React.FC<EntityReferenceTableValue> = ({
  reference,
  valueEntity,
  resourceEntity,
  handleChangeValue,
  isInsideTemplate,
  territoryParentId,
  alwaysShowCreateModal,
  openDetailOnCreate,

  disabled,
}) => {
  return (
    <StyledGridValue>
      {valueEntity ? (
        <EntityDropzone
          onSelected={(newSelectedId: string) => {
            handleChangeValue(reference.id, newSelectedId, true);
          }}
          categoryTypes={[EntityEnums.Class.Value]}
          excludedEntityClasses={excludedSuggesterEntities}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
          excludedActantIds={[valueEntity.id]}
          disabled={disabled}
        >
          <EntityTag
            entity={valueEntity}
            customTooltipAttributes={
              resourceEntity &&
              resourceEntity.data.partValueLabel && {
                partLabel: resourceEntity.data.partValueLabel,
              }
            }
            fullWidth
            unlinkButton={
              !disabled && {
                onClick: () => {
                  handleChangeValue(reference.id, "");
                },
                tooltipLabel: "unlink value",
              }
            }
          />
        </EntityDropzone>
      ) : (
        <EntitySuggester
          alwaysShowCreateModal={alwaysShowCreateModal}
          placeholder={resourceEntity?.data?.partValueLabel}
          excludedEntityClasses={excludedSuggesterEntities}
          openDetailOnCreate={openDetailOnCreate}
          territoryActants={[]}
          onSelected={(newSelectedId: string) => {
            handleChangeValue(reference.id, newSelectedId, true);
          }}
          categoryTypes={[EntityEnums.Class.Value]}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
          disabled={disabled}
        />
      )}
    </StyledGridValue>
  );
};
