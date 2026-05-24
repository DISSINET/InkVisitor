import { IEntity } from "@inkvisitor/shared/types";
import { EntityTag } from "components/advanced";
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
