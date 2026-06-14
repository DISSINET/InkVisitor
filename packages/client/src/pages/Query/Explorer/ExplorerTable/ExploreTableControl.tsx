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
import { ExploreAction } from "../state";
import ExplorerTableLabelFilter from "./ExplorerTableLabelFilter";
import { StyledCounter, StyledExploreFilters, StyledTableControl } from "./ExplorerTableStyles";
import { BatchAction, batchOptions } from "./types";

interface ExploreTableControlProps {
  isNewColumnOpen: boolean;
  setIsNewColumnOpen: (value: boolean) => void;

  selectedCount: number;
  isAllCurrentSelected: boolean;
  hasPartialSelection: boolean;
  onAllRowsSelect: (checked: boolean) => void;

  rowsTotal: number;

  batchActionSelected: BatchAction;
  setBatchActionSelected: (value: BatchAction) => void;

  setRowLastClicked: (value: number) => void;

  onApplyBatchAction: () => void;

  filters: Explore.IExploreSearchFilter[];
  dispatch: React.Dispatch<ExploreAction>;
  isQueryFetching: boolean;
}

const ExploreTableControl: React.FC<ExploreTableControlProps> = ({
  isNewColumnOpen,
  setIsNewColumnOpen,

  selectedCount,
  isAllCurrentSelected,
  hasPartialSelection,
  onAllRowsSelect,

  rowsTotal,

  batchActionSelected,
  setBatchActionSelected,

  setRowLastClicked,

  onApplyBatchAction,

  filters,
  dispatch,
  isQueryFetching,
}) => {
  const handleSelectAll = (checked: boolean) => onAllRowsSelect(checked);

  const themeContext = useContext(ThemeContext);

  const renderHeaderCheckBox = () => {
    const size = 18;
    if (isAllCurrentSelected) {
      return (
        <MdOutlineCheckBox
          color={themeContext?.color.primary}
          size={size}
          onClick={() => {
            handleSelectAll(false);
            setRowLastClicked(-1);
          }}
        />
      );
    } else if (hasPartialSelection || selectedCount > 0) {
      // some rows selected
      return (
        <MdOutlineIndeterminateCheckBox
          color={themeContext?.color.primary}
          size={size}
          onClick={() => {
            handleSelectAll(false);
            setRowLastClicked(-1);
          }}
        />
      );
    } else {
      return (
        <MdOutlineCheckBoxOutlineBlank
          color={themeContext?.color.primary}
          size={size}
          onClick={() => handleSelectAll(true)}
        />
      );
    }
  };

  return (
    <StyledTableControl>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            {renderHeaderCheckBox()}
          </div>
          <StyledCounter>{`${selectedCount}/${rowsTotal}`}</StyledCounter>
          <Dropdown.Single.Basic
            width={140}
            disabled={selectedCount === 0}
            value={batchActionSelected}
            onChange={(selectedOption) => {
              const newSelectedAction = batchOptions.find((o) => o.value === selectedOption)?.value;

              if (newSelectedAction) {
                setBatchActionSelected(newSelectedAction);
              }
            }}
            options={batchOptions}
          />
          <Button
            label="apply"
            color="primary"
            inverted
            onClick={onApplyBatchAction}
            disabled={selectedCount === 0}
          />
        </div>
      </div>

      <StyledExploreFilters>
        <ExplorerTableLabelFilter filters={filters} dispatch={dispatch} />
      </StyledExploreFilters>

      <Button
        icon={<TbColumnInsertRight size={17} />}
        label="new column"
        color="primary"
        inverted={!isNewColumnOpen}
        onClick={() => setIsNewColumnOpen(!isNewColumnOpen)}
      />
      <Loader loaderStyle="beat" show={isQueryFetching} size={7} />
    </StyledTableControl>
  );
};

export default React.memo(ExploreTableControl);
