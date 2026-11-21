import { Button, Checkbox } from "components";
import React from "react";
import { DocumentSortField, DocumentSortState } from "./types";
import {
  StyledActionsHeaderCell,
  StyledBulkExportCount,
  StyledBulkExportWrap,
  StyledExportIcon,
  StyledGithubHeaderCell,
  StyledGridHeader,
  StyledSelectHeaderCell,
  StyledSortableHeaderCell,
  StyledSortIndicator,
} from "./DocumentsPageStyles";

type DocumentsTableHeaderProps = {
  sort: DocumentSortState;
  onSort: (field: DocumentSortField) => void;
  // exportable documents only - rows the user may not manage are never selected
  allSelected: boolean;
  someSelected: boolean;
  hasExportableDocuments: boolean;
  onToggleSelectAll: (selected: boolean) => void;
  selectedCount: number;
  onExportSelected: () => void;
  // the GitHub column is drawn only for users who may commit documents
  showGithub: boolean;
};

const SortableHeader: React.FC<{
  field: DocumentSortField;
  label: string;
  sort: DocumentSortState;
  onSort: (field: DocumentSortField) => void;
}> = ({ field, label, sort, onSort }) => {
  const isActive = sort?.field === field;
  const title = !isActive
    ? `Sort by ${label}`
    : sort.direction === "asc"
      ? `Sort ${label} descending`
      : `Clear sort`;

  return (
    <StyledSortableHeaderCell
      type="button"
      $active={isActive}
      onClick={() => onSort(field)}
      title={title}
    >
      {label}
      {isActive && (
        <StyledSortIndicator aria-hidden>
          {sort.direction === "asc" ? "↑" : "↓"}
        </StyledSortIndicator>
      )}
    </StyledSortableHeaderCell>
  );
};

export const DocumentsTableHeader: React.FC<DocumentsTableHeaderProps> = ({
  sort,
  onSort,
  allSelected,
  someSelected,
  hasExportableDocuments,
  onToggleSelectAll,
  selectedCount,
  onExportSelected,
  showGithub,
}) => (
  <StyledGridHeader>
    <StyledSelectHeaderCell>
      {hasExportableDocuments && (
        <Checkbox
          value={allSelected}
          indeterminate={someSelected && !allSelected}
          onChangeFn={(value) => onToggleSelectAll(value)}
          tooltipLabel={allSelected ? "deselect all documents" : "select all documents"}
          noFill
        />
      )}
    </StyledSelectHeaderCell>
    <SortableHeader field="documentName" label="Name" sort={sort} onSort={onSort} />
    <StyledActionsHeaderCell>
      <StyledBulkExportWrap>
        <Button
          icon={<StyledExportIcon />}
          shape="square"
          color="info"
          disabled={selectedCount === 0}
          tooltipLabel={
            selectedCount === 0
              ? "select documents to export"
              : selectedCount > 1
                ? `set up the export of ${selectedCount} selected documents`
                : "set up the export of the selected document"
          }
          onClick={onExportSelected}
        />
        {selectedCount > 0 && <StyledBulkExportCount>{selectedCount}</StyledBulkExportCount>}
      </StyledBulkExportWrap>
    </StyledActionsHeaderCell>
    <SortableHeader field="resourceLabel" label="Label" sort={sort} onSort={onSort} />
    {showGithub && <StyledGithubHeaderCell>GitHub</StyledGithubHeaderCell>}
    <SortableHeader field="entityCount" label="Entities" sort={sort} onSort={onSort} />
  </StyledGridHeader>
);
