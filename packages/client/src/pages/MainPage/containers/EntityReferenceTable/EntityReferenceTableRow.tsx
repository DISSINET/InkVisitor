import { EntityEnums } from "@shared/enums";
import { IEntity, IReference } from "@shared/types";
import { Button } from "components";
import {
  EntityDropzone,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React from "react";
import { FaExternalLinkAlt, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  StyledReferencesListButtons,
  StyledReferencesListColumn,
  StyledReferenceValuePartLabel,
} from "./EntityReferenceTableStyles";

interface EntityReferenceTableRow {
  reference: IReference;
  resource: IEntity | undefined;
  value: IEntity | undefined;
  disabled?: boolean;
  handleRemove: (refId: string) => void;
  handleChangeResource: (refId: string, newResource: string) => void;
  handleChangeValue: (refId: string, newValue: string) => void;
  openDetailOnCreate?: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
}

export const EntityReferenceTableRow: React.FC<EntityReferenceTableRow> = ({
  reference,
  resource,
  value,
  disabled = true,
  handleRemove,
  handleChangeResource,
  handleChangeValue,
  openDetailOnCreate = false,
  isInsideTemplate = false,
  territoryParentId,
}) => {
  return (
    <React.Fragment>
      {/* resource */}
      <StyledReferencesListColumn>
        {resource ? (
          <EntityDropzone
            onSelected={(newSelectedId: string) => {
              handleChangeResource(reference.id, newSelectedId);
            }}
            disableTemplatesAccept
            categoryTypes={[EntityEnums.Class.Resource]}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
            excludedActantIds={[resource.id]}
          >
            <EntityTag
              entity={resource}
              fullWidth
              unlinkButton={
                !disabled && {
                  onClick: () => {
                    handleChangeResource(reference.id, "");
                  },
                  tooltipLabel: "unlink resource",
                }
              }
            />
          </EntityDropzone>
        ) : (
          !disabled && (
            <div>
              <EntitySuggester
                openDetailOnCreate={openDetailOnCreate}
                territoryActants={[]}
                onSelected={(newSelectedId: string) => {
                  handleChangeResource(reference.id, newSelectedId);
                }}
                disableTemplatesAccept
                categoryTypes={[EntityEnums.Class.Resource]}
                isInsideTemplate={isInsideTemplate}
                territoryParentId={territoryParentId}
              />
            </div>
          )
        )}
      </StyledReferencesListColumn>

      {/* value */}
      <StyledReferencesListColumn>
        {resource && resource.data.partValueLabel && (
          <StyledReferenceValuePartLabel>
            ({resource.data.partValueLabel})
          </StyledReferenceValuePartLabel>
        )}
        {value ? (
          <EntityDropzone
            onSelected={(newSelectedId: string) => {
              handleChangeValue(reference.id, newSelectedId);
            }}
            categoryTypes={[EntityEnums.Class.Value]}
            excludedEntityClasses={excludedSuggesterEntities}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
            excludedActantIds={[value.id]}
          >
            <EntityTag
              entity={value}
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
          !disabled && (
            <div>
              <EntitySuggester
                openDetailOnCreate={openDetailOnCreate}
                territoryActants={[]}
                onSelected={(newSelectedId: string) => {
                  handleChangeValue(reference.id, newSelectedId);
                }}
                categoryTypes={[EntityEnums.Class.Value]}
                excludedEntityClasses={excludedSuggesterEntities}
                isInsideTemplate={isInsideTemplate}
                territoryParentId={territoryParentId}
              />
            </div>
          )
        )}
      </StyledReferencesListColumn>

      <StyledReferencesListColumn>
        <StyledReferencesListButtons>
          {resource && value && resource.data.partValueBaseURL && (
            <Button
              key="url"
              tooltipLabel={""}
              inverted
              icon={<FaExternalLinkAlt />}
              color="plain"
              onClick={() => {
                const url = resource.data.partValueBaseURL.includes("http")
                  ? resource.data.partValueBaseURL + value.label
                  : "//" + resource.data.partValueBaseURL + value.label;
                window.open(url, "_blank");
              }}
            />
          )}
          {!disabled && (
            <Button
              key="delete"
              tooltipLabel="remove reference row"
              inverted
              icon={<FaTrashAlt />}
              color="plain"
              onClick={() => {
                handleRemove(reference.id);
              }}
            />
          )}
        </StyledReferencesListButtons>
      </StyledReferencesListColumn>
    </React.Fragment>
  );
};
