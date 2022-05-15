import { IEntity, IProp } from "@shared/types";
import { EmptyTag } from "pages/MainPage/containers";
import React from "react";
import { EntityTag } from "../../../EntityTag/EntityTag";
import {
  StyledPropGridRow,
  StyledPropGroup,
  StyledTagWrap,
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
            <StyledPropGridRow level={level}>
              {propTypeEntity ? (
                <StyledTagWrap marginRight>
                  <EntityTag
                    fullWidth
                    actant={propTypeEntity}
                    tooltipPosition="bottom center"
                  />
                </StyledTagWrap>
              ) : (
                <StyledTagWrap marginRight>
                  <EmptyTag label={"type"} />
                </StyledTagWrap>
              )}
              {propValueEntity ? (
                <StyledTagWrap>
                  <EntityTag
                    fullWidth
                    actant={propValueEntity}
                    tooltipPosition="bottom center"
                  />
                </StyledTagWrap>
              ) : (
                <StyledTagWrap>
                  <EmptyTag label={"value"} />
                </StyledTagWrap>
              )}
            </StyledPropGridRow>

            {renderChildrenPropRow && renderChildrenPropRow(prop.children)}
          </React.Fragment>
        );
      })}
    </StyledPropGroup>
  );
};
