import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IResponseTree } from "@inkvisitor/shared/types";
import { useAppSelector } from "redux/hooks";
import { searchTree } from "utils/utils";

export function useTerritoryNavigation(territoryId: string) {
  const queryClient = useQueryClient();

  const treeData: IResponseTree | undefined = queryClient.getQueryData(["tree"]);

  const selectedTerritoryPath = useAppSelector(
    (state) => state.territoryTree.selectedTerritoryPath,
  );

  const siblingTerritories = useMemo(() => {
    const parentId = selectedTerritoryPath[selectedTerritoryPath.length - 1];
    if (treeData) {
      const parentTerritory = searchTree(treeData, parentId);
      if (parentTerritory) {
        return parentTerritory.children.map((child) => child.territory.id);
      }
    }
    return [];
  }, [selectedTerritoryPath, treeData]);

  const previousTerritoryId = useMemo(() => {
    if (!territoryId || siblingTerritories.length === 0) return null;

    const currentIndex = siblingTerritories.indexOf(territoryId);
    if (currentIndex > 0) {
      return siblingTerritories[currentIndex - 1];
    }
    return null;
  }, [territoryId, siblingTerritories]);

  const nextTerritoryId = useMemo(() => {
    if (!territoryId || siblingTerritories.length === 0) return null;

    const currentIndex = siblingTerritories.indexOf(territoryId);
    if (currentIndex < siblingTerritories.length - 1) {
      return siblingTerritories[currentIndex + 1];
    }
    return null;
  }, [territoryId, siblingTerritories]);

  return { previousTerritoryId, nextTerritoryId };
}
