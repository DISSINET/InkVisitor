import { EntityTooltip, IEntity, Relation } from "@shared/types";
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
  // relationTreeArray: EntityTooltip.ISuperclassTree[];
  relationTreeArray: Relation.IConnection<any>[];
  entities: Record<string, IEntity>;
}
export const EntityTooltipRelationTreeTable: React.FC<
  EntityTooltipRelationTreeTable
> = ({ relationTreeArray, entities }) => {
  const treeDepth = getRelationTreeDepth(relationTreeArray) - 1;
  return (
    <StyledRelationTypeTreeBlock depth={treeDepth}>
      {relationTreeArray.map(
        (relation: Relation.IConnection<any>, key: number) => {
          const entity = entities[relation.entityIds[1]];
          return (
            <StyledGridRowThird key={key} onlyTwoLevels={treeDepth === 2}>
              {/* First level */}
              <StyledTreeBlock>{entity?.label}</StyledTreeBlock>
              <StyledFlexColumn>
                {relation.subtrees.length > 0 ? (
                  relation.subtrees.map(
                    (subtree: Relation.IConnection<any>, key: number) => {
                      const entity = entities[subtree.entityIds[1]];
                      return (
                        <StyledGridRowHalf key={key}>
                          {/* Second level */}
                          <StyledTreeBlock>{entity?.label}</StyledTreeBlock>
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
                                      {entity?.label}
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
        }
      )}
    </StyledRelationTypeTreeBlock>
  );
};
