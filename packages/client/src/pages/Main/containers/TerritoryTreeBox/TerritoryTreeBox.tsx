import { EntityEnums, UserEnums } from "@shared/enums";
import { IResponseTree, IUser } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, CustomScrollbar, Loader } from "components";
import { EntityCreateModal } from "components/advanced";
import { useDebounce, useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { BsFilter } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { useSelector } from "react-redux";
import { selectPanelWidth } from "redux/features/layout/mainPage/panelWidthsSlice";
import { setFilterOpen } from "redux/features/territoryTree/filterOpenSlice";
import { setSelectedTerritoryPath } from "redux/features/territoryTree/selectedTerritoryPathSlice";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { ITerritoryFilter } from "types";
import { searchTree } from "utils/utils";
import { StyledNoResults, StyledTreeWrapper } from "./TerritoryTreeBoxStyles";
import { TerritoryTreeFilter } from "./TerritoryTreeFilter/TerritoryTreeFilter";
import {
  filterTreeByFavorites,
  filterTreeByLabel,
  filterTreeWithStatements,
  filterTreeWithSubterritories,
  filterTreeWithWriteRights,
  markNodesWithFilters,
} from "./TerritoryTreeFilterUtils";
import { MemoizedTerritoryTreeNode } from "./TerritoryTreeNode/TerritoryTreeNode";
import { useTreeData } from "hooks/react-query/useTreeData";

const initFilterSettings: ITerritoryFilter = {
  starred: false,
  editorRights: false,
  withSubterritories: false,
  withStatements: false,
  filter: "",
  operator: "or",
};
export const TerritoryTreeBox: React.FC = () => {
  const firstPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.mainPage.firstPanelExpanded
  );

  const queryClient = useQueryClient();

  const { data: treeData, isFetching } = useTreeData();
  const userId = localStorage.getItem("userid");

  const {
    status: userStatus,
    data: userData,
    error: userError,
    isFetching: userIsFetching,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await api.usersGet(userId as string);
      return res.data ?? undefined;
    },
    enabled: api.isLoggedIn() && !!userId,
  });

  const storedTerritoryIds = useMemo(
    () =>
      userData?.storedTerritories?.map((territory) => territory.territory.id) ??
      [],
    [userData]
  );

  const updateUserMutation = useMutation({
    mutationFn: async (changes: Partial<IUser>) => {
      if (userId) {
        await api.usersUpdate(userId, changes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["user", userId] });
      }
    },
  });

  const userRole = localStorage.getItem("userrole");
  const { territoryId } = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);

  const dispatch = useAppDispatch();
  const selectedTerritoryPath = useAppSelector(
    (state) => state.territoryTree.selectedTerritoryPath
  );

  const [filterSettings, setFilterSettings] =
    useState<ITerritoryFilter>(initFilterSettings);
  const [filteredTreeData, setFilteredTreeData] =
    useState<IResponseTree | null>();

  useEffect(() => {
    if (treeData) {
      if (
        JSON.stringify(filterSettings) === JSON.stringify(initFilterSettings)
      ) {
        setFilteredTreeData(treeData);
      } else {
        // use filter - fn that returns new object with filtered tree and set to state
        setFilteredTreeData(getFilteredTreeData());
      }
    }
  }, [treeData, filterSettings, userData]);

  const handleFilterChange = (
    key: keyof ITerritoryFilter,
    value: boolean | string
  ) => setFilterSettings({ ...filterSettings, [key]: value });

  const getFilteredTreeData = () => {
    if (treeData) {
      let newFilteredTreeData: IResponseTree | null = treeData;

      // Check if any filters are active
      const hasActiveFilters =
        filterSettings.starred ||
        filterSettings.editorRights ||
        filterSettings.withStatements ||
        filterSettings.withSubterritories ||
        filterSettings.filter.length > 0;

      if (!hasActiveFilters) {
        // No filters active, return tree without highlighting
        return newFilteredTreeData;
      }

      if (filterSettings.operator === "or") {
        // OR logic: apply each filter independently and merge results
        const filteredResults: (IResponseTree | null)[] = [];

        if (filterSettings.starred && userData) {
          const starredTreeData = filterTreeByFavorites(
            treeData,
            userData.storedTerritories.map((t) => t.territory.id)
          );
          if (starredTreeData) filteredResults.push(starredTreeData);
        }

        if (filterSettings.editorRights) {
          const editorRightsTreeData = filterTreeWithWriteRights(treeData);
          if (editorRightsTreeData) filteredResults.push(editorRightsTreeData);
        }

        if (filterSettings.withStatements) {
          const withStatementsTreeData = filterTreeWithStatements(treeData);
          if (withStatementsTreeData)
            filteredResults.push(withStatementsTreeData);
        }

        if (filterSettings.withSubterritories) {
          const withSubterritoriesTreeData =
            filterTreeWithSubterritories(treeData);
          if (withSubterritoriesTreeData)
            filteredResults.push(withSubterritoriesTreeData);
        }

        if (filterSettings.filter.length > 0) {
          const labelFilterTreeData = filterTreeByLabel(
            treeData,
            filterSettings.filter
          );
          if (labelFilterTreeData) filteredResults.push(labelFilterTreeData);
        }

        // Merge OR results (this is a simplified merge - we might need more sophisticated logic)
        if (filteredResults.length > 0) {
          newFilteredTreeData = filteredResults[0]; // For now, use first result
        }
      } else {
        // AND logic: apply filters sequentially
        if (filterSettings.starred && userData) {
          const starredTreeData = filterTreeByFavorites(
            newFilteredTreeData,
            userData.storedTerritories.map((t) => t.territory.id)
          );
          newFilteredTreeData = starredTreeData;
        }
        if (filterSettings.editorRights) {
          const editorRightsTreeData =
            filterTreeWithWriteRights(newFilteredTreeData);
          newFilteredTreeData = editorRightsTreeData;
        }
        if (filterSettings.withStatements) {
          const withStatementsTreeData =
            filterTreeWithStatements(newFilteredTreeData);
          newFilteredTreeData = withStatementsTreeData;
        }
        if (filterSettings.withSubterritories) {
          const withSubterritoriesTreeData =
            filterTreeWithSubterritories(newFilteredTreeData);
          newFilteredTreeData = withSubterritoriesTreeData;
        }
        if (filterSettings.filter.length > 0) {
          const labelFilterTreeData = filterTreeByLabel(
            newFilteredTreeData,
            filterSettings.filter
          );
          newFilteredTreeData = labelFilterTreeData;
        }
      }

      // Mark tree data for highlighting
      if (newFilteredTreeData && userData) {
        const markedTreeData = markNodesWithFilters(
          newFilteredTreeData,
          filterSettings,
          userData.storedTerritories.map((t) => t.territory.id)
        );
        return markedTreeData;
      }

      return newFilteredTreeData;
    }
  };

  useEffect(() => {
    if (filteredTreeData) {
      const foundTerritory = searchTree(filteredTreeData, territoryId);
      if (foundTerritory) {
        dispatch(setSelectedTerritoryPath(foundTerritory.path));
      }
    }
  }, [filteredTreeData, territoryId]);

  const treeFilterOpen: boolean = useAppSelector(
    (state) => state.territoryTree.filterOpen
  );

  const treeWidth = useDebounce(useSelector(selectPanelWidth(0)), 200);

  const treeWidthTooNarrow = treeWidth < 140;

  // delay of show content for fluent animation on open
  const [showTerritoryTree, setShowTerritoryTree] = useState(true);

  useEffect(() => {
    if (firstPanelExpanded) {
      setTimeout(() => {
        setShowTerritoryTree(true);
      }, 500);
    } else {
      setShowTerritoryTree(false);
    }
  }, [firstPanelExpanded]);

  return (
    <>
      {showTerritoryTree && (
        <>
          <ButtonGroup>
            {(userRole === UserEnums.Role.Admin ||
              userRole === UserEnums.Role.Owner) && (
              <Button
                label={!treeWidthTooNarrow ? "new" : ""}
                iconRight={<span style={{ marginLeft: 5 }}>{"\u0054"}</span>}
                icon={<FaPlus />}
                onClick={() => setShowCreate(true)}
                fullWidth
                tooltipLabel={treeWidthTooNarrow ? "create new territory" : ""}
              />
            )}
            <div
              style={{ display: "flex", alignItems: "center", width: "100%" }}
            >
              <Button
                label={!treeWidthTooNarrow ? "filter" : ""}
                onClick={() => {
                  if (treeFilterOpen) {
                    dispatch(setFilterOpen(false));
                    setFilteredTreeData(treeData);
                    setFilterSettings(initFilterSettings);
                    dispatch(setTreeInitialized(false));
                  } else {
                    dispatch(setFilterOpen(true));
                  }
                }}
                color="success"
                inverted={!treeFilterOpen}
                fullWidth
                icon={<BsFilter size={14} />}
                tooltipLabel={treeWidthTooNarrow ? "filter" : ""}
                tooltipPosition="right"
              />
            </div>
          </ButtonGroup>

          {treeFilterOpen && (
            <TerritoryTreeFilter
              filterData={filterSettings}
              handleFilterChange={(key, value) =>
                handleFilterChange(key, value)
              }
              userRole={userRole}
            />
          )}

          {firstPanelExpanded && (
            <CustomScrollbar
              scrollerId="Territories"
              elementId="Territories-box-content"
            >
              <StyledTreeWrapper
              // id="Territories-box-content"
              >
                {filteredTreeData && (
                  <MemoizedTerritoryTreeNode
                    right={filteredTreeData.right}
                    territory={filteredTreeData.territory}
                    children={filteredTreeData.children}
                    lvl={filteredTreeData.lvl}
                    statementsCount={filteredTreeData.statementsCount}
                    initExpandedNodes={selectedTerritoryPath}
                    empty={filteredTreeData.empty}
                    storedTerritories={storedTerritoryIds}
                    updateUserMutation={updateUserMutation}
                  />
                )}

                {/* No results */}
                {treeFilterOpen && !filteredTreeData && (
                  <StyledNoResults>{"No results"}</StyledNoResults>
                )}
              </StyledTreeWrapper>
            </CustomScrollbar>
          )}

          {showCreate && (
            <EntityCreateModal
              closeModal={() => setShowCreate(false)}
              allowedEntityClasses={[EntityEnums.Class.Territory]}
              onMutationSuccess={() =>
                queryClient.invalidateQueries({ queryKey: ["tree"] })
              }
            />
          )}
        </>
      )}
      <Loader
        show={
          isFetching ||
          updateUserMutation.isPending ||
          (firstPanelExpanded && !showTerritoryTree)
        }
      />
    </>
  );
};

export const MemoizedTerritoryTreeBox = React.memo(TerritoryTreeBox);
