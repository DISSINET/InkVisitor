import { useCallback, useState } from "react";

interface UsePaginationProps<T> {
  items: T[];
  itemsPerPage: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  paginatedItems: T[];
  showPagination: boolean;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
  resetPage: () => void;
}

export const usePagination = <T,>({
  items,
  itemsPerPage,
}: UsePaginationProps<T>): UsePaginationReturn<T> => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const showPagination = totalItems > itemsPerPage;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    totalItems,
    paginatedItems,
    showPagination,
    handlePreviousPage,
    handleNextPage,
    resetPage,
  };
};
