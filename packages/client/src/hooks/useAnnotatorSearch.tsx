import { useCallback, useEffect, useRef } from "react";
import { Annotator, EditMode, Occurrence } from "@inkvisitor/annotator/src/lib";

const UNICODE_WORD_CHAR_CLASS = "[\\p{L}\\p{M}\\p{N}_]";
const UNICODE_WORD_START_BOUNDARY = `(?<!${UNICODE_WORD_CHAR_CLASS})`;
const UNICODE_WORD_END_BOUNDARY = `(?!${UNICODE_WORD_CHAR_CLASS})`;

/**
 * Validates a regex pattern by attempting to construct a RegExp with it.
 * This prevents app freezes from invalid regex patterns.
 */
const isValidRegexPattern = (
  pattern: string,
  flags: string = "gu"
): boolean => {
  if (!pattern || pattern.trim().length === 0) {
    return false;
  }

  try {
    // Try to construct a RegExp with the pattern to validate syntax
    const regex = new RegExp(pattern, flags);

    // Test with a small string to catch immediate issues
    // Using a small string helps catch patterns that would cause issues
    // without triggering catastrophic backtracking on large texts
    regex.test("");

    // Additional check: detect patterns ending with unescaped |
    // which can cause catastrophic backtracking when combined with quantifiers
    // This is a known performance issue pattern
    // We check if the pattern ends with | that's not inside a character class
    // and not properly escaped
    const trimmedPattern = pattern.trim();
    if (trimmedPattern.endsWith("|") && !trimmedPattern.endsWith("\\|")) {
      // Check if the | is inside a character class by tracking [ and ]
      // This is a simple heuristic to detect character class context
      let charClassDepth = 0;
      let escapeNext = false;
      for (let i = 0; i < trimmedPattern.length - 1; i++) {
        const char = trimmedPattern[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === "\\") {
          escapeNext = true;
          continue;
        }
        if (char === "[") {
          charClassDepth++;
        } else if (char === "]") {
          charClassDepth = Math.max(0, charClassDepth - 1);
        }
      }
      // If we're not inside a character class and the pattern ends with |,
      // this could cause performance issues, especially when combined with
      // word boundaries and quantifiers
      if (charClassDepth === 0) {
        return false;
      }
    }

    return true;
  } catch (error) {
    // Pattern is invalid or causes an error
    return false;
  }
};

