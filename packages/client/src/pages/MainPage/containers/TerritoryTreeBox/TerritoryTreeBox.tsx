import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import api from "api";
import { TerritoryTreeNode } from "./TerritoryTreeNode/TerritoryTreeNode";
import { IResponseTree, IResponseUser } from "@shared/types";
import { Button, Loader } from "components";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setSelectedTerritoryPath } from "redux/features/territoryTree/selectedTerritoryPathSlice";
import { useSearchParams } from "hooks";
import { FaPlus } from "react-icons/fa";
import { ContextMenuNewTerritoryModal } from "./ContextMenuNewTerritoryModal/ContextMenuNewTerritoryModal";
import { rootTerritoryId } from "Theme/constants";
import { UserRoleMode } from "@shared/enums";
import { StyledTreeWrapper } from "./TerritoryTreeBoxStyles";
import { searchTree } from "utils";

export const TerritoryTreeBox: React.FC = () => {
  const queryClient = useQueryClient();

  const { status, data, error, isFetching } = useQuery(
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
    ["user"],
    async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    { enabled: api.isLoggedIn() }
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

  useEffect(() => {
    if (data) {
      const foundTerritory = searchTree(data, territoryId);
      if (foundTerritory) {
        dispatch(setSelectedTerritoryPath(foundTerritory.path));
      }
    }
  }, [data, territoryId]);

  return (
    <>
      {userRole === UserRoleMode.Admin && (
        <Button
          label="new territory"
          icon={<FaPlus />}
          onClick={() => setShowCreate(true)}
        />
      )}

      <StyledTreeWrapper id="Territories-box-content">
        {data && (
          <TerritoryTreeNode
            right={data.right}
            territory={data.territory}
            children={data.children}
            lvl={data.lvl}
            statementsCount={data.statementsCount}
            initExpandedNodes={selectedTerritoryPath}
            empty={data.empty}
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
      <Loader
        show={isFetching || userIsFetching || updateUserMutation.isLoading}
      />
    </>
  );
};
