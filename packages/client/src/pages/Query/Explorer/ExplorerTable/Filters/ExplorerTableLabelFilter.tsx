import { Explore } from "@inkvisitor/shared/types/query";
import { Checkbox, Input } from "components";
import { useDebounce } from "hooks";
import React, { useCallback, useEffect, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { LuRegex } from "react-icons/lu";
import { ExploreAction, ExploreActionType } from "../../state";
import { StyledLabelFilter, StyledLabelFilterCheckboxWrapper } from "../ExplorerTableStyles";

const LABEL_FILTER_DEBOUNCE_MS = 500;

interface ExplorerTableLabelFilterProps {
  filters: Explore.IExploreSearchFilter[];
  dispatch: React.Dispatch<ExploreAction>;
}

const getRowLabelFilter = (
  filters: Explore.IExploreSearchFilter[],
): Explore.IExploreLabelFilter | undefined =>
  filters.find((f): f is Explore.IExploreLabelFilter => f.type === Explore.SearchOption.Label);

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
        type: ExploreActionType.setLabelFilter,
        payload: { label, useRegex: regexMode },
      });
    },
    [dispatch],
  );

  // Label text only — debounced. Regex mode toggles immediately via the checkbox.
  useEffect(() => {
    if (debouncedLabel.trim() !== appliedLabel.trim()) {
      dispatchFilter(debouncedLabel, useRegex);
    }
  }, [debouncedLabel, appliedLabel, useRegex, dispatchFilter]);

  return (
    <StyledLabelFilter data-run-on-enter="true">
      <Input
        width="full"
        placeholder={
          useRegex ? "Regular expression (e.g. ^John|/Smith$/i)" : "Filter by entity label"
        }
        changeOnType
        value={inputValue}
        onChangeFn={setInputValue}
        clearable
        roundCorners
        icon={<BiSearch />}
        rightContent={
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
        }
      />
    </StyledLabelFilter>
  );
};

export default React.memo(ExplorerTableLabelFilter);
