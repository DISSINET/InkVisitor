import React from "react";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
  MdOutlineIndeterminateCheckBox,
} from "react-icons/md";
import { TbColumnInsertRight } from "react-icons/tb";

import { IResponseQueryEntity } from "@shared/types";
import { Button } from "components";
import Dropdown from "components/advanced";

import { StyledCounter, StyledTableControl } from "./ExplorerTableStyles";
import { BatchAction, batchOptions } from "./types";

interface ExploreTableControlProps {
  isNewColumnOpen: boolean;
  setIsNewColumnOpen: (value: boolean) => void;

  selectedRows: string[];
  setSelectedRows: (value: string[]) => void;

  entities: IResponseQueryEntity[];

  batchActionSelected: BatchAction;
  setBatchActionSelected: (value: BatchAction) => void;

  setLastClickedIndex: (value: number) => void;
}

const ExploreTableControl: React.FC<ExploreTableControlProps> = ({
  isNewColumnOpen,
  setIsNewColumnOpen,

  selectedRows,
  setSelectedRows,

  entities,

  batchActionSelected,
  setBatchActionSelected,

  setLastClickedIndex,
}) => {
  const handleSelectAll = (checked: boolean) =>
    checked
      ? setSelectedRows(entities.map((queryEntity) => queryEntity.entity.id))
      : setSelectedRows([]);

  const renderHeaderCheckBox = () => {
    const size = 18;
    const isAllSelected =
      entities.length > 0 && selectedRows.length === entities.length;

    if (isAllSelected) {
      return (
        <MdOutlineCheckBox
          size={size}
          onClick={() => {
            handleSelectAll(false);
            setLastClickedIndex(-1);
          }}
        />
      );
    } else if (selectedRows.length > 0) {
      // some rows selected
      return (
        <MdOutlineIndeterminateCheckBox
          size={size}
          onClick={() => {
            handleSelectAll(false);
            setLastClickedIndex(-1);
          }}
        />
      );
    } else {
      return (
        <MdOutlineCheckBoxOutlineBlank
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
          {renderHeaderCheckBox()}
          {selectedRows.length > 0 && (
            <StyledCounter>{`${selectedRows.length}/${entities.length}`}</StyledCounter>
          )}
          <Dropdown.Single.Basic
            width={98}
            disabled={selectedRows.length === 0}
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
