import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IResponseGeneric,
  IResponseTerritory,
  IResponseTree,
  IStatement,
} from "@shared/types";
import { AxiosResponse } from "axios";
import { Button, ButtonGroup } from "components";
import { BreadcrumbItem, EntitySuggester } from "components/advanced";
import { CStatement } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { FaPlus, FaRecycle } from "react-icons/fa";
import { UseMutationResult, useQueryClient } from "react-query";
import { useAppSelector } from "redux/hooks";
import theme from "Theme/theme";
import { collectTerritoryChildren, searchTree } from "utils";
import {
  StyledButtons,
  StyledFaStar,
  StyledHeader,
  StyledHeaderBreadcrumbRow,
  StyledHeaderRow,
  StyledHeading,
  StyledSuggesterRow,
} from "./StatementListHeaderStyles";

interface StatementListHeader {
  data: IResponseTerritory;
  addStatementAtTheEndMutation: UseMutationResult<
    void,
    unknown,
    IStatement,
    unknown
  >;
  moveTerritoryMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    string,
    unknown
  >;
  isFavorited?: boolean;
}
export const StatementListHeader: React.FC<StatementListHeader> = ({
  data,
  addStatementAtTheEndMutation,
  moveTerritoryMutation,
  isFavorited,
}) => {
  const queryClient = useQueryClient();
  const { territoryId } = useSearchParams();

  const treeData: IResponseTree | undefined = queryClient.getQueryData("tree");

  const [excludedMoveTerritories, setExcludedMoveTerritories] = useState<
    string[]
  >([territoryId]);

  useEffect(() => {
    const toExclude = [territoryId];
    if (treeData) {
      const currentTerritory = searchTree(treeData, territoryId);
      if (currentTerritory?.territory.data.parent) {
        toExclude.push(currentTerritory.territory.data.parent.territoryId);
      }
      if (currentTerritory) {
        const childArr = collectTerritoryChildren(currentTerritory);
        if (childArr.length) {
          setExcludedMoveTerritories([...toExclude, ...childArr]);
        } else {
          setExcludedMoveTerritories(toExclude);
        }
      }
    }
  }, [treeData, territoryId]);

  const selectedTerritoryPath = useAppSelector(
    (state) => state.territoryTree.selectedTerritoryPath
  );

  const handleCreateStatement = () => {
    const newStatement: IStatement = CStatement(
      localStorage.getItem("userrole") as UserEnums.Role,
      territoryId
    );
    const { statements } = data;

    const lastStatement = statements[statements.length - 1];
    if (!statements.length) {
      addStatementAtTheEndMutation.mutate(newStatement);
    } else if (
      newStatement?.data?.territory &&
      lastStatement?.data?.territory
    ) {
      newStatement.data.territory.order = statements.length
        ? lastStatement.data.territory.order + 1
        : 1;
      addStatementAtTheEndMutation.mutate(newStatement);
    }
  };

  const trimTerritoryLabel = (label: string) => {
    const maxLettersCount = 70;
    if (label.length > maxLettersCount) {
      return `${label.slice(0, maxLettersCount)}...`;
    }
    return `${label}`;
  };

  return (
    <StyledHeader>
      <StyledHeaderBreadcrumbRow>
        {selectedTerritoryPath &&
          selectedTerritoryPath.map((territoryId: string, key: number) => {
            return (
              <React.Fragment key={key}>
                <BreadcrumbItem territoryId={territoryId} />
              </React.Fragment>
            );
          })}
        <React.Fragment key="this-territory">
          <BreadcrumbItem territoryId={territoryId} territoryData={data} />
        </React.Fragment>
      </StyledHeaderBreadcrumbRow>
      <StyledHeaderRow>
        {isFavorited && (
          <StyledFaStar size={18} color={theme.color["warning"]} />
        )}
        <StyledHeading>
          {territoryId
            ? `T:\xa0${trimTerritoryLabel(data.label)}`
            : "no territory selected"}
        </StyledHeading>
        {territoryId && (
          <StyledButtons>
            <ButtonGroup marginBottom>
              {data.right !== UserEnums.RoleMode.Read && (
                <Button
                  key="add"
                  icon={<FaPlus size={14} />}
                  tooltipLabel="add new statement at the end of the list"
                  color="primary"
                  label="new statement"
                  onClick={() => {
                    handleCreateStatement();
                  }}
                />
              )}
              <Button
                key="refresh"
                icon={<FaRecycle size={14} />}
                tooltipLabel="refresh data"
                inverted
                color="primary"
                label="refresh"
                onClick={() => {
                  queryClient.invalidateQueries(["territory"]);
                  queryClient.invalidateQueries(["statement"]);
                }}
              />
            </ButtonGroup>
          </StyledButtons>
        )}
      </StyledHeaderRow>

      <StyledSuggesterRow>
        {"Move to parent:\xa0"}
        <div>
          <EntitySuggester
            disableTemplatesAccept
            filterEditorRights
            inputWidth={96}
            disableCreate
            categoryTypes={[EntityEnums.Class.Territory]}
            onSelected={(newSelectedId: string) => {
              moveTerritoryMutation.mutate(newSelectedId);
            }}
            excludedActantIds={excludedMoveTerritories}
          />
        </div>
      </StyledSuggesterRow>
    </StyledHeader>
  );
};
