import { Explore } from "@inkvisitor/shared/types/query";
import { Button, ButtonGroup, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import { useTheme } from "hooks";
import React, { useMemo, useState } from "react";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
  MdOutlineIndeterminateCheckBox,
} from "react-icons/md";
import {
  StyledBatchMessage,
  StyledBatchSection,
  StyledBatchSectionLabel,
  StyledBatchWrapper,
  StyledSelectAll,
  StyledSelectAllLabel,
  StyledSelectColumn,
  StyledSelectColumnLabel,
} from "./styles";

interface BatchActionExportCsvProps {
  selectedEntityIds: string[];
  columns: Explore.IExploreColumn[];
  onExport: (selectedColumnIds: string[]) => void;
  onClose: () => void;
}

const checkboxSize = 18;

export const BatchActionExportCsv: React.FC<BatchActionExportCsvProps> = ({
  selectedEntityIds,
  columns,
  onExport,
  onClose,
}) => {
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(columns.map((c) => c.id));

  const handleToggleColumn = (columnId: string) => {
    setSelectedColumnIds((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId],
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
    return `Export ${selectedEntityIds.length} entities with ${selectedColumnIds.length} of ${columns.length} columns.`;
  }, [selectedEntityIds.length, selectedColumnIds.length, columns.length]);

  const theme = useTheme();

  const renderCheckboxIcon = (checked: boolean) =>
    checked ? (
      <MdOutlineCheckBox size={checkboxSize} color={theme.color.primary} />
    ) : (
      <MdOutlineCheckBoxOutlineBlank size={checkboxSize} color={theme.color.primary} />
    );

  const renderSelectAllIcon = () => {
    if (isAllSelected) {
      return <MdOutlineCheckBox size={checkboxSize} color={theme.color.primary} />;
    }
    if (isSomeSelected) {
      return <MdOutlineIndeterminateCheckBox size={checkboxSize} color={theme.color.primary} />;
    }
    return <MdOutlineCheckBoxOutlineBlank size={checkboxSize} color={theme.color.primary} />;
  };

  return (
    <Modal showModal onClose={onClose} width="fat">
      <ModalHeader
        title={`Export as TSV (${selectedEntityIds.length} entities)`}
        onClose={onClose}
      />
      <ModalContent column enableScroll>
        <StyledBatchWrapper>
          <StyledBatchSection>
            <StyledBatchSectionLabel>Columns to export</StyledBatchSectionLabel>

            <StyledSelectAll onClick={handleToggleAll}>
              {renderSelectAllIcon()}
              <StyledSelectAllLabel>
                {isAllSelected ? "Deselect all" : "Select all"}
              </StyledSelectAllLabel>
            </StyledSelectAll>

            {columns.map((column) => {
              const isSelected = selectedColumnIds.includes(column.id);
              return (
                <StyledSelectColumn key={column.id} onClick={() => handleToggleColumn(column.id)}>
                  {renderCheckboxIcon(isSelected)}
                  <StyledSelectColumnLabel>{column.name}</StyledSelectColumnLabel>
                </StyledSelectColumn>
              );
            })}
          </StyledBatchSection>

          <StyledBatchMessage>{message}</StyledBatchMessage>
        </StyledBatchWrapper>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            label="Cancel"
            color="greyer"
            inverted
            noBackground
            noBorder
            onClick={onClose}
          />
          <Button
            label="Export"
            color="primary"
            onClick={() => onExport(selectedColumnIds)}
            disabled={selectedColumnIds.length === 0}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
