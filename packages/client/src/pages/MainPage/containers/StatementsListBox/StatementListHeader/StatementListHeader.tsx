import React from "react";
import { UseMutationResult, useQueryClient } from "react-query";
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
import { useAppSelector } from "redux/hooks";
import { useSearchParams } from "hooks";

interface StatementListHeader {
  data: {
    statements: IStatement[];
    actants: IActant[];
    label: string;
  };
  addStatementAtTheEndMutation: UseMutationResult<
    void,
    unknown,
    IStatement,
    unknown
  >;
}
export const StatementListHeader: React.FC<StatementListHeader> = ({
  data,
  addStatementAtTheEndMutation,
}) => {
  const queryClient = useQueryClient();
  const { territoryId } = useSearchParams();

  const selectedTerritoryPath = useAppSelector(
    (state) => state.territoryTree.selectedTerritoryPath
  );

  const handleCreateStatement = () => {
    const newStatement: IStatement = CStatement(territoryId);
    const { statements } = data;
    newStatement.data.territory.order = statements.length
      ? statements[statements.length - 1].data.territory.order + 1
      : 1;
    addStatementAtTheEndMutation.mutate(newStatement);
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
                handleCreateStatement();
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
