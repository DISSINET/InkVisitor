import { useCallback, useEffect, useRef, useState } from "react";

interface UsePaginationProps<T> {
  items: T[];
  itemsPerPage: number;
  level?: number; // Add level parameter to detect first level
  // Index of an item that must remain visible (e.g. the selected territory or
  // an ancestor on its path). When >= 0, pagination jumps to its page so the
  // node actually renders and can be expanded / scrolled to.
  targetIndex?: number;
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
  level = 0,
  targetIndex = -1,
}: UsePaginationProps<T>): UsePaginationReturn<T> => {
  const [currentPage, setCurrentPage] = useState(1);
  const previousItemsLength = useRef(items.length);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const showPagination = totalItems > itemsPerPage && level >= 1;

  const hasTarget = targetIndex >= 0 && targetIndex < totalItems;

  // Auto-adjust current page when items change
  useEffect(() => {
    const currentItemsLength = items.length;
    const prevItemsLength = previousItemsLength.current;

    if (currentItemsLength !== prevItemsLength) {
      previousItemsLength.current = currentItemsLength;

      // A specific item must stay visible (e.g. the selected territory or an
      // ancestor on its path) - the targetIndex effect owns the page here.
      if (hasTarget) {
        return;
      }

      // If items were removed and current page is now beyond total pages, go to last page
      if (
        currentItemsLength < prevItemsLength &&
        currentPage > totalPages &&
        totalPages > 0
      ) {
        setCurrentPage(totalPages);
      }
      // If items were added, go to the last page
      // But only for levels 1 and above, and not on initial load
      else if (
        currentItemsLength > prevItemsLength &&
        totalPages > 1 &&
        level >= 1 &&
        prevItemsLength > 0 // Ensure this is not the initial load
      ) {
        // Always go to the last page when new items are added
        setCurrentPage(totalPages);
      }
      // Only reset to 1 if this is the initial load (prevItemsLength was 0)
      else if (prevItemsLength === 0 && currentItemsLength > 0) {
        setCurrentPage(1);
      }
    }
  }, [items.length, currentPage, totalPages, itemsPerPage, level, hasTarget]);

  // Jump to the page holding the target item. Runs both on initial load (when
  // the target first appears) and on later navigation while the list length is
  // unchanged (e.g. "open territory in tree" after the tree is already built).
  useEffect(() => {
    if (hasTarget) {
      setCurrentPage(Math.floor(targetIndex / itemsPerPage) + 1);
    }
  }, [hasTarget, targetIndex, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => {
      if (prev === 1) {
        // If on first page, go to last page
        return totalPages;
      }
      return prev - 1;
    });
  }, [totalPages]);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => {
      if (prev === totalPages) {
        // If on last page, go to first page
        return 1;
      }
      return prev + 1;
    });
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
