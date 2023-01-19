import { IEntity } from "@shared/types";
import { EntityTag } from "components/advanced";
import React from "react";
import { StyledTagWrap } from "../EntityDetailStyles";
import { StyledTableTextGridCell } from "./EntityDetailUsedInTableStyles";

export const renderEntityTag = (entity: IEntity) => {
  return (
    <StyledTableTextGridCell>
      <StyledTagWrap>
        <EntityTag fullWidth entity={entity} />
      </StyledTagWrap>
    </StyledTableTextGridCell>
  );
};
