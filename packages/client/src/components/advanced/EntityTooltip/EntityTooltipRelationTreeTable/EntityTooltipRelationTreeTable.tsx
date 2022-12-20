import { IEntity, Relation } from "@shared/types";
import React from "react";
import { getRelationTreeDepth, getShortLabelByLetterCount } from "utils";
import {
  StyledFlexColumn,
  StyledGridRowHalf,
  StyledGridRowThird,
  StyledRelationTypeTreeBlock,
  StyledTreeBlock,
} from "./EntityTooltipRelationTreeTableStyles";

interface EntityTooltipRelationTreeTable {
  relationTreeArray: Relation.IConnection<any>;
  entities: Record<string, IEntity>;
}
export const EntityTooltipRelationTreeTable: React.FC<
  EntityTooltipRelationTreeTable
> = ({ relationTreeArray, entities }) => {
  const treeDepth = getRelationTreeDepth(relationTreeArray) - 1;
  return (
    <StyledRelationTypeTreeBlock depth={treeDepth}>
      {relationTreeArray
        .slice(0, 2)
        .map((relation: Relation.IConnection<any>, key: number) => {
          const entity = entities[relation.entityIds[1]];
          return (
            <StyledGridRowThird key={key} onlyTwoLevels={treeDepth === 2}>
              {/* First level */}
              <StyledTreeBlock>
                {getShortLabelByLetterCount(entity?.label, 40)}
              </StyledTreeBlock>
              <StyledFlexColumn>
                {relation.subtrees.length > 0 ? (
                  relation.subtrees.map(
                    (subtree: Relation.IConnection<any>, key: number) => {
                      const entity = entities[subtree.entityIds[1]];
                      return (
                        <StyledGridRowHalf key={key}>
                          {/* Second level */}
                          <StyledTreeBlock>
                            {getShortLabelByLetterCount(entity?.label, 40)}
                          </StyledTreeBlock>
                          <StyledFlexColumn>
                            {subtree.subtrees.length > 0 ? (
                              subtree.subtrees.map(
                                (
                                  subtree: Relation.IConnection<any>,
                                  key: number
                                ) => {
                                  const entity = entities[subtree.entityIds[1]];
                                  /* third level */
                                  return (
                                    <StyledTreeBlock key={key}>
                                      {getShortLabelByLetterCount(
                                        entity?.label,
                                        40
                                      )}
                                    </StyledTreeBlock>
                                  );
                                }
                              )
                            ) : (
                              <StyledTreeBlock />
                            )}
                          </StyledFlexColumn>
                        </StyledGridRowHalf>
                      );
                    }
                  )
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
