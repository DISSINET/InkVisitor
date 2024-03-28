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
import { StyledGrid, StyledLabel } from "./EntityDetailProtocolStyles";

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
  entities: Record<string, IEntity>;
  updateEntityMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    any,
    unknown
  >;
}
export const EntityDetailProtocol: React.FC<EntityDetailProtocol> = ({
  territory,
  entities,
  updateEntityMutation,
}) => {
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

  // const [guidelinesResourceEntity, setGuidelinesResourceEntity] = useState<IEntity | false>(
  //   false
  // );
  // const [castemo, setCastemo] = useState(ECASTEMOVariant.SumCASTEMO);
  // const [startDate, setStartDate] = useState<IEntity | false>(false);
  // const [endDate, setEndDate] = useState<IEntity | false>(false);

  const updateProtocol = (changes: Partial<ITerritoryProtocol>) => {
    updateEntityMutation.mutate({ data: { protocol: changes } });
  };

  return (
    <StyledGrid>
      <StyledLabel>Project</StyledLabel>
      <Input
        value={project}
        onChangeFn={(text) => updateProtocol({ project: text })}
      />

      <StyledLabel>Guidelines version</StyledLabel>
      <Input
        value={guidelinesVersion}
        onChangeFn={(text) => updateProtocol({ guidelinesVersion: text })}
      />

      <StyledLabel>Guidelines resource</StyledLabel>
      {guidelinesResource.length > 0 && entities[guidelinesResource] ? (
        <EntityTag
          entity={entities[guidelinesResource]}
          unlinkButton={{
            onClick: () => updateProtocol({ guidelinesResource: "" }),
          }}
        />
      ) : (
        <EntitySuggester
          onPicked={(newPicked) => {
            updateProtocol({ guidelinesResource: newPicked.id });
          }}
          disableTemplatesAccept
          categoryTypes={[EntityEnums.Class.Resource]}
          territoryParentId={territory.data.parent.territoryId}
          // openDetailOnCreate
          // isInsideTemplate={isInsideTemplate}
        />
      )}

      <StyledLabel>Variant</StyledLabel>
      <Dropdown.Single.Basic
        onChange={(value) => updateProtocol({ variant: value })}
        value={variant}
        options={Object.keys(ECASTEMOVariant).map((key) => ({
          value: ECASTEMOVariant[key as keyof typeof ECASTEMOVariant],
          label: ECASTEMOVariant[key as keyof typeof ECASTEMOVariant],
        }))}
      />

      <StyledLabel>Description</StyledLabel>
      <Input
        value={description}
        onChangeFn={(text) => updateProtocol({ description: text })}
      />

      <StyledLabel>Start date</StyledLabel>
      {startDate.length > 0 && entities[startDate] ? (
        <EntityTag
          entity={entities[startDate]}
          unlinkButton={{ onClick: () => updateProtocol({ startDate: "" }) }}
        />
      ) : (
        <EntitySuggester
          onPicked={(newPicked) => {
            updateProtocol({ startDate: newPicked.id });
          }}
          categoryTypes={[EntityEnums.Class.Value]}
          territoryParentId={territory.data.parent.territoryId}
          disableTemplatesAccept
          // openDetailOnCreate
          // isInsideTemplate={isInsideTemplate}
        />
      )}

      <StyledLabel>End date</StyledLabel>
      {endDate.length > 0 && entities[endDate] ? (
        <EntityTag
          entity={entities[endDate]}
          unlinkButton={{ onClick: () => updateProtocol({ endDate: "" }) }}
        />
      ) : (
        <EntitySuggester
          onPicked={(newPicked) => {
            updateProtocol({ endDate: newPicked.id });
          }}
          categoryTypes={[EntityEnums.Class.Value]}
          territoryParentId={territory.data.parent.territoryId}
          disableTemplatesAccept
          // openDetailOnCreate
          // isInsideTemplate={isInsideTemplate}
        />
      )}
    </StyledGrid>
  );
};
