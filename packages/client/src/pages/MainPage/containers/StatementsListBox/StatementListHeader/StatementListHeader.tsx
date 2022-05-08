import { EntityClass, UserRole, UserRoleMode } from "@shared/enums";
import {
  IResponseGeneric,
  IResponseTerritory,
  IStatement,
} from "@shared/types";
import api from "api";
import { AxiosResponse } from "axios";
import { Button, ButtonGroup } from "components";
import { CStatement } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { FaPlus, FaRecycle } from "react-icons/fa";
import { UseMutationResult, useQuery, useQueryClient } from "react-query";
import { useAppSelector } from "redux/hooks";
import theme from "Theme/theme";
import { collectTerritoryChildren, searchTree } from "utils";
import { EntitySuggester } from "../..";
import { StatementListBreadcrumbItem } from "./StatementListBreadcrumbItem/StatementListBreadcrumbItem";
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

  const {
    status,
    data: treeData,
    error,
    isFetching,
  } = useQuery(
    ["tree"],
    async () => {
      const res = await api.treeGet();
      return res.data;
    },
    { enabled: api.isLoggedIn() }
  );

  const [excludedMoveTerritories, setExcludedMoveTerritories] = useState<
    string[]
  >([territoryId]);

  useEffect(() => {
    //const toExclude = [territoryId];
    const toExclude = [territoryId];
    if (treeData) {
      const currentTerritory = searchTree(treeData, territoryId);
      if (currentTerritory?.territory.data.parent) {
        toExclude.push(currentTerritory.territory.data.parent.id);
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
      localStorage.getItem("userrole") as UserRole,
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
          selectedTerritoryPath.map((territory: string, key: number) => {
            return (
              <React.Fragment key={key}>
                <StatementListBreadcrumbItem territoryId={territory} />
              </React.Fragment>
            );
          })}
        <React.Fragment key="this-territory">
          <StatementListBreadcrumbItem territoryId={territoryId} />
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
              {data.right !== UserRoleMode.Read && (
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
              )}
              <Button
                key="refresh"
                icon={<FaRecycle size={14} />}
                tooltip="refresh data"
                inverted
                color="primary"
                label="refresh"
                onClick={() => {
                  queryClient.invalidateQueries(["territory"]);
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
            filterEditorRights
            inputWidth={96}
            allowCreate={false}
            categoryTypes={[EntityClass.Territory]}
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
