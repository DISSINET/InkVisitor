import { Explore } from "@inkvisitor/shared/types/query";
import { Input } from "components";
import { useDebounce } from "hooks";
import React, { useCallback, useEffect, useState } from "react";
import { ExploreAction, ExploreActionType } from "../state";
import { StyledIdsFilter, StyledIdsFilterHint } from "./ExplorerTableStyles";
import { entityIdsEqual, parseEntityIdsFromText } from "pages/Query/utils";

const IDS_FILTER_DEBOUNCE_MS = 400;

interface ExplorerTableIdsFilterProps {
  filters: Explore.IExploreColumnFilter[];
  dispatch: React.Dispatch<ExploreAction>;
}

const getRowIdsFilter = (
  filters: Explore.IExploreColumnFilter[],
): Explore.IExploreRowIdsFilter | undefined =>
  filters.find(
    (f): f is Explore.IExploreRowIdsFilter => f.type === Explore.EExploreFilterType.RowIds,
  );

const ExplorerTableIdsFilter: React.FC<ExplorerTableIdsFilterProps> = ({ filters, dispatch }) => {
  const rowIdsFilter = getRowIdsFilter(filters);
  const appliedIds = rowIdsFilter?.ids ?? [];

  const [inputValue, setInputValue] = useState(() => appliedIds.join(" "));
  const debouncedInput = useDebounce(inputValue, IDS_FILTER_DEBOUNCE_MS);

  const dispatchFilter = useCallback(
    (ids: string[]) => {
      dispatch({
        type: ExploreActionType.setRowIdsFilter,
        payload: { ids },
      });
    },
    [dispatch],
  );

  useEffect(() => {
    const parsedIds = parseEntityIdsFromText(debouncedInput);
    if (!entityIdsEqual(parsedIds, appliedIds)) {
      dispatchFilter(parsedIds);
    }
  }, [debouncedInput, appliedIds, dispatchFilter]);

  const parsedCount = parseEntityIdsFromText(inputValue).length;

  return (
    <StyledIdsFilter>
      <Input
        width="full"
        placeholder="Filter by entity UUIDs (space-, tab-, or line-separated)"
        changeOnType
        value={inputValue}
        onChangeFn={setInputValue}
        clearable
      />
      {parsedCount > 0 && (
        <StyledIdsFilterHint>{`${parsedCount} UUID${
          parsedCount === 1 ? "" : "s"
        }`}</StyledIdsFilterHint>
      )}
    </StyledIdsFilter>
  );
};

export default React.memo(ExplorerTableIdsFilter);
