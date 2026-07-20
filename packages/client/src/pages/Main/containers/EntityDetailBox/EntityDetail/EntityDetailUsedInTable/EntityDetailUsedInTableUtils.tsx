import { IEntity } from "@inkvisitor/shared/types";
import { EntityTag } from "components/advanced";
import { StyledTableTextGridCell } from "./EntityDetailUsedInTableStyles";

export const renderEntityTag = (entity: IEntity) => {
  return (
    <StyledTableTextGridCell>
      <EntityTag fullWidth entity={entity} />
    </StyledTableTextGridCell>
  );
};
