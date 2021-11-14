import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";

import api from "api";
import { TerritoryTreeNode } from "./TerritoryTreeNode/TerritoryTreeNode";
import { IResponseTree } from "@shared/types";
import { Button, Loader } from "components";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setSelectedTerritoryPath } from "redux/features/territoryTree/selectedTerritoryPathSlice";
import { useSearchParams } from "hooks";
import { FaPlus } from "react-icons/fa";
import { ContextMenuNewTerritoryModal } from "./ContextMenuNewTerritoryModal/ContextMenuNewTerritoryModal";
import { rootTerritoryId } from "Theme/constants";
import { UserRoleMode } from "@shared/enums";

export const TerritoryTreeBox: React.FC = () => {
  const { status, data, error, isFetching } = useQuery(
    ["tree"],
    async () => {
      const res = await api.treeGet();
      return res.data;
    },
    { enabled: api.isLoggedIn() }
  );

  const userRole = localStorage.getItem("userrole");
  const { territoryId } = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);

  const dispatch = useAppDispatch();
  const selectedTerritoryPath = useAppSelector(
    (state) => state.territoryTree.selectedTerritoryPath
  );

  const searchTree = (
    element: IResponseTree,
    matchingTitle: string
  ): IResponseTree | null => {
    if (element.territory.id === matchingTitle) {
      return element;
    } else if (element.children != null) {
      var i;
      var result = null;
      for (i = 0; result === null && i < element.children.length; i++) {
        result = searchTree(element.children[i], matchingTitle);
      }
      return result;
    }
    return null;
  };

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
      {data && (
        <TerritoryTreeNode
          right={data.right}
          territory={data.territory}
          children={data.children}
          lvl={data.lvl}
          statementsCount={data.statementsCount}
          initExpandedNodes={selectedTerritoryPath}
          empty={data.empty}
        />
      )}
      {userRole === UserRoleMode.Admin && (
        <Button
          label="new territory"
          icon={<FaPlus />}
          onClick={() => setShowCreate(true)}
        />
      )}

      {showCreate && (
        <ContextMenuNewTerritoryModal
          onClose={() => setShowCreate(false)}
          territoryActantId={rootTerritoryId}
        />
      )}
      <Loader show={isFetching} />
    </>
  );
};
