import { entitiesDictKeys } from "@shared/dictionaries";
import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IResponseGeneric,
  IResponseStatement,
  IResponseTerritory,
  IResponseTree,
  IStatement,
} from "@shared/types";
import { DropdownItem } from "types";
import api from "api";
import { AxiosResponse } from "axios";
import { Button, ButtonGroup, Dropdown } from "components";
import { BreadcrumbItem, EntitySuggester } from "components/advanced";
import { CStatement } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { FaPlus, FaRecycle } from "react-icons/fa";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
  MdOutlineIndeterminateCheckBox,
} from "react-icons/md";
import { UseMutationResult, useQuery, useQueryClient } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { setLastClickedIndex } from "redux/features/statementList/lastClickedIndexSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import theme from "Theme/theme";
import { collectTerritoryChildren, searchTree } from "utils";
import {
  StyledActionsWrapper,
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
}) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { territoryId, setTerritoryId } = useSearchParams();

  const batchOptions = [
    { value: `move S`, label: `move ${selectedRows.length} S`, info: "T" },
    {
      value: `duplicate S`,
      label: `duplicate ${selectedRows.length} S`,
      info: "T",
    },
    {
      value: `replace R`,
      label: `replace R for ${selectedRows.length} S`,
      info: "R",
    },
    {
      value: `append R`,
      label: `append R for ${selectedRows.length} S`,
      info: "R",
    },
  ];

  const treeData: IResponseTree | undefined = queryClient.getQueryData("tree");

  // get user data
  const userId = localStorage.getItem("userid");
  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
  } = useQuery(
    ["user", userId],
    async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      } else {
        return false;
      }
    },
    { enabled: !!userId && api.isLoggedIn() }
  );

  const [excludedMoveTerritories, setExcludedMoveTerritories] = useState<
    string[]
  >([territoryId]);

  const [duplicateSelection, setDuplicateSelection] = useState(false);

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
    const color = theme.color.black;
    if (isAllSelected) {
      return (
        <MdOutlineCheckBox
          size={size}
          color={color}
          style={{ cursor: "pointer" }}
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
          color={color}
          style={{ cursor: "pointer" }}
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
          color={color}
          style={{ cursor: "pointer" }}
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
        {isFavorited && (
          <StyledFaStar size={18} color={theme.color["warning"]} />
        )}
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
          {renderCheckBox()}

          {
            <>
              {/* <AttributeButtonGroup
                options={[
                  {
                    longValue: `move ${selectedRows.length} S`,
                    shortValue: "",
                    onClick: () => setDuplicateSelection(false),
                    selected: !duplicateSelection,
                    shortIcon: <ImBoxRemove />,
                  },
                  {
                    longValue: `duplicate ${selectedRows.length} S`,
                    shortValue: "",
                    onClick: () => setDuplicateSelection(true),
                    selected: duplicateSelection,
                    shortIcon: <FaClone />,
                  },
                ]}
                disabled={selectedRows.length === 0}
              /> */}
              <Dropdown
                width={100}
                disabled={selectedRows.length === 0}
                value={batchAction}
                onChange={(selectedOption: ValueType<OptionTypeBase, any>) =>
                  setBatchAction(selectedOption as DropdownItem)
                }
                options={batchOptions}
              />
              <EntitySuggester
                placeholder={
                  batchAction.info === "T" ? "to territory" : "choose R"
                }
                disableTemplatesAccept
                filterEditorRights
                disableCreate
                categoryTypes={[
                  entitiesDictKeys[batchAction.info as EntityEnums.Class].value,
                ]}
                onSelected={(newSelectedId: string) => {
                  if (duplicateSelection) {
                    duplicateStatementsMutation.mutate({
                      statements: selectedRows,
                      newTerritoryId: newSelectedId,
                    });
                  } else {
                    moveStatementsMutation.mutate({
                      statements: selectedRows,
                      newTerritoryId: newSelectedId,
                    });
                  }
                }}
                excludedActantIds={[data.id]}
                disabled={selectedRows.length === 0}
              />
            </>
          }
        </StyledActionsWrapper>

        {territoryId && (
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
        )}
      </StyledSuggesterRow>
    </StyledHeader>
  );
};
