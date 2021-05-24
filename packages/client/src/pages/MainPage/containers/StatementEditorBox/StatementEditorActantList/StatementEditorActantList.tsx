import React, { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import update from "immutability-helper";

import {
  StyledActantList,
  StyledActantListItem,
  StyledListHeaderColumn,
} from "../StatementEditorBoxStyles";
import { IResponseStatement, IStatementActant } from "@shared/types";
import { StatementEditorActantListRow } from "../StatementEditorActantListRow/StatementEditorActantListRow";
import api from "api";

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
  const queryClient = useQueryClient();
  const [actants, setActants] = useState<IStatementActant[]>([]);

  useEffect(() => {
    setActants(statement?.data?.actants);
  }, [statement]);

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

  const updateActantsOrder = () => {
    updateApiCall({ actants: actants });
  };

  const updateApiCall = async (changes: object) => {
    const res = await api.actantsUpdate(statementId, {
      data: changes,
    });
    queryClient.invalidateQueries(["statement"]);
  };

  return (
    <StyledActantList>
      <StyledListHeaderColumn></StyledListHeaderColumn>
      <StyledListHeaderColumn>Actant</StyledListHeaderColumn>
      <StyledListHeaderColumn>Position</StyledListHeaderColumn>
      <StyledListHeaderColumn>Attributes</StyledListHeaderColumn>
      <StyledListHeaderColumn></StyledListHeaderColumn>
      {actants.map((sActant, sai) => {
        const actant = statement.actants.find((a) => a.id === sActant.actant);
        return (
          <React.Fragment key={sai}>
            {actant && (
              <StatementEditorActantListRow
                index={sai}
                actant={actant}
                sActant={sActant}
                statement={statement}
                statementId={statementId}
                classEntitiesActant={classEntitiesActant}
                moveFn={moveChildFn}
                updateOrderFn={updateActantsOrder}
              />
            )}
          </React.Fragment>
        );
      })}
    </StyledActantList>
  );
};
