import React, { useContext } from "react";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
  MdOutlineIndeterminateCheckBox,
} from "react-icons/md";
import { TbColumnInsertRight } from "react-icons/tb";

import { Button, Loader } from "components";
import Dropdown from "components/advanced";

import { Explore } from "@inkvisitor/shared/types/query";
import { ThemeContext } from "styled-components";
import { ExploreAction } from "./state";
import ExplorerTableLabelFilter from "./ExplorerTable/ExplorerTableLabelFilter";
import ExplorerTableIdsFilter from "./ExplorerTable/ExplorerTableIdsFilter";
import {
  StyledCounter,
  StyledControlGroup,
  StyledExploreFilters,
  StyledTableControl,
} from "./ExplorerTable/ExplorerTableStyles";
import { BatchAction, batchOptions } from "./ExplorerTable/types";

/** Row-selection + batch-action controls. Only meaningful for the table view
 * (the stats view has no row selection), so this block is optional. */
export interface ExplorerSelectionControls {
  selectedCount: number;
  isAllCurrentSelected: boolean;
  hasPartialSelection: boolean;
  rowsTotal: number;
  onAllRowsSelect: (checked: boolean) => void;
  setRowLastClicked: (value: number) => void;
  batchActionSelected: BatchAction;
  setBatchActionSelected: (value: BatchAction) => void;
  onApplyBatchAction: () => void;
}

/** New-column toggle. Table view only (the stats view has no columns). */
export interface ExplorerNewColumnControls {
  isNewColumnOpen: boolean;
  setIsNewColumnOpen: (value: boolean) => void;
}

interface ExplorerControlBarProps {
  /** Current explorer view mode - drives which controls are shown. */
  mode: Explore.EViewMode;
  /** Entity label / uuid filters - shared by every explorer view mode. */
  filters: Explore.IExploreSearchFilter[];
  dispatch: React.Dispatch<ExploreAction>;
  isQueryFetching: boolean;
  /** Provided in table mode only. */
  selection?: ExplorerSelectionControls;
  /** Provided in table mode only. */
  newColumn?: ExplorerNewColumnControls;
}

const ExplorerControlBar: React.FC<ExplorerControlBarProps> = ({
  mode,
  filters,
  dispatch,
  isQueryFetching,
  selection,
  newColumn,
}) => {
  const themeContext = useContext(ThemeContext);
  const isTable = mode === Explore.EViewMode.Table;

  const renderHeaderCheckBox = (sel: ExplorerSelectionControls) => {
    const size = 18;
    if (sel.isAllCurrentSelected) {
      return (
        <MdOutlineCheckBox
          color={themeContext?.color.primary}
          size={size}
          onClick={() => {
            sel.onAllRowsSelect(false);
            sel.setRowLastClicked(-1);
          }}
        />
      );
    } else if (sel.hasPartialSelection || sel.selectedCount > 0) {
      return (
        <MdOutlineIndeterminateCheckBox
          color={themeContext?.color.primary}
          size={size}
          onClick={() => {
            sel.onAllRowsSelect(false);
            sel.setRowLastClicked(-1);
          }}
        />
      );
    }
    return (
      <MdOutlineCheckBoxOutlineBlank
        color={themeContext?.color.primary}
        size={size}
        onClick={() => sel.onAllRowsSelect(true)}
      />
    );
  };

  return (
    <StyledTableControl>
      {isTable && selection ? (
        <StyledControlGroup>
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            {renderHeaderCheckBox(selection)}
          </div>
          <StyledCounter>{`${selection.selectedCount}/${selection.rowsTotal}`}</StyledCounter>
          <Dropdown.Single.Basic
            width={140}
            disabled={selection.selectedCount === 0}
            value={selection.batchActionSelected}
            onChange={(selectedOption) => {
              const newSelectedAction = batchOptions.find(
                (o) => o.value === selectedOption,
              )?.value;
              if (newSelectedAction) {
                selection.setBatchActionSelected(newSelectedAction);
              }
            }}
            options={batchOptions}
          />
          <Button
            label="apply"
            color="primary"
            inverted
            onClick={selection.onApplyBatchAction}
            disabled={selection.selectedCount === 0}
          />
        </StyledControlGroup>
      ) : (
        // spacer so the filters keep the same position across modes
        <span />
      )}

      <StyledExploreFilters>
        <ExplorerTableLabelFilter filters={filters} dispatch={dispatch} />
        <ExplorerTableIdsFilter filters={filters} dispatch={dispatch} />
      </StyledExploreFilters>

      <StyledControlGroup>
        {isTable && newColumn && (
          <Button
            icon={<TbColumnInsertRight size={17} />}
            label="new column"
            color="primary"
            inverted={!newColumn.isNewColumnOpen}
            onClick={() =>
              newColumn.setIsNewColumnOpen(!newColumn.isNewColumnOpen)
            }
          />
        )}
        <Loader loaderStyle="beat" show={isQueryFetching} size={7} />
      </StyledControlGroup>
    </StyledTableControl>
  );
};

export default React.memo(ExplorerControlBar);
