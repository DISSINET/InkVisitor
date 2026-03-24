import React, { useContext } from "react";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
  MdOutlineIndeterminateCheckBox,
} from "react-icons/md";
import { TbColumnInsertRight } from "react-icons/tb";

import { Button } from "components";
import Dropdown from "components/advanced";

import { ThemeContext } from "styled-components";
import { StyledCounter, StyledTableControl } from "./ExplorerTableStyles";
import { BatchAction, batchOptions } from "./types";

interface ExploreTableControlProps {
  isNewColumnOpen: boolean;
  setIsNewColumnOpen: (value: boolean) => void;

  rowsSelected: number[];
  onAllRowsSelect: (checked: boolean) => void;

  rowsTotal: number;

  batchActionSelected: BatchAction;
  setBatchActionSelected: (value: BatchAction) => void;

  setRowLastClicked: (value: number) => void;

  onApplyBatchAction: () => void;
}

const ExploreTableControl: React.FC<ExploreTableControlProps> = ({
  isNewColumnOpen,
  setIsNewColumnOpen,

  rowsSelected,
  onAllRowsSelect,

  rowsTotal,

  batchActionSelected,
  setBatchActionSelected,

  setRowLastClicked,

  onApplyBatchAction,
}) => {
  const handleSelectAll = (checked: boolean) => onAllRowsSelect(checked);

  const themeContext = useContext(ThemeContext);

  const renderHeaderCheckBox = () => {
    const size = 18;
    const isAllSelected = rowsTotal > 0 && rowsTotal === rowsSelected.length;

    if (isAllSelected) {
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
    } else if (rowsSelected.length > 0) {
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
          <StyledCounter>{`${rowsSelected.length}/${rowsTotal}`}</StyledCounter>
          <Dropdown.Single.Basic
            width={140}
            disabled={rowsSelected.length === 0}
            value={batchActionSelected}
            onChange={(selectedOption) => {
              const newSelectedAction = batchOptions.find(
                (o) => o.value === selectedOption
              )?.value;

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
            disabled={rowsSelected.length === 0}
          />
        </div>
      </div>

      <Button
        icon={<TbColumnInsertRight size={17} />}
        label="new column"
        color="primary"
        inverted={!isNewColumnOpen}
        onClick={() => setIsNewColumnOpen(!isNewColumnOpen)}
      />
    </StyledTableControl>
  );
};

export default React.memo(ExploreTableControl);