interface UseAnnotatorSearchParams {
  annotator: Annotator | null;
  debouncedSearchTerm: string;
  isRegexMode: boolean;
  width: number;
  isExtendToWholeWordMode: boolean;
  isWholeWordOnlyMode: boolean;
  isCaseSensitiveMode: boolean;
  annotatorMode: EditMode;
  setSearchOccurences: React.Dispatch<
    React.SetStateAction<
      | {
          segmentIndex: number;
          lineIndex: number;
          start: number;
          end: number;
        }[]
      | null
    >
  >;
  setSearchActiveOccurence: React.Dispatch<React.SetStateAction<number>>;
  setSelectedText: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Hook that handles annotator search functionality.
 * Executes search based on various modes (regex, case sensitive, whole word, etc.)
 * and reacts to width changes as well.
 */
export const useAnnotatorSearch = ({
  annotator,
  debouncedSearchTerm,
  isRegexMode,
  width,
  isExtendToWholeWordMode,
  isWholeWordOnlyMode,
  isCaseSensitiveMode,
  annotatorMode,
  setSearchOccurences,
  setSearchActiveOccurence,
  setSelectedText,
}: UseAnnotatorSearchParams): void => {
  const searchTermRef = useRef<string>("");
  const previousWidthRef = useRef<number | null>(null);

  const resetActiveOccurrenceOnSearchTermChange = useCallback(() => {
    // If the search term has changed, reset the active occurrence to 0
    if (searchTermRef.current !== debouncedSearchTerm) {
      setSearchActiveOccurence(0);
      searchTermRef.current = debouncedSearchTerm;
    }
  }, [debouncedSearchTerm, setSearchActiveOccurence]);

  const distributeSearchResults = useCallback(
    (occurrences: Occurrence[]) => {
      setSearchOccurences(occurrences);
      // If no occurrences, clear the previous highlight
      if (occurrences.length === 0) {
        setSelectedText("");
        annotator?.clearSelection();
      }
      resetActiveOccurrenceOnSearchTermChange();
    },
    [debouncedSearchTerm, setSearchOccurences, setSearchActiveOccurence]
  );

  const handleResetSearchResults = useCallback(() => {
    setSearchOccurences([]);
    resetActiveOccurrenceOnSearchTermChange();
  }, [setSearchOccurences, resetActiveOccurrenceOnSearchTermChange]);

  useEffect(() => {
    if (!annotator) {
      previousWidthRef.current = width;
      return;
    }

    if (debouncedSearchTerm.length <= 2) {
      setSearchOccurences(null);
      setSearchActiveOccurence(0);
      searchTermRef.current = "";
      setSelectedText("");
      annotator?.clearSelection();
      previousWidthRef.current = width;
      return;
    }

    const executeSearch = () => {
      // Determine the flags based on case sensitivity
      const regexFlags = isCaseSensitiveMode ? "gu" : "giu";

      // Check user's original pattern for problematic patterns when in regex mode
      // This prevents freezes from patterns like "cat|" that cause performance issues
      if (
        isRegexMode &&
        !isValidRegexPattern(debouncedSearchTerm, regexFlags)
      ) {
        handleResetSearchResults();
        return;
      }

      if (annotatorMode === EditMode.HIGHLIGHT && isExtendToWholeWordMode) {
        // If regex mode is enabled, use the user's regex pattern without escaping
        // Otherwise, escape the search term as a literal string
        const userPattern = isRegexMode
          ? debouncedSearchTerm
          : debouncedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regexPattern = `${UNICODE_WORD_START_BOUNDARY}${UNICODE_WORD_CHAR_CLASS}*${userPattern}${UNICODE_WORD_CHAR_CLASS}*${UNICODE_WORD_END_BOUNDARY}`;

        // Validate the final combined regex pattern before executing to prevent freezes
        if (!isValidRegexPattern(regexPattern, regexFlags)) {
          handleResetSearchResults();
          return;
        }

        const occurrences = annotator.search(
          regexPattern,
          true,
          isCaseSensitiveMode
        );
        distributeSearchResults(occurrences);
        return;
      } else if (annotatorMode !== EditMode.HIGHLIGHT && isWholeWordOnlyMode) {
        // If regex mode is enabled, use the user's regex pattern without escaping
        // Otherwise, escape the search term as a literal string
        const userPattern = isRegexMode
          ? debouncedSearchTerm
          : debouncedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regexPattern = `${UNICODE_WORD_START_BOUNDARY}${userPattern}${UNICODE_WORD_END_BOUNDARY}`;

        // Validate the final combined regex pattern before executing to prevent freezes
        if (!isValidRegexPattern(regexPattern, regexFlags)) {
          handleResetSearchResults();
          return;
        }

        const occurrences = annotator.search(
          regexPattern,
          true,
          isCaseSensitiveMode
        );
        distributeSearchResults(occurrences);
        return;
      }

      // For regular search (without whole word modes)
      const occurrences = annotator.search(
        debouncedSearchTerm,
        isRegexMode,
        isCaseSensitiveMode
      );
      distributeSearchResults(occurrences);
    };

    const hasWidthChanged =
      previousWidthRef.current !== null && previousWidthRef.current !== width;

    previousWidthRef.current = width;

    if (hasWidthChanged) {
      const timeoutId = window.setTimeout(() => {
        annotator.draw();
        executeSearch();
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    executeSearch();
  }, [
    annotator,
    debouncedSearchTerm,
    isRegexMode,
    width,
    isExtendToWholeWordMode,
    isWholeWordOnlyMode,
    isCaseSensitiveMode,
    annotatorMode,
    setSearchOccurences,
    setSearchActiveOccurence,
    setSelectedText,
  ]);
};
