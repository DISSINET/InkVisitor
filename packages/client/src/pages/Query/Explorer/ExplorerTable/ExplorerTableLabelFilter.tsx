import { Explore } from "@inkvisitor/shared/types/query";
import { Button, Input } from "components";
import { useDebounce } from "hooks";
import React, { useEffect, useState } from "react";
import { RiCloseFill } from "react-icons/ri";
import { ExploreAction, ExploreActionType } from "../state";
import { StyledLabelFilter } from "./ExplorerTableStyles";

const LABEL_FILTER_DEBOUNCE_MS = 400;

interface ExplorerTableLabelFilterProps {
  filters: Explore.IExploreColumnFilter[];
  dispatch: React.Dispatch<ExploreAction>;
}

const getRowLabelFilter = (
  filters: Explore.IExploreColumnFilter[]
): Explore.IExploreRowLabelFilter | undefined =>
  filters.find(
    (f): f is Explore.IExploreRowLabelFilter =>
      f.type === Explore.EExploreFilterType.RowLabel
  );

const ExplorerTableLabelFilter: React.FC<ExplorerTableLabelFilterProps> = ({
  filters,
  dispatch,
}) => {
  const appliedLabel = getRowLabelFilter(filters)?.label ?? "";
  const [inputValue, setInputValue] = useState(appliedLabel);
  const debouncedLabel = useDebounce(inputValue, LABEL_FILTER_DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedLabel.trim() !== appliedLabel.trim()) {
      dispatch({
        type: ExploreActionType.setRowLabelFilter,
        payload: { label: debouncedLabel },
      });
    }
  }, [debouncedLabel, appliedLabel, dispatch]);

  return (
    <StyledLabelFilter>
      <Input
        width="full"
        placeholder="Filter by entity label…"
        changeOnType
        value={inputValue}
        onChangeFn={setInputValue}
      />
      {inputValue.length > 0 && (
        <Button
          inverted
          icon={<RiCloseFill />}
          tooltipLabel="clear label filter"
          onClick={() => setInputValue("")}
        />
      )}
    </StyledLabelFilter>
  );
};

export default React.memo(ExplorerTableLabelFilter);
