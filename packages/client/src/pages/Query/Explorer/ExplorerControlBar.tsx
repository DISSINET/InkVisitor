import React from "react";
import { TbColumnInsertRight } from "react-icons/tb";

import { Button, Checkbox, Loader } from "components";
import Dropdown from "components/advanced";

import { Explore } from "@inkvisitor/shared/types/query";
import { ExploreAction } from "./state";
import {
  StyledBatchSelect,
  StyledCounter,
  StyledControlGroup,
  StyledTableControl,
} from "./ExplorerTable/ExplorerTableStyles";
import { BatchAction, batchOptions, restrictedBatchActions } from "./ExplorerTable/types";
import { ButtonSize } from "types";

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
  /** When false, data-mutating batch actions (add metaprop / reference / relation) are hidden. */
  canBatchEdit?: boolean;
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
  const isTable = mode === Explore.EViewMode.Table;

  const renderHeaderCheckBox = (sel: ExplorerSelectionControls) => {
    const hasAnySelection =
      sel.isAllCurrentSelected || sel.hasPartialSelection || sel.selectedCount > 0;

    return (
      <Checkbox
        value={sel.isAllCurrentSelected}
        indeterminate={!sel.isAllCurrentSelected && hasAnySelection}
        color="primary"
        noFill
        size={15}
        onChangeFn={() => {
          // any selection at all clears it; only an empty selection selects the page
          if (hasAnySelection) {
            sel.onAllRowsSelect(false);
            sel.setRowLastClicked(-1);
          } else {
            sel.onAllRowsSelect(true);
          }
        }}
      />
    );
  };

  return (
    <StyledTableControl>
      {isTable && selection ? (
        <StyledControlGroup>
          <StyledBatchSelect>
            {renderHeaderCheckBox(selection)}
            <StyledCounter>{`${selection.selectedCount}/${selection.rowsTotal}`}</StyledCounter>
          </StyledBatchSelect>
          <Dropdown.Single.Basic
            width={140}
            disabled={selection.selectedCount === 0}
            value={selection.batchActionSelected}
            onChange={(selectedOption) => {
              const newSelectedAction = batchOptions.find((o) => o.value === selectedOption)?.value;
              if (newSelectedAction) {
                selection.setBatchActionSelected(newSelectedAction);
              }
            }}
            options={batchOptions.filter(
              (o) => selection.canBatchEdit || !restrictedBatchActions.has(o.value)
            )}
          />
          <Button
            label="apply"
            color="primary"
            inverted
            onClick={selection.onApplyBatchAction}
            disabled={selection.selectedCount === 0}
            size={ButtonSize.Medium}
          />
        </StyledControlGroup>
      ) : (
        // spacer so the filters keep the same position across modes
        <span />
      )}

      <span />

      <StyledControlGroup>
        {isTable && newColumn && (
          <Button
            icon={<TbColumnInsertRight size={17} />}
            label="new column"
            color="primary"
            inverted={!newColumn.isNewColumnOpen}
            onClick={() => newColumn.setIsNewColumnOpen(!newColumn.isNewColumnOpen)}
          />
        )}
        {/* Table only - the stats view carries its own loader over the chart. */}
        <Loader loaderStyle="beat" show={isTable && isQueryFetching} size={7} />
      </StyledControlGroup>
    </StyledTableControl>
  );
};

export default React.memo(ExplorerControlBar);
