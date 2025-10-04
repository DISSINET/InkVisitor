import { EntityEnums } from "@shared/enums";
import { IEntity, IReference } from "@shared/types";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  EntityDropzone,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React from "react";
import { StyledGridValue } from "./EntityReferenceTableStyles";

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
  initValueTyped?: string;
  editorWidthTooNarrow: boolean;

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
  initValueTyped,
  editorWidthTooNarrow,

  disabled,
}) => {
  return (
    <StyledGridValue
      style={{
        minWidth: editorWidthTooNarrow ? "10rem" : "",
      }}
    >
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
          inputWidth={editorWidthTooNarrow ? "full" : 100}
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
          initTyped={initValueTyped}
          // autoFocus={initValueTyped !== undefined}
          disabled={disabled}
        />
      )}
    </StyledGridValue>
  );
};
