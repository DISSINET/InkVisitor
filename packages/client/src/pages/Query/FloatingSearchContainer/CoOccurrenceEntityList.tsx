import { IEntity } from "@inkvisitor/shared/types";
import { useQueries } from "@tanstack/react-query";
import api from "api";
import { EntityTag } from "components/advanced";
import { shortenUuid } from "pages/Query/utils";
import React, { useMemo, useRef, useState } from "react";
import { MdClose } from "react-icons/md";
import { List } from "react-window";
import { scrollOverscanCount } from "Theme/constants";
import {
  StyledCoOccurrenceChipRemove,
  StyledCoOccurrenceListRow,
  StyledCoOccurrenceListWrap,
  StyledCoOccurrenceUuidChip,
} from "./FloatingSearchFormStyles";

// px; one picked entity per row, matching EntityTag's own height
const ROW_HEIGHT = 26;
// rows the list shows before it scrolls
const MAX_VISIBLE_ROWS = 5;
// entities fetched per request; the rows on screen decide which chunks are asked for
const CHUNK_SIZE = 50;

const chunkIndexesFor = (startIndex: number, stopIndex: number): number[] => {
  const first = Math.floor(Math.max(startIndex, 0) / CHUNK_SIZE);
  const last = Math.floor(Math.max(stopIndex, 0) / CHUNK_SIZE);
  const indexes: number[] = [];
  for (let index = first; index <= last; index++) {
    indexes.push(index);
  }
  return indexes;
};

interface CoOccurrenceRow {
  entityIds: string[];
  entityById: Map<string, IEntity>;
  onRemove: (entityId: string) => void;
  index: number;
  style: React.CSSProperties;
}
const CoOccurrenceRow: React.FC<CoOccurrenceRow> = ({
  entityIds,
  entityById,
  onRemove,
  index,
  style,
}) => {
  const entityId = entityIds[index];
  const entity = entityById.get(entityId);

  return (
    <StyledCoOccurrenceListRow style={style}>
      {entity ? (
        <EntityTag
          entity={entity}
          tagMaxWidth={200}
          unlinkButton={{ onClick: () => onRemove(entityId) }}
        />
      ) : (
        // shown while the row's chunk loads, and for an id no entity answers to
        // - a mistyped or deleted one, which still filters and stays removable
        <StyledCoOccurrenceUuidChip title={entityId}>
          {shortenUuid(entityId)}
          <StyledCoOccurrenceChipRemove
            type="button"
            aria-label={`Remove ${entityId}`}
            onClick={() => onRemove(entityId)}
          >
            <MdClose size={12} />
          </StyledCoOccurrenceChipRemove>
        </StyledCoOccurrenceUuidChip>
      )}
    </StyledCoOccurrenceListRow>
  );
};

interface CoOccurrenceEntityList {
  entityIds: string[];
  onRemove: (entityId: string) => void;
}
/**
 * The picked co-occurrence entities, one per virtualised row. A pasted batch can
 * run to hundreds of ids and every EntityTag carries a tooltip and a drag
 * source, so only the rows on screen are mounted, and only the chunks they fall
 * into are fetched.
 */
export const CoOccurrenceEntityList: React.FC<CoOccurrenceEntityList> = ({
  entityIds,
  onRemove,
}) => {
  const [visibleRows, setVisibleRows] = useState({ startIndex: 0, stopIndex: 0 });

  const chunkIndexes = useMemo(
    () => chunkIndexesFor(visibleRows.startIndex, visibleRows.stopIndex),
    [visibleRows],
  );

  const chunkResults = useQueries({
    queries: chunkIndexes.map((chunkIndex) => {
      const ids = entityIds.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE);
      return {
        queryKey: ["floating-search-cooccurrence", ids],
        queryFn: async () => {
          const res = await api.entitiesGet(ids);
          return res.data ?? [];
        },
        enabled: api.isLoggedIn() && ids.length > 0,
      };
    }),
  });

  // Every entity ever fetched for this list, kept across the id-set changes that
  // re-key the chunk queries: removing one id reshuffles the chunk it sits in,
  // and the rows that survive keep their tag instead of dropping to a raw id.
  const entityByIdRef = useRef(new Map<string, IEntity>());
  for (const result of chunkResults) {
    result.data?.forEach((entity) => entityByIdRef.current.set(entity.id, entity));
  }

  const listHeight = Math.min(entityIds.length, MAX_VISIBLE_ROWS) * ROW_HEIGHT;

  return (
    <StyledCoOccurrenceListWrap $height={listHeight}>
      <List
        rowProps={{
          entityIds,
          entityById: entityByIdRef.current,
          onRemove,
        }}
        rowCount={entityIds.length}
        rowHeight={ROW_HEIGHT}
        overscanCount={scrollOverscanCount}
        onRowsRendered={setVisibleRows}
        rowComponent={(props) => <CoOccurrenceRow {...props} />}
      />
    </StyledCoOccurrenceListWrap>
  );
};
