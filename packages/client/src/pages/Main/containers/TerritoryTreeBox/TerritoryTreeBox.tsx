import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IResponseTree, IUser } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, CustomScrollbar, Loader } from "components";
import { EntityCreateModal } from "components/advanced";
import { useSearchParams } from "hooks";
import { useUserQuery } from "hooks/react-query";
import { useTreeQuery } from "hooks/react-query/useTreeQuery";
import React, { useEffect, useMemo, useState } from "react";
import { BsFilter } from "react-icons/bs";
import { FaStar } from "react-icons/fa";
import { useSelector } from "react-redux";
import { selectPanelWidth } from "redux/features/layout/mainPage/panelWidthsSlice";
import { setFilterOpen } from "redux/features/territoryTree/filterOpenSlice";
import { setSelectedTerritoryPath } from "redux/features/territoryTree/selectedTerritoryPathSlice";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { COLLAPSED_PANEL_WIDTH } from "Theme/constants";
import { IExtendedResponseTree, ITerritoryFilter } from "types";
import { getStoredUserId, getStoredUserRole } from "utils/userStorage";
import { searchTree } from "utils/utils";
import {
  StyledNoResults,
  StyledTreeButtonGroup,
  StyledTreeWrapper,
} from "./TerritoryTreeBoxStyles";
import { TerritoryTreeFilter } from "./TerritoryTreeFilter/TerritoryTreeFilter";
import { filterTreeByFilters, markNodesWithFilters } from "./TerritoryTreeFilterUtils";
import { MemoizedTerritoryTreeNode } from "./TerritoryTreeNode/TerritoryTreeNode";
import { IcoPlusBold } from "Theme/icons";
import { IoFilter } from "react-icons/io5";

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
    (state) => state.layout.mainPage.firstPanelExpanded,
  );
  const secondPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.mainPage.secondPanelExpanded,
  );
  const thirdPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.mainPage.thirdPanelExpanded,
  );
  const fourthPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.mainPage.fourthPanelExpanded,
  );

  const queryClient = useQueryClient();

  const { data: treeData, isFetching } = useTreeQuery();

  const { data: userData } = useUserQuery();

  const storedTerritoryIds = useMemo(
    () => userData?.storedTerritories?.map((territory) => territory.territory.id) ?? [],
    [userData],
  );

  const userId = getStoredUserId();

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

  const userRole = getStoredUserRole();
  const { territoryId } = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);

  const dispatch = useAppDispatch();
  const selectedTerritoryPath = useAppSelector(
    (state) => state.territoryTree.selectedTerritoryPath,
  );

  const [filterSettings, setFilterSettings] = useState<ITerritoryFilter>(initFilterSettings);
  const [filteredTreeData, setFilteredTreeData] = useState<IExtendedResponseTree | null>();

  useEffect(() => {
    if (treeData) {
      if (JSON.stringify(filterSettings) === JSON.stringify(initFilterSettings)) {
        setFilteredTreeData(treeData);
      } else {
        // use filter - fn that returns new object with filtered tree and set to state
        setFilteredTreeData(getFilteredTreeData());
      }
    }
  }, [treeData, filterSettings, userData]);

  const handleFilterChange = (key: keyof ITerritoryFilter, value: boolean | string) =>
    setFilterSettings({ ...filterSettings, [key]: value });

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

      // the starred filter needs the user's favorites, so until they load it
      // would select nothing - show the unfiltered tree rather than "No results"
      if (filterSettings.starred && !userData) {
        return newFilteredTreeData;
      }

      newFilteredTreeData = filterTreeByFilters(
        treeData,
        filterSettings,
        userData?.storedTerritories.map((t) => t.territory.id) ?? [],
      );

      // Mark tree data for highlighting
      if (newFilteredTreeData && userData) {
        const markedTreeData = markNodesWithFilters(
          newFilteredTreeData,
          filterSettings,
          userData.storedTerritories.map((t) => t.territory.id),
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

  const treeFilterOpen: boolean = useAppSelector((state) => state.territoryTree.filterOpen);

  const basePanelWidth = useSelector(selectPanelWidth(0));
  const layoutWidth: number = useAppSelector((state) => state.layout.layoutWidth);

  const treeWidth = useMemo(() => {
    if (!firstPanelExpanded) return COLLAPSED_PANEL_WIDTH;
    if (!secondPanelExpanded && !thirdPanelExpanded && !fourthPanelExpanded) {
      return layoutWidth - 3 * COLLAPSED_PANEL_WIDTH;
    }
    return basePanelWidth;
  }, [
    firstPanelExpanded,
    secondPanelExpanded,
    thirdPanelExpanded,
    fourthPanelExpanded,
    layoutWidth,
    basePanelWidth,
  ]);

  const treeWidthTooNarrow = treeWidth < 160;

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
          <StyledTreeButtonGroup $gap="small">
            {(userRole === UserEnums.Role.Admin || userRole === UserEnums.Role.Owner) && (
              <Button
                label={!treeWidthTooNarrow ? "new" : ""}
                iconRight={<span style={{ marginLeft: 5 }}>{"\u0054"}</span>}
                icon={<IcoPlusBold />}
                onClick={() => setShowCreate(true)}
                inverted
                bold
                fullWidth
                tooltipLabel={treeWidthTooNarrow ? "create new territory" : ""}
              />
            )}
            <Button
              label={!treeWidthTooNarrow ? "filter" : ""}
              onClick={() => {
                if (treeFilterOpen) {
                  dispatch(setFilterOpen(false));
                  // starred is toggled outside the filter panel - keep it on close
                  setFilterSettings({
                    ...initFilterSettings,
                    starred: filterSettings.starred,
                  });
                  dispatch(setTreeInitialized(false));
                } else {
                  dispatch(setFilterOpen(true));
                }
              }}
              color="success"
              // inverted={!treeFilterOpen}
              bold={treeFilterOpen}
              fullWidth
              icon={<IoFilter size={13} />}
              tooltipLabel={
                treeFilterOpen ? "clear all filters" : treeWidthTooNarrow ? "filter" : ""
              }
              tooltipPosition="right"
            />
            <Button
              icon={<FaStar size={14} />}
              color={filterSettings.starred ? "warning" : "greyer"}
              inverted={!filterSettings.starred}
              onClick={() => {
                handleFilterChange("starred", !filterSettings.starred);
              }}
              tooltipLabel="starred territories"
              tooltipPosition="right"
            />
          </StyledTreeButtonGroup>

          {treeFilterOpen && (
            <TerritoryTreeFilter
              filterData={filterSettings}
              handleFilterChange={(key, value) => handleFilterChange(key, value)}
              userRole={userRole}
            />
          )}

          {firstPanelExpanded && (
            <CustomScrollbar scrollerId="Territories" elementId="Territories-box-content">
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
                    foundByRecursion={filteredTreeData.foundByRecursion}
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
              onMutationSuccess={() => queryClient.invalidateQueries({ queryKey: ["tree"] })}
            />
          )}
        </>
      )}
      <Loader
        show={
          isFetching || updateUserMutation.isPending || (firstPanelExpanded && !showTerritoryTree)
        }
      />
    </>
  );
};

export const MemoizedTerritoryTreeBox = React.memo(TerritoryTreeBox);
