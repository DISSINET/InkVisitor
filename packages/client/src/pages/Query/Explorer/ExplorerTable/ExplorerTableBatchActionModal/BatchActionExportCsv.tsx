import { IEntity } from "@shared/types";
import { Explore } from "@shared/types/query";
import theme from "Theme/theme";
import React, { useMemo, useState } from "react";
import { Button } from "components";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
  MdOutlineIndeterminateCheckBox,
} from "react-icons/md";
import {
  batchWrapperStyle,
  batchSectionStyle,
  batchFooterStyle,
  StyledBatchSectionLabel,
  StyledBatchMessage,
} from "./styles";

interface BatchActionExportCsvProps {
  selectedEntities: IEntity[];
  columns: Explore.IExploreColumn[];
  onExport: (selectedColumnIds: string[]) => void;
  onClose: () => void;
}

const checkboxSize = 18;

export const BatchActionExportCsv: React.FC<BatchActionExportCsvProps> = ({
  selectedEntities,
  columns,
  onExport,
  onClose,
}) => {
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(
    columns.map((c) => c.id)
  );

  const handleToggleColumn = (columnId: string) => {
    setSelectedColumnIds((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleToggleAll = () => {
    if (selectedColumnIds.length === columns.length) {
      setSelectedColumnIds([]);
    } else {
      setSelectedColumnIds(columns.map((c) => c.id));
    }
  };

  const isAllSelected = selectedColumnIds.length === columns.length;
  const isSomeSelected = selectedColumnIds.length > 0 && !isAllSelected;

  const message = useMemo(() => {
    return `Export ${selectedEntities.length} entities with ${selectedColumnIds.length} of ${columns.length} columns.`;
  }, [selectedEntities.length, selectedColumnIds.length, columns.length]);

  const renderCheckboxIcon = (checked: boolean) =>
    checked ? (
      <MdOutlineCheckBox size={checkboxSize} color={theme.color.primary} />
    ) : (
      <MdOutlineCheckBoxOutlineBlank
        size={checkboxSize}
        color={theme.color.primary}
      />
    );

  const renderSelectAllIcon = () => {
    if (isAllSelected) {
      return (
        <MdOutlineCheckBox size={checkboxSize} color={theme.color.primary} />
      );
    }
    if (isSomeSelected) {
      return (
        <MdOutlineIndeterminateCheckBox
          size={checkboxSize}
          color={theme.color.primary}
        />
      );
    }
    return (
      <MdOutlineCheckBoxOutlineBlank
        size={checkboxSize}
        color={theme.color.primary}
      />
    );
  };

  return (
    <div style={batchWrapperStyle}>
      <div style={batchSectionStyle}>
        <StyledBatchSectionLabel>Columns to export</StyledBatchSectionLabel>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            padding: "0.3rem 0",
            borderBottom: `1px solid ${theme.color.grey}`,
          }}
          onClick={handleToggleAll}
        >
          {renderSelectAllIcon()}
          <span
            style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.bold,
            }}
          >
            {isAllSelected ? "Deselect all" : "Select all"}
          </span>
        </div>

        {columns.map((column) => {
          const isSelected = selectedColumnIds.includes(column.id);
          return (
            <div
              key={column.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                padding: "0.2rem 0",
              }}
              onClick={() => handleToggleColumn(column.id)}
            >
              {renderCheckboxIcon(isSelected)}
              <span style={{ fontSize: theme.fontSize.sm }}>{column.name}</span>
            </div>
          );
        })}
      </div>

      <StyledBatchMessage>{message}</StyledBatchMessage>

      <div style={batchFooterStyle}>
        <Button label="Cancel" color="greyer" inverted onClick={onClose} />
        <Button
          label="Export"
          color="primary"
          onClick={() => onExport(selectedColumnIds)}
          disabled={selectedColumnIds.length === 0}
        />
      </div>
    </div>
  );
};
