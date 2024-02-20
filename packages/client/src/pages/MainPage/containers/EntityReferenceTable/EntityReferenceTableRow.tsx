import { EntityEnums } from "@shared/enums";
import { IEntity, IReference, IResponseDocument } from "@shared/types";
import { excludedSuggesterEntities } from "Theme/constants";
import { Button } from "components";
import {
  EntityDropzone,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React from "react";
import { FaExternalLinkAlt, FaTrashAlt } from "react-icons/fa";
import {
  GrDocument,
  GrDocumentMissing,
  GrDocumentVerified,
} from "react-icons/gr";
import {
  StyledReferenceValuePartLabel,
  StyledReferencesListButtons,
  StyledReferencesListColumn,
} from "./EntityReferenceTableStyles";
import { normalizeURL } from "utils";

interface EntityReferenceTableRow {
  reference: IReference;
  resource: IEntity | undefined;
  value: IEntity | undefined;
  disabled?: boolean;
  handleRemove: (refId: string, instantUpdate?: boolean) => void;
  handleChangeResource: (
    refId: string,
    newResource: string,
    instantUpdate?: boolean
  ) => void;
  handleChangeValue: (
    refId: string,
    newValue: string,
    instantUpdate?: boolean
  ) => void;
  openDetailOnCreate?: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  document: IResponseDocument | undefined;
  entityId: string;
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
  document = undefined,
  entityId,
}) => {
  return (
    <React.Fragment>
      {/* resource */}
      <StyledReferencesListColumn>
        {resource ? (
          <EntityDropzone
            onSelected={(newSelectedId: string) => {
              handleChangeResource(reference.id, newSelectedId, true);
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
                  handleChangeResource(reference.id, newSelectedId, true);
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
              handleChangeValue(reference.id, newSelectedId, true);
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
                  handleChangeValue(reference.id, newSelectedId, true);
                }}
                categoryTypes={[EntityEnums.Class.Value]}
                isInsideTemplate={isInsideTemplate}
                territoryParentId={territoryParentId}
              />
            </div>
          )
        )}
      </StyledReferencesListColumn>

      {/* text reference */}
      <StyledReferencesListColumn>
        {resource ? (
          resource.data.documentId ? (
            document?.referencedEntityIds.includes(entityId) ? (
              <Button
                tooltipLabel="with entity"
                icon={<GrDocumentVerified />}
                inverted
                color="primary"
                noBorder
              />
            ) : (
              <Button
                tooltipLabel="no reference in document found"
                icon={<GrDocument />}
                inverted
                color="plain"
                noBorder
              />
            )
          ) : (
            <Button
              icon={<GrDocumentMissing />}
              tooltipLabel="no document assigned for this resource"
              color="danger"
              noBorder
              inverted
            />
          )
        ) : (
          <></>
        )}
      </StyledReferencesListColumn>

      <StyledReferencesListColumn>
        <StyledReferencesListButtons>
          {resource && value && resource.data.partValueBaseURL && (
            <Button
              key="url"
              tooltipLabel="external link"
              inverted
              icon={<FaExternalLinkAlt />}
              color="plain"
              // TODO: doplnit lomitko na konci!!!
              onClick={() => {
                const url = resource.data.partValueBaseURL.includes("http")
                  ? normalizeURL(resource.data.partValueBaseURL) + value.label
                  : "//" +
                    normalizeURL(resource.data.partValueBaseURL) +
                    value.label;
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
