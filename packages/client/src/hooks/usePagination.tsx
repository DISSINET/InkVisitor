import { useCallback, useEffect, useRef, useState } from "react";

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
  const previousItemsLength = useRef(items.length);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const showPagination = totalItems > itemsPerPage;

  // Auto-adjust current page when items change
  useEffect(() => {
    const currentItemsLength = items.length;
    const prevItemsLength = previousItemsLength.current;

    if (currentItemsLength !== prevItemsLength) {
      // If items were removed and current page is now beyond total pages, go to last page
      if (
        currentItemsLength < prevItemsLength &&
        currentPage > totalPages &&
        totalPages > 0
      ) {
        setCurrentPage(totalPages);
      }
      // If items were added and a new page was created, go to the new page
      else if (currentItemsLength > prevItemsLength && totalPages > 1) {
        const prevTotalPages = Math.ceil(prevItemsLength / itemsPerPage);
        if (totalPages > prevTotalPages) {
          // New page was created, go to the last page (where the new item likely is)
          setCurrentPage(totalPages);
        }
        // If no new page was created, keep current page
      }
      // Only reset to 1 if this is the initial load (prevItemsLength was 0)
      else if (prevItemsLength === 0 && currentItemsLength > 0) {
        setCurrentPage(1);
      }

      previousItemsLength.current = currentItemsLength;
    }
  }, [items.length, currentPage, totalPages, itemsPerPage]);

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
