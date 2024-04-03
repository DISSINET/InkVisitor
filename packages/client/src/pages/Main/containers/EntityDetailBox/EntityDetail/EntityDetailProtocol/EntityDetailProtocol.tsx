import { EntityEnums } from "@shared/enums";
import { IEntity, IResponseDetail, IResponseGeneric } from "@shared/types";
import {
  ECASTEMOVariant,
  ITerritoryData,
  ITerritoryProtocol,
} from "@shared/types/territory";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { Input } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import React, { useEffect, useState } from "react";
import {
  StyledGrid,
  StyledLabel,
  StyledTagWrap,
} from "./EntityDetailProtocolStyles";

const initialProtocol: ITerritoryProtocol = {
  project: "",
  guidelinesVersion: "",
  guidelinesResource: "",
  variant: ECASTEMOVariant.SumCASTEMO,
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
}
export const EntityDetailProtocol: React.FC<EntityDetailProtocol> = ({
  territory,
  updateEntityMutation,
  isInsideTemplate,
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
  const {
    project,
    guidelinesVersion,
    guidelinesResource,
    variant,
    description,
    startDate,
    endDate,
  } = protocol;

  const updateProtocol = (changes: Partial<ITerritoryProtocol>) => {
    updateEntityMutation.mutate({ data: { protocol: changes } });
  };

  return (
    <StyledGrid>
      <StyledLabel>Project</StyledLabel>
      <Input
        width="full"
        value={project}
        onChangeFn={(text) => updateProtocol({ project: text })}
      />

      <StyledLabel>Guidelines version</StyledLabel>
      <Input
        width="full"
        value={guidelinesVersion}
        onChangeFn={(text) => updateProtocol({ guidelinesVersion: text })}
      />

      <StyledLabel>Guidelines resource</StyledLabel>
      {guidelinesResource.length > 0 ? (
        <StyledTagWrap>
          <EntityTag
            entity={entities[guidelinesResource]}
            unlinkButton={{
              onClick: () => updateProtocol({ guidelinesResource: "" }),
            }}
          />
        </StyledTagWrap>
      ) : (
        <EntitySuggester
          onPicked={(newPicked) => {
            updateProtocol({ guidelinesResource: newPicked.id });
          }}
          categoryTypes={[EntityEnums.Class.Resource]}
          territoryParentId={territory.data.parent.territoryId}
          isInsideTemplate={isInsideTemplate}
        />
      )}

      <StyledLabel>Variant</StyledLabel>
      <Dropdown.Single.Basic
        width="full"
        onChange={(value) => updateProtocol({ variant: value })}
        value={variant}
        options={Object.keys(ECASTEMOVariant).map((key) => ({
          value: ECASTEMOVariant[key as keyof typeof ECASTEMOVariant],
          label: ECASTEMOVariant[key as keyof typeof ECASTEMOVariant],
        }))}
      />

      <StyledLabel>Description</StyledLabel>
      <Input
        width="full"
        value={description}
        onChangeFn={(text) => updateProtocol({ description: text })}
      />

      <StyledLabel>Start date</StyledLabel>
      {startDate.length > 0 ? (
        <StyledTagWrap>
          <EntityTag
            entity={entities[startDate]}
            unlinkButton={{ onClick: () => updateProtocol({ startDate: "" }) }}
          />
        </StyledTagWrap>
      ) : (
        <EntitySuggester
          onPicked={(newPicked) => {
            updateProtocol({ startDate: newPicked.id });
          }}
          categoryTypes={[EntityEnums.Class.Value]}
          territoryParentId={territory.data.parent.territoryId}
          isInsideTemplate={isInsideTemplate}
        />
      )}

      <StyledLabel>End date</StyledLabel>
      {endDate.length > 0 ? (
        <StyledTagWrap>
          <EntityTag
            entity={entities[endDate]}
            unlinkButton={{ onClick: () => updateProtocol({ endDate: "" }) }}
          />
        </StyledTagWrap>
      ) : (
        <EntitySuggester
          onPicked={(newPicked) => {
            updateProtocol({ endDate: newPicked.id });
          }}
          categoryTypes={[EntityEnums.Class.Value]}
          territoryParentId={territory.data.parent.territoryId}
          isInsideTemplate={isInsideTemplate}
        />
      )}
    </StyledGrid>
  );
};
