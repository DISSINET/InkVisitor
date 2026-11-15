import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseStatement, IResponseTree } from "@inkvisitor/shared/types";
import { IAnchorsNode } from "@inkvisitor/shared/types/document";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { useMemo } from "react";
import {
  collectNearbyEntities,
  getStatementAnchorContext,
  getTerritoryChain,
  NEARBY_SUGGESTIONS_LIMIT,
  sortStatementsByDistance,
} from "../utils/nearbySuggestions";

const quiet = { ignoreErrorToast: true };

/**
 * Entities of the class (any class for the wildcard) already used in statements
 * around the selection, closest first: the statements anchored around the
 * selection, then the statements of the subT the selection sits in (nearest
 * anchors first), then up the T tree. A territory is fetched only while the
 * list is not full, and an unreadable territory ends the walk. The keys stay
 * outside "territory" so the frequent territory invalidations do not refetch
 * the whole walk; it may lag by a minute. The T tree comes from the cache the
 * Main page keeps loaded; without it only the anchored statements are listed.
 * While a new walk runs, e.g. for another class, the entities come from the
 * statements the previous walk fetched, so the list does not empty meanwhile.
 */
export const useAnnotatorNearbySuggestions = (
  anchors: IAnchorsNode[] | undefined,
  selectionIndex: number,
  leafTerritoryId: string | undefined,
  entityClass: EntityEnums.Class | EntityEnums.Extension.Any,
  enabled: boolean
): IEntity[] | undefined => {
  const queryClient = useQueryClient();

  const { containingIds, distances } = useMemo(
    () =>
      anchors
        ? getStatementAnchorContext(anchors, selectionIndex)
        : { containingIds: [], distances: new Map<string, number>() },
    [anchors, selectionIndex]
  );

  // the order of the statements does not change how many distinct entities of
  // the class they hold, so the fetched set depends on the spans and the class,
  // not on the index
  const { data } = useQuery({
    queryKey: ["annotator-nearby-suggestions", containingIds, leafTerritoryId, entityClass],
    queryFn: async () => {
      const anchored = (
        await Promise.all(
          containingIds.map((id) =>
            queryClient
              .fetchQuery({
                queryKey: ["statement", id],
                queryFn: async () => (await api.statementGet(id, quiet)).data,
                staleTime: 60_000,
              })
              .catch(() => undefined)
          )
        )
      ).filter((statement): statement is IResponseStatement => !!statement);

      const startId = leafTerritoryId ?? anchored[0]?.data.territory?.territoryId;
      const tree = queryClient.getQueryData<IResponseTree>(["tree"]);
      const levels: IResponseStatement[][] = [];
      for (const territoryId of startId && tree ? getTerritoryChain(tree, startId) : []) {
        const listed = collectNearbyEntities([anchored, ...levels].flat(), entityClass).length;
        if (listed >= NEARBY_SUGGESTIONS_LIMIT) {
          break;
        }
        const territory = await queryClient
          .fetchQuery({
            queryKey: ["annotator-nearby-territory", territoryId],
            queryFn: async () => (await api.territoryGet(territoryId, quiet, false)).data,
            staleTime: 60_000,
          })
          .catch(() => undefined);
        if (!territory) {
          break;
        }
        levels.push(territory.statements);
      }
      return { anchored, levels };
    },
    enabled: enabled && api.isLoggedIn() && (containingIds.length > 0 || !!leafTerritoryId),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    retry: false,
  });

  return useMemo(
    () =>
      data &&
      collectNearbyEntities(
        [
          ...data.anchored,
          ...data.levels.flatMap((statements) => sortStatementsByDistance(statements, distances)),
        ],
        entityClass
      ),
    [data, distances, entityClass]
  );
};
