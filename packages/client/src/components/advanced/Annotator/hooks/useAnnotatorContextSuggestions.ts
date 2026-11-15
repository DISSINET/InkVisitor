import { IEntity, IResponseStatement, IResponseTree } from "@inkvisitor/shared/types";
import { IAnchorsNode } from "@inkvisitor/shared/types/document";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { useMemo } from "react";
import {
  collectContextEntities,
  CONTEXT_SUGGESTIONS_LIMIT,
  getStatementAnchorContext,
  getTerritoryChain,
  sortStatementsByDistance,
} from "../utils/contextSuggestions";

const quiet = { ignoreErrorToast: true };

/**
 * Entities already used in statements around the selection, closest context
 * first: the statements anchored around the selection, then the statements of
 * the subT the selection sits in (nearest anchors first), then up the T tree.
 * A territory is fetched only while the list is not full, and an unreadable
 * territory ends the walk. The keys stay outside "territory" so the frequent
 * territory invalidations do not refetch the whole walk; it may lag by a minute.
 * The T tree comes from the cache the Main page keeps loaded; without it only
 * the anchored statements are listed.
 */
export const useAnnotatorContextSuggestions = (
  anchors: IAnchorsNode[] | undefined,
  selectionIndex: number,
  leafTerritoryId: string | undefined,
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

  // the order of the statements does not change how many distinct entities
  // they hold, so the fetched set depends on the spans, not on the index
  const { data } = useQuery({
    queryKey: ["annotator-context-suggestions", containingIds, leafTerritoryId],
    queryFn: async () => {
      const anchored = (
        await Promise.all(
          containingIds.map((id) =>
            queryClient
              .fetchQuery({
                queryKey: ["statement", id],
                queryFn: async () => (await api.statementGet(id, quiet)).data,
              })
              .catch(() => undefined)
          )
        )
      ).filter((statement): statement is IResponseStatement => !!statement);

      const startId = leafTerritoryId ?? anchored[0]?.data.territory?.territoryId;
      const tree = queryClient.getQueryData<IResponseTree>(["tree"]);
      const levels: IResponseStatement[][] = [];
      for (const territoryId of startId && tree ? getTerritoryChain(tree, startId) : []) {
        const listed = collectContextEntities([anchored, ...levels].flat()).length;
        if (listed >= CONTEXT_SUGGESTIONS_LIMIT) {
          break;
        }
        const territory = await queryClient
          .fetchQuery({
            queryKey: ["annotator-context-territory", territoryId],
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
    retry: false,
  });

  return useMemo(
    () =>
      data &&
      collectContextEntities([
        ...data.anchored,
        ...data.levels.flatMap((statements) => sortStatementsByDistance(statements, distances)),
      ]),
    [data, distances]
  );
};
