import { entitiesDictKeys } from "@shared/dictionaries";
import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IEntity,
  IReference,
  IResponseGeneric,
  IResponseStatement,
  IResponseTerritory,
  IResponseTree,
  IStatement,
  ITerritory,
} from "@shared/types";
import {
  UseMutationResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "api";
import { AxiosResponse } from "axios";
import { Button, ButtonGroup, Tooltip } from "components";
import Dropdown, {
  BreadcrumbItem,
  EntitySuggester,
  TerritoryActionModal,
} from "components/advanced";
import { CStatement } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { BiRefresh } from "react-icons/bi";
import { FaHighlighter, FaList, FaPlus } from "react-icons/fa";
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
import { StatementListDisplayMode } from "../StatementListBox";
import {
  StyledActionsWrapper,
  StyledCheckboxWrapper,
  StyledCounter,
  StyledDropdownWrap,
  StyledFaStar,
  StyledHeader,
  StyledHeaderBreadcrumbRow,
  StyledHeaderBreadcrumbRowLeft,
  StyledHeaderRow,
  StyledHeading,
  StyledModeSwitcher,
  StyledMoveToParent,
  StyledSuggesterRow,
} from "./StatementListHeaderStyles";
import { TbHomeMove } from "react-icons/tb";
import { rootTerritoryId } from "Theme/constants";

interface StatementListHeader {
  territory: IResponseTerritory;
  // addStatementAtTheEndMutation: UseMutationResult<
  //   void,
  //   unknown,
  //   IStatement,
  //   unknown
  // >;
  isFavorited?: boolean;

  displayMode: StatementListDisplayMode;
  handleDisplayModeChange: (newMode: StatementListDisplayMode) => void;

  isAllSelected: boolean;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;

  // Statements batch actions
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
  handleCreateStatement: () => void;
  updateTerritoryMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    {
      territoryId: string;
      changes: Partial<ITerritory>;
    },
    unknown
  >;
  duplicateTerritoryMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    {
      territoryId: string;
      targets: string[];
      withChildren: boolean;
    },
    unknown
  >;
}
export const StatementListHeader: React.FC<StatementListHeader> = ({
  territory,
  // addStatementAtTheEndMutation,

  isFavorited,
  isAllSelected,
  selectedRows,
  setSelectedRows,

  displayMode,
  handleDisplayModeChange,

  moveStatementsMutation,
  duplicateStatementsMutation,
  replaceReferencesMutation,
  appendReferencesMutation,
  handleCreateStatement,

  updateTerritoryMutation,
  duplicateTerritoryMutation,
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
      label: `replace a referenced Resource`,
      info: EntityEnums.Class.Resource,
    },
    {
      value: BatchOption.append_R,
      label: `append a referenced Resource`,
      info: EntityEnums.Class.Resource,
    },
  ];

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

  const treeData: IResponseTree | undefined = queryClient.getQueryData([
    "tree",
  ]);

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

  const handleSelectAll = (checked: boolean) =>
    checked
      ? setSelectedRows(territory.statements.map((statement) => statement.id))
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
  const [showTActionModal, setShowTActionModal] = useState(false);
  const [moveToParentEntity, setMoveToParentEntity] = useState<IEntity | false>(
    false
  );

  const userCanEdit = territory.right !== UserEnums.RoleMode.Read;

  const [headingHovered, setHeadingHovered] = useState(false);
  const [referenceElement, setReferenceElement] =
    useState<HTMLSpanElement | null>(null);

  return (
    <>
      <Tooltip
        label={territory.label}
        visible={headingHovered}
        referenceElement={referenceElement}
      />

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
            <BreadcrumbItem
              territoryId={territoryId}
              territoryData={territory}
            />
          </React.Fragment>
        </StyledHeaderBreadcrumbRow>

        <StyledHeaderRow>
          <span>
            {isFavorited && <StyledFaStar size={16} />}
            {territoryId ? (
              <StyledHeading
                ref={setReferenceElement}
                onMouseEnter={() => setHeadingHovered(true)}
                onMouseLeave={() => setHeadingHovered(false)}
              >{`T:\xa0${territory.label}`}</StyledHeading>
            ) : (
              <StyledHeading>{"no territory selected"}</StyledHeading>
            )}
          </span>

          {territory.id !== rootTerritoryId && userCanEdit && (
            <StyledMoveToParent>
              <EntitySuggester
                placeholder="new parent"
                disableTemplatesAccept
                filterEditorRights
                inputWidth={96}
                disableCreate
                categoryTypes={[EntityEnums.Class.Territory]}
                onPicked={(selectedEntity) => {
                  setMoveToParentEntity(selectedEntity);
                  setShowTActionModal(true);
                }}
                excludedActantIds={excludedMoveTerritories}
                button={
                  <Button
                    icon={<TbHomeMove size={14} />}
                    onClick={() => setShowTActionModal(true)}
                  />
                }
              />
            </StyledMoveToParent>
          )}
        </StyledHeaderRow>

        <StyledSuggesterRow>
          {/* BATCH ACTIONS */}
          <StyledActionsWrapper>
            {user?.role !== UserEnums.Role.Viewer &&
              displayMode === StatementListDisplayMode.LIST && (
                <>
                  <StyledCheckboxWrapper>
                    {renderCheckBox()}
                  </StyledCheckboxWrapper>

                  {selectedRows.length > 0 && (
                    <StyledCounter>{`${selectedRows.length}/${territory.statements.length}`}</StyledCounter>
                  )}

                  {
                    <>
                      <StyledDropdownWrap>
                        <Dropdown.Single.Basic
                          tooltipLabel={
                            batchAction.info === EntityEnums.Class.Resource
                              ? batchAction.label
                              : ""
                          }
                          width={98}
                          disabled={selectedRows.length === 0}
                          value={batchAction.value}
                          onChange={(selectedOption) =>
                            setBatchAction(
                              batchOptions.find(
                                (o) => o.value === selectedOption
                              )!
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
                          entitiesDictKeys[
                            batchAction.info as EntityEnums.Class
                          ].value,
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
                                {
                                  id: uuidv4(),
                                  resource: newSelectedId,
                                  value: "",
                                },
                              ]);
                              return;
                            case BatchOption.replace_R:
                              replaceReferencesMutation.mutate([
                                {
                                  id: uuidv4(),
                                  resource: newSelectedId,
                                  value: "",
                                },
                              ]);
                              return;
                          }
                        }}
                        excludedActantIds={[territory.id]}
                        disabled={selectedRows.length === 0}
                      />
                    </>
                  }
                </>
              )}
          </StyledActionsWrapper>

          {/* NEW STATEMENT / REFRESH */}
          {/* {territoryId && (
            <ButtonGroup>
              {userCanEdit && (
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
          )} */}
          <StyledModeSwitcher>
            {"Mode "}
            <ButtonGroup style={{ marginLeft: "5px" }}>
              <Button
                color="success"
                icon={<FaList />}
                label="list"
                onClick={() => {
                  handleDisplayModeChange(StatementListDisplayMode.LIST);
                }}
                inverted={displayMode === StatementListDisplayMode.TEXT}
              ></Button>
              <Button
                color="success"
                icon={<FaHighlighter />}
                label="annotator"
                onClick={() => {
                  handleDisplayModeChange(StatementListDisplayMode.TEXT);
                }}
                inverted={displayMode === StatementListDisplayMode.LIST}
              ></Button>
            </ButtonGroup>
          </StyledModeSwitcher>
        </StyledSuggesterRow>
      </StyledHeader>

      {showTActionModal && (
        <TerritoryActionModal
          onClose={() => setShowTActionModal(false)}
          selectedParentEntity={moveToParentEntity}
          setMoveToParentEntity={setMoveToParentEntity}
          showModal={showTActionModal}
          territory={territory}
          updateTerritoryMutation={updateTerritoryMutation}
          excludedMoveTerritories={excludedMoveTerritories}
          duplicateTerritoryMutation={duplicateTerritoryMutation}
        />
      )}
    </>
  );
};
