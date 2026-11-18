import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import api from "api";
import { ExpansionGroup } from "./nodeExpansion";

/**
 * The EQ / SUB expansion of a picked entity behind the count badges and their
 * popover, for a node and for a prop edge's "of type" / "with value" pick.
 *
 * The expansion is fetched only when the user asks for it, never as a side
 * effect of editing the query: the signature identifies the toggle combination
 * that was asked for, and the request runs only while the toggles still carry
 * it. Flipping a toggle therefore costs nothing until the new combination is
 * asked for in turn.
 */
export const useEntityExpansion = (
  entityId: string | undefined,
  includeEquivalents: boolean,
  includeSubordinates: boolean
) => {
  const expansionSignature = `${entityId}|${includeEquivalents}|${includeSubordinates}`;
  const [requestedExpansionSignature, setRequestedExpansionSignature] = useState<string | null>(
    null
  );

  const {
    data: dataExpansion,
    isFetching: isExpansionFetching,
    isError: isExpansionError,
  } = useQuery({
    queryKey: ["node-expansion", entityId, includeEquivalents, includeSubordinates],
    queryFn: async () => {
      const res = await api.entityExpansion(entityId!, {
        equivalents: includeEquivalents,
        subordinates: includeSubordinates,
      });
      return res.data;
    },
    enabled: !!entityId && requestedExpansionSignature === expansionSignature && api.isLoggedIn(),
    // the relation graph does not move while a query is being built, so
    // returning to a combination already asked for reads from the cache and
    // shows its count without a second request
    staleTime: 5 * 60 * 1000,
  });

  const [openExpansionGroup, setOpenExpansionGroup] = useState<ExpansionGroup | null>(null);
  const equivalentsBadgeRef = useRef<HTMLButtonElement | null>(null);
  const subordinatesBadgeRef = useRef<HTMLButtonElement | null>(null);

  const openExpansion = (group: ExpansionGroup) => {
    setRequestedExpansionSignature(expansionSignature);
    setOpenExpansionGroup(openExpansionGroup === group ? null : group);
  };

  // a popover describes one toggle combination, so editing the toggles closes it
  useEffect(() => {
    setOpenExpansionGroup(null);
  }, [expansionSignature]);

  return {
    dataExpansion,
    isExpansionFetching,
    isExpansionError,
    openExpansionGroup,
    setOpenExpansionGroup,
    equivalentsBadgeRef,
    subordinatesBadgeRef,
    openExpansion,
  };
};
