import React from "react";
import { useTheme } from "hooks";

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 8px",
        fontSize: "12px",
        marginBottom: "3px",
        color: theme.color.text,
      }}
    >
      <button
        onClick={onPreviousPage}
        disabled={currentPage === 1}
        style={{
          padding: "2px 6px",
          fontSize: "11px",
          border: `1px solid ${theme.color.gray[300]}`,
          backgroundColor:
            currentPage === 1 ? theme.color.gray[200] : theme.color.white,
          color: currentPage === 1 ? theme.color.gray[500] : theme.color.text,
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
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
        disabled={currentPage === totalPages}
        style={{
          padding: "2px 6px",
          fontSize: "11px",
          border: `1px solid ${theme.color.gray[300]}`,
          backgroundColor:
            currentPage === totalPages
              ? theme.color.gray[200]
              : theme.color.white,
          color:
            currentPage === totalPages
              ? theme.color.gray[500]
              : theme.color.text,
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          borderRadius: "3px",
        }}
      >
        {">"}
      </button>
    </div>
  );
};
