import { EntityEnums } from "@shared/enums";
import { IResponseDetail, IResponseGeneric } from "@shared/types";
import { ITerritoryData, ITerritoryProtocol } from "@shared/types/territory";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { Input } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React, { useEffect } from "react";
import { StyledSuggesterWrapper } from "../EntityDetailRelations/EntityDetailRelationTypeBlock/EntityDetailRelationTypeBlockStyles";
import {
  StyledGrid,
  StyledLabel,
  StyledTagWrap,
  StyledValue,
} from "./EntityDetailProtocolStyles";
import { StyledFlexList } from "../EntityDetailValidationSection/EntityDetailValidationRule/EntityDetailValidationRuleStyles";

const initialProtocol: ITerritoryProtocol = {
  project: "",
  guidelinesResource: [],
  description: "",
  startDate: "",
  endDate: "",
};

interface EntityDetailProtocol {
  territory: IResponseDetail;
  updateEntityMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    any,
    unknown
  >;
  isInsideTemplate: boolean;
  userCanEdit: boolean;
}
export const EntityDetailProtocol: React.FC<EntityDetailProtocol> = ({
  territory,
  updateEntityMutation,
  isInsideTemplate,
  userCanEdit,
}) => {
  const { entities } = territory;
  const { protocol } = territory.data as ITerritoryData;

  useEffect(() => {
    // TODO: discover which attributes are missing and init them
    if (!protocol || (protocol && Object.entries(protocol).length === 0)) {
      updateEntityMutation.mutate({
        data: {
          protocol: initialProtocol,
        },
      });
    }
  }, []);

  // TODO: maybe move whole check and protocol init one component up?
  if (!protocol) {
    return;
  }
  const { project, guidelinesResource, description, startDate, endDate } =
    protocol;

  const updateProtocol = (changes: Partial<ITerritoryProtocol>) => {
    updateEntityMutation.mutate({ data: { protocol: changes } });
  };

  return (
    <StyledGrid>
      <StyledLabel>Project</StyledLabel>
      <StyledValue>
        <Input
          width="full"
          value={project}
          onChangeFn={(text) => updateProtocol({ project: text })}
          disabled={!userCanEdit}
        />
      </StyledValue>

      <StyledLabel>Guidelines resource</StyledLabel>
      <StyledValue>
        <StyledFlexList>
          {Array.isArray(guidelinesResource) &&
            guidelinesResource.map((gResourceId) => {
              return (
                <StyledTagWrap key={gResourceId}>
                  <EntityTag
                    flexListMargin
                    entity={entities[gResourceId]}
                    unlinkButton={
                      userCanEdit && {
                        onClick: () =>
                          updateProtocol({
                            guidelinesResource: guidelinesResource.filter(
                              (id) => id !== gResourceId
                            ),
                          }),
                      }
                    }
                  />
                </StyledTagWrap>
              );
            })}
          {userCanEdit && (
            <EntitySuggester
              alwaysShowCreateModal
              onPicked={(newPicked) => {
                updateProtocol({
                  guidelinesResource: [...guidelinesResource, newPicked.id],
                });
              }}
              excludedActantIds={guidelinesResource}
              categoryTypes={[EntityEnums.Class.Resource]}
              territoryParentId={territory.data.parent.territoryId}
              isInsideTemplate={isInsideTemplate}
              disabled={!userCanEdit}
            />
          )}
        </StyledFlexList>
      </StyledValue>

      <StyledLabel>Description</StyledLabel>
      <StyledValue>
        <Input
          width="full"
          value={description}
          onChangeFn={(text) => updateProtocol({ description: text })}
          disabled={!userCanEdit}
        />
      </StyledValue>

      <StyledLabel>Start date</StyledLabel>
      <StyledValue>
        {startDate.length > 0 ? (
          <StyledTagWrap>
            <EntityTag
              entity={entities[startDate]}
              unlinkButton={
                userCanEdit && {
                  onClick: () => updateProtocol({ startDate: "" }),
                }
              }
            />
          </StyledTagWrap>
        ) : (
          <EntitySuggester
            alwaysShowCreateModal
            onPicked={(newPicked) => {
              updateProtocol({ startDate: newPicked.id });
            }}
            categoryTypes={[EntityEnums.Class.Value]}
            territoryParentId={territory.data.parent.territoryId}
            isInsideTemplate={isInsideTemplate}
            disabled={!userCanEdit}
          />
        )}
      </StyledValue>

      <StyledLabel>End date</StyledLabel>
      <StyledValue>
        {endDate.length > 0 ? (
          <StyledTagWrap>
            <EntityTag
              entity={entities[endDate]}
              unlinkButton={
                userCanEdit && {
                  onClick: () => updateProtocol({ endDate: "" }),
                }
              }
            />
          </StyledTagWrap>
        ) : (
          <EntitySuggester
            alwaysShowCreateModal
            onPicked={(newPicked) => {
              updateProtocol({ endDate: newPicked.id });
            }}
            categoryTypes={[EntityEnums.Class.Value]}
            territoryParentId={territory.data.parent.territoryId}
            isInsideTemplate={isInsideTemplate}
            disabled={!userCanEdit}
          />
        )}
      </StyledValue>
    </StyledGrid>
  );
};
