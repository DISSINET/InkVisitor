import { Explore } from "@inkvisitor/shared/types/query";
import { Checkbox, Input } from "components";
import { useDebounce } from "hooks";
import React, { useCallback, useEffect, useState } from "react";
import { LuRegex } from "react-icons/lu";
import { ExploreAction, ExploreActionType } from "../state";
import { StyledLabelFilter, StyledLabelFilterCheckboxWrapper } from "./ExplorerTableStyles";

const LABEL_FILTER_DEBOUNCE_MS = 400;

interface ExplorerTableLabelFilterProps {
  filters: Explore.IExploreColumnFilter[];
  dispatch: React.Dispatch<ExploreAction>;
}

const getRowLabelFilter = (
  filters: Explore.IExploreColumnFilter[]
): Explore.IExploreRowLabelFilter | undefined =>
  filters.find(
    (f): f is Explore.IExploreRowLabelFilter => f.type === Explore.EExploreFilterType.RowLabel
  );

const ExplorerTableLabelFilter: React.FC<ExplorerTableLabelFilterProps> = ({
  filters,
  dispatch,
}) => {
  const rowLabelFilter = getRowLabelFilter(filters);
  const appliedLabel = rowLabelFilter?.label ?? "";
  const appliedUseRegex = rowLabelFilter?.useRegex ?? false;

  const [inputValue, setInputValue] = useState(appliedLabel);
  const [useRegex, setUseRegex] = useState(appliedUseRegex);
  const debouncedLabel = useDebounce(inputValue, LABEL_FILTER_DEBOUNCE_MS);

  const dispatchFilter = useCallback(
    (label: string, regexMode: boolean) => {
      dispatch({
        type: ExploreActionType.setRowLabelFilter,
        payload: { label, useRegex: regexMode },
      });
    },
    [dispatch]
  );

  // Label text only — debounced. Regex mode toggles immediately via the checkbox.
  useEffect(() => {
    if (debouncedLabel.trim() !== appliedLabel.trim()) {
      dispatchFilter(debouncedLabel, useRegex);
    }
  }, [debouncedLabel, appliedLabel, useRegex, dispatchFilter]);

  return (
    <StyledLabelFilter>
      <Input
        width="full"
        placeholder={
          useRegex ? "Regular expression (e.g. ^John|/Smith$/i)…" : "Filter by entity label…"
        }
        changeOnType
        value={inputValue}
        onChangeFn={setInputValue}
        clearable
      />
      <StyledLabelFilterCheckboxWrapper>
        <Checkbox
          iconOnly
          value={useRegex}
          onChangeFn={(checked: boolean) => {
            setUseRegex(checked);
            dispatchFilter(inputValue, checked);
          }}
          icon={<LuRegex size={14} />}
          tooltipLabel="regex mode"
          tooltipPosition="top"
        />
      </StyledLabelFilterCheckboxWrapper>
    </StyledLabelFilter>
  );
};

export default React.memo(ExplorerTableLabelFilter);
