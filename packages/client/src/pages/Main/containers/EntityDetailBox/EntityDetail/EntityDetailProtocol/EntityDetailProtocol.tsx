import { EntityEnums } from "@shared/enums";
import { IEntity, IResponseDetail } from "@shared/types";
import { ECASTEMOVariant } from "@shared/types/territory";
import { Input } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import React, { useState } from "react";
import { StyledLabel } from "./EntityDetailProtocolStyles";

interface EntityDetailProtocol {
  territory: IResponseDetail;
}
export const EntityDetailProtocol: React.FC<EntityDetailProtocol> = ({
  territory,
}) => {
  const [guidelineResource, setGuidelineResource] = useState<IEntity | false>(
    false
  );
  const [castemo, setCastemo] = useState(ECASTEMOVariant.SumCASTEMO);
  const [startDate, setStartDate] = useState<IEntity | false>(false);
  const [endDate, setEndDate] = useState<IEntity | false>(false);
  return (
    <>
      <StyledLabel>project</StyledLabel>
      <Input onChangeFn={(text) => console.log(text)} />

      <StyledLabel>guidelinesVersion</StyledLabel>
      <Input onChangeFn={(text) => console.log(text)} />

      <StyledLabel>guidelinesResource</StyledLabel>
      {guidelineResource ? (
        <EntityTag
          entity={guidelineResource}
          unlinkButton={{ onClick: () => setGuidelineResource(false) }}
        />
      ) : (
        <EntitySuggester
          onPicked={(newPicked) => {
            setGuidelineResource(newPicked);
          }}
          disableTemplatesAccept
          categoryTypes={[EntityEnums.Class.Resource]}
          territoryParentId={territory.data.parent.territoryId}
          // openDetailOnCreate
          // isInsideTemplate={isInsideTemplate}
        />
      )}

      <StyledLabel>variant</StyledLabel>
      <Dropdown.Single.Basic
        onChange={(value) => setCastemo(value)}
        value={castemo}
        options={Object.keys(ECASTEMOVariant).map((key) => ({
          value: ECASTEMOVariant[key as keyof typeof ECASTEMOVariant],
          label: ECASTEMOVariant[key as keyof typeof ECASTEMOVariant],
        }))}
      />

      <StyledLabel>description</StyledLabel>
      <Input onChangeFn={(text) => console.log(text)} />

      <StyledLabel>startDate</StyledLabel>
      {startDate ? (
        <EntityTag
          entity={startDate}
          unlinkButton={{ onClick: () => setStartDate(false) }}
        />
      ) : (
        <EntitySuggester
          onPicked={(newPicked) => {
            setStartDate(newPicked);
          }}
          categoryTypes={[EntityEnums.Class.Value]}
          territoryParentId={territory.data.parent.territoryId}
          disableTemplatesAccept
          // openDetailOnCreate
          // isInsideTemplate={isInsideTemplate}
        />
      )}

      <StyledLabel>endDate</StyledLabel>
      {endDate ? (
        <EntityTag
          entity={endDate}
          unlinkButton={{ onClick: () => setEndDate(false) }}
        />
      ) : (
        <EntitySuggester
          onPicked={(newPicked) => {
            setEndDate(newPicked);
          }}
          categoryTypes={[EntityEnums.Class.Value]}
          territoryParentId={territory.data.parent.territoryId}
          disableTemplatesAccept
          // openDetailOnCreate
          // isInsideTemplate={isInsideTemplate}
        />
      )}
    </>
  );
};
