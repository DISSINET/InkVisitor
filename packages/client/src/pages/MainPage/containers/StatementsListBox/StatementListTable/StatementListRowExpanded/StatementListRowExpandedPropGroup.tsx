import { IEntity, IProp } from "@shared/types";
import { EmptyTag } from "pages/MainPage/containers";
import React from "react";
import { EntityTag } from "../../../EntityTag/EntityTag";
import {
  StyledPropGroupCell,
  StyledPropGroup,
  StyledPropRow,
} from "./StatementListRowExpandedStyles";

interface StatementListRowExpandedPropGroup {
  level: 1 | 2 | 3;
  props: IProp[];
  entities: { [key: string]: IEntity };
  renderChildrenPropRow?: (props: IProp[]) => React.ReactElement;
}
export const StatementListRowExpandedPropGroup: React.FC<
  StatementListRowExpandedPropGroup
> = ({ level, props, entities, renderChildrenPropRow }) => {
  return (
    <StyledPropGroup>
      {props.map((prop, key) => {
        const propTypeEntity: IEntity = entities[prop.type.id];
        const propValueEntity: IEntity = entities[prop.value.id];
        return (
          <React.Fragment key={key}>
            <StyledPropRow level={level}>
              {propTypeEntity ? (
                <>
                  <EntityTag
                    // fullWidth
                    actant={propTypeEntity}
                    tooltipPosition="bottom center"
                  />
                  <span>&nbsp;</span>
                </>
              ) : (
                <>
                  <EmptyTag label={"type"} />
                  <span>&nbsp;</span>
                </>
              )}
              {propValueEntity ? (
                <>
                  <EntityTag
                    // fullWidth
                    actant={propValueEntity}
                    tooltipPosition="bottom center"
                  />
                </>
              ) : (
                <>
                  <EmptyTag label={"value"} />
                </>
              )}
            </StyledPropRow>

            <div key={`children-${key}`}>
              {renderChildrenPropRow && renderChildrenPropRow(prop.children)}
            </div>
          </React.Fragment>
        );
      })}
    </StyledPropGroup>
  );
};
