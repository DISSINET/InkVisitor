import { IEntity } from "@shared/types";
import { EntityTag } from "components/advanced";
import React from "react";
import { StyledCloud } from "./EntityCloudStyles";

interface EntityCloud {
  entities: IEntity[];
}
export const EntityCloud: React.FC<EntityCloud> = ({ entities }) => {
  return (
    <StyledCloud>
      {entities.map((entity, key) => {
        <EntityTag key={key} entity={entity} />;
      })}
    </StyledCloud>
  );
};
