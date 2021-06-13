import React from "react";
import { useQuery, useQueryClient } from "react-query";
import { useHistory, useLocation } from "react-router-dom";
const queryString = require("query-string");
import { FaPlus, FaRecycle } from "react-icons/fa";

import {
  StyledButtonGroup,
  StyledHeader,
  StyledHeaderBreadcrumbRow,
  StyledTitle,
} from "./StatementListHeaderStyles";
import { StyledHeaderRow } from "./StatementListHeaderStyles";
import { StatementListBreadcrumbItem } from "./StatementListBreadcrumbItem/StatementListBreadcrumbItem";
import { IActant, IStatement } from "@shared/types";
import { CStatement } from "constructors";
import { Button, ButtonGroup } from "components";
import api from "api";
import { useAppSelector } from "redux/hooks";

interface StatementListHeader {
  data: {
    statements: IStatement[];
    actants: IActant[];
    label: string;
  };
}
export const StatementListHeader: React.FC<StatementListHeader> = ({
  data,
}) => {
  const queryClient = useQueryClient();
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;
  const statementId = hashParams.statement;

  const selectedTerritoryPath = useAppSelector(
    (state) => state.territoryTree.selectedTerritoryPath
  );

  const addStatementAtTheEnd = async () => {
    const newStatement: IStatement = CStatement(territoryId);
    const { statements } = data;
    newStatement.data.territory.order = statements.length
      ? statements[statements.length - 1].data.territory.order + 1
      : 1;
    const res = await api.actantsCreate(newStatement);
    hashParams["statement"] = newStatement.id;
    history.push({
      hash: queryString.stringify(hashParams),
    });
    queryClient.invalidateQueries(["territory", "statement-list", territoryId]);
    queryClient.invalidateQueries("tree");
  };

  return (
    <StyledHeader>
      <StyledHeaderBreadcrumbRow>
        <StyledButtonGroup noMargin>
          {selectedTerritoryPath &&
            selectedTerritoryPath.map((territory: string, key: number) => {
              return (
                <React.Fragment key={key}>
                  <StatementListBreadcrumbItem territoryId={territory} />
                </React.Fragment>
              );
            })}
        </StyledButtonGroup>
      </StyledHeaderBreadcrumbRow>
      <StyledHeaderRow>
        <StyledTitle>
          {territoryId ? `T: ${data.label}` : "no territory selected"}
        </StyledTitle>
        {territoryId && (
          <ButtonGroup>
            <Button
              key="add"
              icon={<FaPlus size={14} />}
              tooltip="add new statement at the end of the list"
              color="primary"
              label="new statement"
              onClick={() => {
                addStatementAtTheEnd();
              }}
            />
            <Button
              key="refresh"
              icon={<FaRecycle size={14} />}
              tooltip="refresh data"
              color="info"
              label="refresh"
              onClick={() => {
                queryClient.invalidateQueries(["territory"]);
              }}
            />
          </ButtonGroup>
        )}
      </StyledHeaderRow>
    </StyledHeader>
  );
};
