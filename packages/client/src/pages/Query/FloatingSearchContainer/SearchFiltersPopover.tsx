import { Placement } from "@floating-ui/react";
import { Explore } from "@inkvisitor/shared/types/query";
import React, { useState } from "react";
import { countFloatingSearchFilters, ExploreAction, ExploreActionType } from "../Explorer/state";
import { FilterPopover } from "../FilterPopover/FilterPopover";
import { FloatingSearchForm } from "./FloatingSearchForm";

interface SearchFiltersPopover {
  filters: Explore.IExploreSearchFilter[];
  dispatch: React.Dispatch<ExploreAction>;
  placement?: Placement;
}

/** The "Filters" button of the Query box and the panel with every search filter. */
export const SearchFiltersPopover: React.FC<SearchFiltersPopover> = ({
  filters,
  dispatch,
  placement,
}) => {
  // The form reads the filters only when it mounts, so clearing remounts it
  // through its key to show the cleared state.
  const [formResetKey, setFormResetKey] = useState(0);

  return (
    <FilterPopover
      label="Filters"
      title="Filters"
      count={countFloatingSearchFilters(filters)}
      tooltipLabel="status, language, dates, users and more"
      placement={placement}
      width="32rem"
      onClear={() => {
        dispatch({ type: ExploreActionType.clearFloatingSearchFilters });
        setFormResetKey((key) => key + 1);
      }}
    >
      <FloatingSearchForm key={formResetKey} dispatch={dispatch} filters={filters} />
    </FilterPopover>
  );
};
