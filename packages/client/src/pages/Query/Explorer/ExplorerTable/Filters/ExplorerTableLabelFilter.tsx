import { Explore } from "@inkvisitor/shared/types/query";
import { Checkbox, Input } from "components";
import { useDebounce } from "hooks";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IcoSearch } from "Theme/icons";
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

  // what this input last pushed into the state, so an applied filter that does
  // not match it can be recognised as coming from elsewhere
  const lastDispatchedRef = useRef(appliedLabel.trim());

  const dispatchFilter = useCallback(
    (label: string, regexMode: boolean) => {
      lastDispatchedRef.current = label.trim();
      dispatch({
        type: ExploreActionType.setLabelFilter,
        payload: { label, useRegex: regexMode },
      });
    },
    [dispatch],
  );

  // The label filter can also be set from outside the input — loading a saved
  // query replaces the whole filter set — so adopt such a change instead of
  // leaving a stale input that the effect below would then push back over it.
  useEffect(() => {
    if (appliedLabel.trim() !== lastDispatchedRef.current) {
      lastDispatchedRef.current = appliedLabel.trim();
      setInputValue(appliedLabel);
      setUseRegex(appliedUseRegex);
    }
  }, [appliedLabel, appliedUseRegex]);

  // Label text only — debounced. Regex mode toggles immediately via the checkbox.
  // Waits for the debounce to catch up with the input: mid-flight it still holds
  // the previous text, which would otherwise overwrite a freshly adopted filter.
  useEffect(() => {
    if (debouncedLabel !== inputValue) {
      return;
    }
    if (debouncedLabel.trim() !== appliedLabel.trim()) {
      dispatchFilter(debouncedLabel, useRegex);
    }
  }, [debouncedLabel, inputValue, appliedLabel, useRegex, dispatchFilter]);

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
        icon={<IcoSearch />}
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
