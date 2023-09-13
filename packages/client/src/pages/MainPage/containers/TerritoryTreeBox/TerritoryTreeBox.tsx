import { UserEnums } from "@shared/enums";
import { IResponseTree } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rootTerritoryId } from "Theme/constants";
import api from "api";
import { Button, ButtonGroup, Loader } from "components";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { BsFilter } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { setSelectedTerritoryPath } from "redux/features/territoryTree/selectedTerritoryPathSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { ITerritoryFilter } from "types";
import { searchTree } from "utils";
import { ContextMenuNewTerritoryModal } from "./ContextMenuNewTerritoryModal/ContextMenuNewTerritoryModal";
import { StyledTreeWrapper } from "./TerritoryTreeBoxStyles";
import { TerritoryTreeFilter } from "./TerritoryTreeFilter/TerritoryTreeFilter";
import {
  filterTreeByFavorites,
  filterTreeByLabel,
  filterTreeNonEmpty,
  filterTreeWithWriteRights,
  markNodesWithStatementsCount,
} from "./TerritoryTreeFilterUtils";
import { TerritoryTreeNode } from "./TerritoryTreeNode/TerritoryTreeNode";

const initFilterSettings: ITerritoryFilter = {
  nonEmpty: false,
  starred: false,
  editorRights: false,
  filter: "",
};
export const TerritoryTreeBox: React.FC = () => {
  const queryClient = useQueryClient();

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
  const userId = localStorage.getItem("userid");

  const {
    status: userStatus,
    data: userData,
    error: userError,
    isFetching: userIsFetching,
  } = useQuery(
    ["user", userId],
    async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    { enabled: api.isLoggedIn() && !!userId }
  );

  const [storedTerritoryIds, setStoredTerritoryIds] = useState<string[]>([]);
  useEffect(() => {
    if (userData?.storedTerritories) {
      setStoredTerritoryIds(
        userData.storedTerritories.map((territory) => territory.territory.id)
      );
    }
  }, [userData?.storedTerritories]);

  const updateUserMutation = useMutation(
    async (changes: object) => {
      if (userId) {
        await api.usersUpdate(userId, changes);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["tree"]);
        queryClient.invalidateQueries(["user"]);
      },
    }
  );

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
  }, [treeData, filterSettings]);

  const handleFilterChange = (
    key: keyof ITerritoryFilter,
    value: boolean | string
  ) => setFilterSettings({ ...filterSettings, [key]: value });

  const getFilteredTreeData = () => {
    if (treeData) {
      let newFilteredTreeData: IResponseTree | null = treeData;

      if (filterSettings.nonEmpty) {
        // NON EMPTY
        const nonEmptyTreeData = filterTreeNonEmpty(newFilteredTreeData);
        newFilteredTreeData = nonEmptyTreeData
          ? markNodesWithStatementsCount(nonEmptyTreeData)
          : null;
      }
      if (filterSettings.starred) {
        // STARED
        if (userData) {
          const starredTreeData = filterTreeByFavorites(
            newFilteredTreeData,
            userData.storedTerritories.map((t) => t.territory.id)
          );
          newFilteredTreeData = starredTreeData;
        }
      }
      if (filterSettings.editorRights) {
        // EDITOR RIGHTS
        const editorRightsTreeData =
          filterTreeWithWriteRights(newFilteredTreeData);
        newFilteredTreeData = editorRightsTreeData;
      }
      if (filterSettings.filter.length > 0) {
        // LABEL FILTER
        const labelFilterTreeData = filterTreeByLabel(
          newFilteredTreeData,
          filterSettings.filter
        );
        newFilteredTreeData = labelFilterTreeData;
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

  const [filterIsOpen, setFilterIsOpen] = useState(true);

  return (
    <>
      {/* {userRole === UserEnums.RoleMode.Admin && ( */}
      <ButtonGroup>
        {userRole === UserEnums.RoleMode.Admin && (
          <Button
            label="new T"
            icon={<FaPlus />}
            onClick={() => setShowCreate(true)}
            fullWidth
          />
        )}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Button
            onClick={() => {
              if (filterIsOpen) {
                setFilterIsOpen(false);
                setFilteredTreeData(treeData);
                setFilterSettings(initFilterSettings);
              } else {
                setFilterIsOpen(true);
              }
            }}
            color="danger"
            inverted={!filterIsOpen}
            fullWidth
            icon={<BsFilter />}
            tooltipLabel={filterIsOpen ? "hide filter" : "show filter"}
            tooltipPosition="right"
          />
        </div>
      </ButtonGroup>
      {/* )} */}

      {filterIsOpen && (
        <TerritoryTreeFilter
          filterData={filterSettings}
          handleFilterChange={(key, value) => handleFilterChange(key, value)}
          userRole={userRole}
        />
      )}

      <StyledTreeWrapper id="Territories-box-content">
        {filteredTreeData && (
          <TerritoryTreeNode
            right={filteredTreeData.right}
            territory={filteredTreeData.territory}
            children={filteredTreeData.children}
            lvl={filteredTreeData.lvl}
            statementsCount={filteredTreeData.statementsCount}
            initExpandedNodes={selectedTerritoryPath}
            empty={filteredTreeData.empty}
            storedTerritories={storedTerritoryIds ? storedTerritoryIds : []}
            updateUserMutation={updateUserMutation}
          />
        )}
      </StyledTreeWrapper>

      {showCreate && (
        <ContextMenuNewTerritoryModal
          onClose={() => setShowCreate(false)}
          territoryActantId={rootTerritoryId}
        />
      )}
      <Loader show={isFetching || updateUserMutation.isLoading} />
    </>
  );
};

export const MemoizedTerritoryTreeBox = React.memo(TerritoryTreeBox);
