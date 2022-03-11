import { IEntity, IProp } from "@shared/types";
import React from "react";
import { EntityTag } from "../../EntityTag/EntityTag";

interface StatementListTablePropRow {
  props: IProp[];
  entities: { [key: string]: IEntity };
  children: React.ReactElement;
}
export const StatementListTablePropRow: React.FC<StatementListTablePropRow> = ({
  props,
  entities,
  children,
}) => {
  return (
    <div>
      {props.map((prop, key) => {
        const propTypeEntity: IEntity = entities[prop.type.id];
        const propValueEntity: IEntity = entities[prop.value.id];
        return (
          <div>
            {propTypeEntity && (
              <EntityTag
                key={key}
                actant={propTypeEntity}
                tooltipPosition="bottom center"
              />
            )}
            {propValueEntity && (
              <EntityTag
                key={key}
                actant={propValueEntity}
                tooltipPosition="bottom center"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
