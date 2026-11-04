import { Explore, Query } from "@inkvisitor/shared/types/query";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { EntityTag } from "components/advanced";
import React, { useRef, useState } from "react";

import { NODE_FILTER_KEYS } from "../utils";
import { NodePopover } from "./NodePopover";
import {
  StyledExpansionCountButton,
  StyledExpansionPopoverMessage,
  StyledExpansionSectionTags,
} from "./QueryStyles";

// entities listed in the popover; the count covers all of them
const PREVIEW_LIMIT = 50;

interface NodeFilterMatches {
  node: Query.INode;
  edgeType: Query.EdgeType | undefined;
  onOpenEntityInDetail?: (entityId: string) => void;
}

/**
 * How many entities the filters of an empty node let through, and which. The
 * server narrows such a target to the same set: the node's classes, else the
 * classes the edge's target can hold, with its status, language and label.
 */
export const NodeFilterMatches: React.FC<NodeFilterMatches> = ({
  node,
  edgeType,
  onOpenEntityInDetail,
}) => {
  const { entityClasses } = node.params;
  const classes = entityClasses?.length
    ? entityClasses
    : (edgeType && Query.EdgeTypeTargetNodeParams[edgeType]?.entityId?.allowedClasses) || [];

  // The matches are fetched only when the user asks for them, never while the
  // filters are being edited: the request runs only while the node still
  // carries the filters that were asked for, and a combination asked for
  // before reads from the cache.
  const params: Query.INodeParams = {
    entityClasses: classes,
    ...Object.fromEntries(
      NODE_FILTER_KEYS.filter((key) => node.params[key] !== undefined).map((key) => [
        key,
        node.params[key],
      ]),
    ),
    label: node.params.label?.trim() || undefined,
  };
  const filtersSignature = JSON.stringify(params);
  const [requestedSignature, setRequestedSignature] = useState<string | null>(null);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["node-filter-matches", params],
    queryFn: async () => {
      const res = await api.query({
        query: {
          id: "node-filter-matches",
          type: node.type,
          operator: Query.NodeOperator.And,
          edges: [],
          params,
        },
        explore: {
          view: { mode: Explore.EViewMode.Table, columns: [] },
          filters: [],
          sort: undefined,
          limit: PREVIEW_LIMIT,
          offset: 0,
        },
      });
      return res.data;
    },
    enabled: requestedSignature === filtersSignature && api.isLoggedIn(),
    staleTime: 60 * 1000,
  });

  const badgeRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const isPending = isFetching || !data;
  const shown = data?.entities ?? [];

  return (
    <>
      <StyledExpansionCountButton
        ref={badgeRef}
        type="button"
        onClick={() => {
          setRequestedSignature(filtersSignature);
          setIsOpen((open) => !open);
        }}
      >
        {isError
          ? "? matches"
          : isPending
            ? "… matches"
            : `${data.total} ${data.total === 1 ? "match" : "matches"}`}
      </StyledExpansionCountButton>
      {isOpen && (
        <NodePopover referenceElement={badgeRef.current} onClose={() => setIsOpen(false)}>
          {isFetching && <StyledExpansionPopoverMessage>loading…</StyledExpansionPopoverMessage>}
          {isError && (
            <StyledExpansionPopoverMessage>
              could not load the matches
            </StyledExpansionPopoverMessage>
          )}
          {!isPending && data && data.total === 0 && (
            <StyledExpansionPopoverMessage>
              no entity passes these filters
            </StyledExpansionPopoverMessage>
          )}
          {!isPending && shown.length > 0 && (
            <StyledExpansionSectionTags>
              {shown.map(({ entity }) => (
                <EntityTag
                  key={entity.id}
                  entity={entity}
                  tagMaxWidth={160}
                  onDoubleClick={() => onOpenEntityInDetail?.(entity.id)}
                />
              ))}
            </StyledExpansionSectionTags>
          )}
          {!isPending && data && data.total > shown.length && (
            <StyledExpansionPopoverMessage>
              {`first ${shown.length} of ${data.total}`}
            </StyledExpansionPopoverMessage>
          )}
        </NodePopover>
      )}
    </>
  );
};
