import { entitiesDictKeys } from "@shared/dictionaries";
import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IReference,
  IResponseGeneric,
  IResponseStatement,
  IResponseTerritory,
  IResponseTree,
  IStatement,
} from "@shared/types";
import {
  UseMutationResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "api";
import { AxiosResponse } from "axios";
import { Button, ButtonGroup } from "components";
import Dropdown, { BreadcrumbItem, EntitySuggester } from "components/advanced";
import { CStatement } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { BiRefresh } from "react-icons/bi";
import { FaPlus } from "react-icons/fa";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
  MdOutlineIndeterminateCheckBox,
} from "react-icons/md";
import { setLastClickedIndex } from "redux/features/statementList/lastClickedIndexSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { DropdownItem } from "types";
import { collectTerritoryChildren, searchTree } from "utils/utils";
import { v4 as uuidv4 } from "uuid";
import {
  StyledActionsWrapper,
  StyledCheckboxWrapper,
  StyledCounter,
  StyledDropdownWrap,
  StyledFaStar,
  StyledHeader,
  StyledHeaderBreadcrumbRow,
  StyledHeaderRow,
  StyledHeading,
  StyledMoveToParent,
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
  updateTerritoryMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      territoryId: string;
      statements: IResponseStatement[];
    },
    unknown
  >;
  isFavorited?: boolean;

  isAllSelected: boolean;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;

  moveStatementsMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      statements: string[];
      newTerritoryId: string;
    },
    unknown
  >;
  duplicateStatementsMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      statements: string[];
      newTerritoryId: string;
    },
    unknown
  >;
  replaceReferencesMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    IReference[],
    unknown
  >;
  appendReferencesMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    IReference[],
    unknown
  >;
}
export const StatementListHeader: React.FC<StatementListHeader> = ({
  data,
  addStatementAtTheEndMutation,
  moveTerritoryMutation,

  isFavorited,
  isAllSelected,
  selectedRows,
  setSelectedRows,

  moveStatementsMutation,
  duplicateStatementsMutation,
  replaceReferencesMutation,
  appendReferencesMutation,
}) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { territoryId, setTerritoryId } = useSearchParams();

  enum BatchOption {
    move_S = "move_S",
    duplicate_S = "duplicate_S",
    replace_R = "replace_R",
    append_R = "append_R",
  }
  const batchOptions = [
    {
      value: BatchOption.move_S,
      label: `move`,
      info: EntityEnums.Class.Territory,
    },
    {
      value: BatchOption.duplicate_S,
      label: `duplicate`,
      info: EntityEnums.Class.Territory,
    },
    {
      value: BatchOption.replace_R,
      label: `replace R`,
      info: EntityEnums.Class.Resource,
    },
    {
      value: BatchOption.append_R,
      label: `append R`,
      info: EntityEnums.Class.Resource,
    },
  ];

  const treeData: IResponseTree | undefined = queryClient.getQueryData([
    "tree",
  ]);

  // get user data
  const userId = localStorage.getItem("userid");
  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    enabled: !!userId && api.isLoggedIn(),
  });

  const [excludedMoveTerritories, setExcludedMoveTerritories] = useState<
    string[]
  >([territoryId]);

  useEffect(() => {
    setSelectedRows([]);
  }, [territoryId]);

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
    if (user) {
      const newStatement: IStatement = CStatement(
        localStorage.getItem("userrole") as UserEnums.Role,
        user.options,
        "",
        "",
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
    }
  };

  const trimTerritoryLabel = (label: string) => {
    const maxLettersCount = 70;
    if (label.length > maxLettersCount) {
      return `${label.slice(0, maxLettersCount)}...`;
    }
    return `${label}`;
  };

  const handleSelectAll = (checked: boolean) =>
    checked
      ? setSelectedRows(data.statements.map((statement) => statement.id))
      : setSelectedRows([]);

  const renderCheckBox = () => {
    const size = 18;

    if (isAllSelected) {
      return (
        <MdOutlineCheckBox
          size={size}
          onClick={() => {
            handleSelectAll(false);
            dispatch(setLastClickedIndex(-1));
          }}
        />
      );
    } else if (selectedRows.length > 0) {
      // some rows selected
      return (
        <MdOutlineIndeterminateCheckBox
          size={size}
          onClick={() => {
            handleSelectAll(false);
            dispatch(setLastClickedIndex(-1));
          }}
        />
      );
    } else {
      return (
        <MdOutlineCheckBoxOutlineBlank
          size={size}
          onClick={() => handleSelectAll(true)}
        />
      );
    }
  };

  const [batchAction, setBatchAction] = useState<DropdownItem>(batchOptions[0]);

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
        {isFavorited && <StyledFaStar size={18} />}
        <StyledHeading>
          {territoryId
            ? `T:\xa0${trimTerritoryLabel(data.label)}`
            : "no territory selected"}
        </StyledHeading>

        <StyledMoveToParent>
          {"Move to parent:\xa0"}
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
        </StyledMoveToParent>
      </StyledHeaderRow>

      <StyledSuggesterRow>
        <StyledActionsWrapper>
          <StyledCheckboxWrapper>{renderCheckBox()}</StyledCheckboxWrapper>

          {selectedRows.length > 0 && (
            <StyledCounter>{`${selectedRows.length}/${data.statements.length}`}</StyledCounter>
          )}

          {
            <>
              <StyledDropdownWrap>
                <Dropdown.Single.Basic
                  width={78}
                  disabled={selectedRows.length === 0}
                  value={batchAction.value}
                  onChange={(selectedOption) =>
                    setBatchAction(
                      batchOptions.find((o) => o.value === selectedOption)!
                    )
                  }
                  options={batchOptions}
                />
              </StyledDropdownWrap>
              <EntitySuggester
                placeholder={
                  batchAction.info === EntityEnums.Class.Territory
                    ? "to territory"
                    : ""
                }
                disableTemplatesAccept
                inputWidth={70}
                disableCreate
                filterEditorRights
                categoryTypes={[
                  entitiesDictKeys[batchAction.info as EntityEnums.Class].value,
                ]}
                onSelected={(newSelectedId: string) => {
                  switch (batchAction.value) {
                    case BatchOption.move_S:
                      moveStatementsMutation.mutate({
                        statements: selectedRows,
                        newTerritoryId: newSelectedId,
                      });
                      return;
                    case BatchOption.duplicate_S:
                      duplicateStatementsMutation.mutate({
                        statements: selectedRows,
                        newTerritoryId: newSelectedId,
                      });
                      return;
                    case BatchOption.append_R:
                      appendReferencesMutation.mutate([
                        { id: uuidv4(), resource: newSelectedId, value: "" },
                      ]);
                      return;
                    case BatchOption.replace_R:
                      replaceReferencesMutation.mutate([
                        { id: uuidv4(), resource: newSelectedId, value: "" },
                      ]);
                      return;
                  }
                }}
                excludedActantIds={[data.id]}
                disabled={selectedRows.length === 0}
              />
            </>
          }
        </StyledActionsWrapper>

        {territoryId && (
          <ButtonGroup>
            {data.right !== UserEnums.RoleMode.Read && (
              <Button
                key="add"
                icon={<FaPlus />}
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
              icon={<BiRefresh size={14} />}
              tooltipLabel="refresh data"
              inverted
              color="primary"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["territory"] });
                queryClient.invalidateQueries({ queryKey: ["statement"] });
                queryClient.invalidateQueries({ queryKey: ["user"] });
              }}
            />
          </ButtonGroup>
        )}
      </StyledSuggesterRow>
    </StyledHeader>
  );
};
