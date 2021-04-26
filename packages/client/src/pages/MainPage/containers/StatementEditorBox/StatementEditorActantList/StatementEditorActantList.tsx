import React, { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import update from "immutability-helper";

import {
  StyledActantList,
  StyledActantListItem,
  StyledListHeaderColumn,
} from "../StatementEditorBoxStyles";
import { IResponseStatement, IStatementActant } from "@shared/types";
import { StatementEditorActantListItem } from "../StatementEditorActantListItem/StatementEditorActantListItem";

interface StatementEditorActantList {
  statement: IResponseStatement;
  statementId: string;
  classEntitiesActant: string[];
}
export const StatementEditorActantList: React.FC<StatementEditorActantList> = ({
  statement,
  statementId,
  classEntitiesActant,
}) => {
  const [actants, setActants] = useState<IStatementActant[]>([]);

  useEffect(() => {
    setActants(statement?.data?.actants);
  }, [statement?.data?.actants]);

  const moveChildFn = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = actants[dragIndex];
      setActants(
        update(actants, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragCard],
          ],
        })
      );
    },
    [actants]
  );

  return (
    <StyledActantList>
      <StyledListHeaderColumn></StyledListHeaderColumn>
      <StyledListHeaderColumn>Actant</StyledListHeaderColumn>
      <StyledListHeaderColumn>Position</StyledListHeaderColumn>
      <StyledListHeaderColumn>Attributes</StyledListHeaderColumn>
      <StyledListHeaderColumn>Actions</StyledListHeaderColumn>
      {actants.map((sActant, sai) => {
        const actant = statement.actants.find((a) => a.id === sActant.actant);
        return (
          <React.Fragment key={sai}>
            {actant && (
              <StatementEditorActantListItem
                index={sai}
                actant={actant}
                sActant={sActant}
                statement={statement}
                statementId={statementId}
                classEntitiesActant={classEntitiesActant}
                moveFn={moveChildFn}
              />
            )}
          </React.Fragment>
        );
      })}
    </StyledActantList>
  );
};
