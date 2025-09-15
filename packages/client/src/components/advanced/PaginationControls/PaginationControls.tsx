import React from "react";
import { useTheme } from "hooks";
import { StyledPagination } from "./PaginationControlsStyles";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  level: number;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  onPreviousPage,
  onNextPage,
  level,
}) => {
  const theme = useTheme();

  return (
    <StyledPagination>
      <button
        onClick={onPreviousPage}
        style={{
          padding: "2px 6px",
          fontSize: "11px",
          border: `1px solid ${theme.color.gray[300]}`,
          backgroundColor: theme.color.white,
          color: theme.color.text,
          cursor: "pointer",
          borderRadius: "3px",
        }}
      >
        {"<"}
      </button>
      <span>
        {currentPage} of {totalPages}
        {/* ({totalItems} total) */}
      </span>
      <button
        onClick={onNextPage}
        style={{
          padding: "2px 6px",
          fontSize: "11px",
          border: `1px solid ${theme.color.gray[300]}`,
          backgroundColor: theme.color.white,
          color: theme.color.text,
          cursor: "pointer",
          borderRadius: "3px",
        }}
      >
        {">"}
      </button>
    </StyledPagination>
  );
};
