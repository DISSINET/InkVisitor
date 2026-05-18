import React from "react";
import { DocumentSortField, DocumentSortState } from "./types";
import {
  StyledGridHeader,
  StyledHeaderCell,
  StyledSortableHeaderCell,
  StyledSortIndicator,
} from "./DocumentsPageStyles";

type DocumentsTableHeaderProps = {
  sort: DocumentSortState;
  onSort: (field: DocumentSortField) => void;
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

export const DocumentsTableHeader: React.FC<DocumentsTableHeaderProps> = ({ sort, onSort }) => (
  <StyledGridHeader>
    <SortableHeader field="documentName" label="Name" sort={sort} onSort={onSort} />
    <StyledHeaderCell></StyledHeaderCell>
    <SortableHeader field="resourceLabel" label="Label" sort={sort} onSort={onSort} />
    <SortableHeader field="anchorCount" label="Anchors" sort={sort} onSort={onSort} />
  </StyledGridHeader>
);
