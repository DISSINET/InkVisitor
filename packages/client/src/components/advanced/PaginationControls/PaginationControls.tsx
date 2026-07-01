import { Button } from "components/basic/Button/Button";
import React from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { StyledPagination } from "./PaginationControlsStyles";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}) => {
  return (
    <StyledPagination>
      <Button
        onClick={onPreviousPage}
        icon={<IoIosArrowBack />}
        inverted
        color="greyer"
        shape="rounded-lg"
      />
      <span style={{ textAlign: "center" }}>
        {currentPage} of {totalPages}
      </span>
      <Button
        onClick={onNextPage}
        icon={<IoIosArrowForward />}
        inverted
        color="greyer"
        shape="rounded-lg"
      />
    </StyledPagination>
  );
};
