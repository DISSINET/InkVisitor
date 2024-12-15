import React, { useContext } from "react";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
  MdOutlineIndeterminateCheckBox,
} from "react-icons/md";
import { TbColumnInsertRight } from "react-icons/tb";

import { IResponseQueryEntity } from "@shared/types";
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

  entities: IResponseQueryEntity[];
  rowsTotal: number;

  batchActionSelected: BatchAction;
  setBatchActionSelected: (value: BatchAction) => void;

  setRowLastClicked: (value: number) => void;

  onExport: () => void;
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

  onExport,
}) => {
  const handleSelectAll = (checked: boolean) => onAllRowsSelect(checked);

  const themeContext = useContext(ThemeContext);

  const renderHeaderCheckBox = () => {
    const size = 18;
    const isAllSelected = rowsTotal === rowsSelected.length;

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
            width={98}
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
          {
            // renderBatchAction()
            batchActionSelected === BatchAction.export_csv && (
              <Button label="export" color="query3" onClick={onExport} />
            )
          }
        </div>
        {/* {renderPaging()} */}
      </div>
      {!isNewColumnOpen && (
        <Button
          icon={<TbColumnInsertRight size={17} />}
          label="new column"
          color="query3"
          onClick={() => setIsNewColumnOpen(!isNewColumnOpen)}
        />
      )}
    </StyledTableControl>
  );
};

export default ExploreTableControl;
