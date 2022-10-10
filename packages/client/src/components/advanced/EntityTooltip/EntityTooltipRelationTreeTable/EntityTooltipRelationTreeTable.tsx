import { EntityTooltip, IEntity } from "@shared/types";
import React from "react";
import { getRelationTreeDepth } from "utils";
import {
  StyledRelationTypeTreeBlock,
  StyledGridRowThird,
  StyledTreeBlock,
  StyledFlexColumn,
  StyledGridRowHalf,
} from "./EntityTooltipRelationTreeTableStyles";

interface EntityTooltipRelationTreeTable {
  relationTreeArray: EntityTooltip.ISuperclassTree[];
  entities: Record<string, IEntity>;
}
export const EntityTooltipRelationTreeTable: React.FC<
  EntityTooltipRelationTreeTable
> = ({ relationTreeArray, entities }) => {
  return (
    <StyledRelationTypeTreeBlock
      depth={getRelationTreeDepth(relationTreeArray) - 1}
    >
      {relationTreeArray.map((superclass, key) => {
        const entity = entities[superclass.entityId];
        return (
          <StyledGridRowThird key={key}>
            {/* First level */}
            <StyledTreeBlock>{entity.label}</StyledTreeBlock>
            <StyledFlexColumn>
              {superclass.subtrees.length > 0 ? (
                superclass.subtrees.map((subtree, key) => {
                  const entity = entities[subtree.entityId];
                  return (
                    <StyledGridRowHalf key={key}>
                      {/* Second level */}
                      <StyledTreeBlock>{entity.label}</StyledTreeBlock>
                      <StyledFlexColumn>
                        {subtree.subtrees.length > 0 ? (
                          subtree.subtrees.map((subtree, key) => {
                            const entity = entities[subtree.entityId];
                            /* third level */
                            return (
                              <StyledTreeBlock key={key}>
                                {entity.label}
                              </StyledTreeBlock>
                            );
                          })
                        ) : (
                          <StyledTreeBlock />
                        )}
                      </StyledFlexColumn>
                    </StyledGridRowHalf>
                  );
                })
              ) : (
                <StyledTreeBlock />
              )}
            </StyledFlexColumn>
          </StyledGridRowThird>
        );
      })}
    </StyledRelationTypeTreeBlock>
  );
};
