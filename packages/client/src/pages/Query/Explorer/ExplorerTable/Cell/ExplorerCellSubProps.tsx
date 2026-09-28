import { IEntity, IResponseQuerySubProp } from "@inkvisitor/shared/types";
import { EntityTag } from "components/advanced";
import React from "react";
import { StyledSubProp, StyledSubPropGroup } from "./ExplorerCellSubPropsStyles";

interface ExplorerCellSubProps {
  subProps: IResponseQuerySubProp[];
  onEntityDoubleClick: (entity: IEntity) => (e: React.MouseEvent) => void;
}

/** Type and value tags of the subproperties nested under one property value. */
export const ExplorerCellSubProps: React.FC<ExplorerCellSubProps> = ({
  subProps,
  onEntityDoubleClick,
}) => (
  <StyledSubPropGroup data-no-row-click="true">
    {subProps.map((subProp, key) => (
      <StyledSubProp key={key}>
        {subProp.type && (
          <EntityTag entity={subProp.type} onDoubleClick={onEntityDoubleClick(subProp.type)} />
        )}
        {subProp.value && (
          <EntityTag entity={subProp.value} onDoubleClick={onEntityDoubleClick(subProp.value)} />
        )}
        {subProp.children.length > 0 && (
          <ExplorerCellSubProps
            subProps={subProp.children}
            onEntityDoubleClick={onEntityDoubleClick}
          />
        )}
      </StyledSubProp>
    ))}
  </StyledSubPropGroup>
);
