import { IEntity, IProp } from "@shared/types";
import React from "react";
import { EntityTag } from "../../EntityTag/EntityTag";
import { StyledPropGroup, StyledPropRow } from "./StatementListTableStyles";

interface StatementListTablePropRow {
  level: 1 | 2 | 3;
  props: IProp[];
  entities: { [key: string]: IEntity };
  renderChildrenPropRow?: (props: IProp[]) => React.ReactElement;
}
export const StatementListTablePropRow: React.FC<StatementListTablePropRow> = ({
  level,
  props,
  entities,
  renderChildrenPropRow,
}) => {
  return (
    <StyledPropGroup>
      {props.map((prop, key) => {
        const propTypeEntity: IEntity = entities[prop.type.id];
        const propValueEntity: IEntity = entities[prop.value.id];
        return (
          <StyledPropRow key={key} level={level}>
            {propTypeEntity ? (
              <EntityTag
                actant={propTypeEntity}
                tooltipPosition="bottom center"
              />
            ) : (
              "type"
            )}
            {propValueEntity ? (
              <EntityTag
                actant={propValueEntity}
                tooltipPosition="bottom center"
              />
            ) : (
              "value"
            )}
            {renderChildrenPropRow && renderChildrenPropRow(prop.children)}
          </StyledPropRow>
        );
      })}
    </StyledPropGroup>
  );
};
