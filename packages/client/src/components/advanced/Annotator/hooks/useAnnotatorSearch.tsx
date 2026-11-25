import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Annotator, EditMode, Occurrence } from "@inkvisitor/annotator/src/lib";
import { useDebouncedCallback } from "hooks";
import { clampActiveOccurenceIndex } from "../AnnotatorSearchLine/replaceUtils";

/** Shorter queries match too much of a document to be worth running. */
export const MIN_SEARCH_TERM_LENGTH = 3;
/**
 * Longer queries are not run: every search compiles the whole term into one
 * regular expression, and the browser throws on one past its size limit.
 */
export const MAX_SEARCH_TERM_LENGTH = 200;

/**
 * How long the text has to stay unedited before it is searched again. A search
 * walks the whole document, which is too slow to run on every keystroke.
 */
export const SEARCH_REFRESH_AFTER_EDIT_MS = 500;

export const isSearchTermInRange = (term: string): boolean =>
  term.length >= MIN_SEARCH_TERM_LENGTH && term.length <= MAX_SEARCH_TERM_LENGTH;

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
    React.SetStateAction<Occurrence[] | null>
  >;
  setSearchActiveOccurence: React.Dispatch<React.SetStateAction<number>>;
  setSelectedText: React.Dispatch<React.SetStateAction<string>>;
  /**
   * True while the hits were searched again under a text edit and the active
   * one is not selected in the text. See {@link AnnotatorSearch.dropHitsOnEdit}.
   */
  setIsOccurenceSelectionDeferred: React.Dispatch<React.SetStateAction<boolean>>;
}

interface AnnotatorSearch {
  /**
   * Searches the current text again. For a caller that changed the text itself
   * and wants the active hit selected afterwards (replace).
   */
  refreshSearch: () => void;
  /**
   * To call on every text change the user makes by hand (typing, paste, undo,
   * discard) or that arrives from the server. A hit is a position in the text,
   * so the hits are dropped at once, leaving Next, Previous and Replace nothing
   * outdated to act on, and searched again when the editing pauses. Selecting
   * the active hit then would take the caret from the place being edited, so
   * its selection is deferred until the user steps to it.
   *
   * Does nothing in highlight mode. Its text hides the tags, so the anchor
   * changes made there move no hit, and selecting a hit on every refetch would
   * pull the view away from what the user is anchoring. Text edited elsewhere
   * and refetched in highlight mode therefore leaves the hits outdated until
   * the search runs again.
   *
   * Keeps one identity, so a callback registered once on the annotator can
   * call it.
   */
  dropHitsOnEdit: () => void;
}

/**
 * Hook that handles annotator search functionality.
 * Executes search based on various modes (regex, case sensitive, whole word, etc.)
 * and reacts to width changes and text edits as well.
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
  setIsOccurenceSelectionDeferred,
}: UseAnnotatorSearchParams): AnnotatorSearch => {
  const searchTermRef = useRef<string>("");
  const previousWidthRef = useRef<number | null>(null);

  // The text is not a dependency of the search, so a change of it reaches the
  // search through this key.
  const [searchRefreshKey, setSearchRefreshKey] = useState<number>(0);
  const refreshSearch = useCallback(() => setSearchRefreshKey((key) => key + 1), []);
  const refreshSearchAfterEdit = useDebouncedCallback(refreshSearch, SEARCH_REFRESH_AFTER_EDIT_MS);

  const annotatorRef = useRef<Annotator | null>(annotator);
  useLayoutEffect(() => {
    annotatorRef.current = annotator;
  });

  const dropHitsOnEdit = useCallback(() => {
    if (annotatorRef.current?.text.mode === EditMode.HIGHLIGHT) {
      return;
    }
    setSearchOccurences(null);
    setIsOccurenceSelectionDeferred(true);
    refreshSearchAfterEdit();
  }, [setSearchOccurences, setIsOccurenceSelectionDeferred, refreshSearchAfterEdit]);

  // A search the user changed shows its hit again.
  useEffect(() => {
    setIsOccurenceSelectionDeferred(false);
  }, [
    debouncedSearchTerm,
    isRegexMode,
    isExtendToWholeWordMode,
    isWholeWordOnlyMode,
    isCaseSensitiveMode,
    annotatorMode,
    setIsOccurenceSelectionDeferred,
  ]);

  const resetActiveOccurrenceOnSearchTermChange = useCallback(() => {
    // If the search term has changed, reset the active occurrence to 0
    if (searchTermRef.current !== debouncedSearchTerm) {
      setSearchActiveOccurence(0);
      searchTermRef.current = debouncedSearchTerm;
    }
  }, [debouncedSearchTerm, setSearchActiveOccurence]);

  const distributeSearchResults = useCallback(
    (occurrences: Occurrence[]) => {
      const termChanged = searchTermRef.current !== debouncedSearchTerm;
      setSearchOccurences(occurrences);
      // If no occurrences, clear the previous highlight
      if (occurrences.length === 0) {
        setSelectedText("");
        // Only clear selection (and thus reset cursor) when the search term itself changed.
        // Avoid clearing on reruns caused solely by annotatorMode changes.
        if (termChanged) {
          annotator?.clearSelection();
        }
      }
      resetActiveOccurrenceOnSearchTermChange();

      if (!termChanged) {
        // A rerun over text that changed underneath the search (replace) can
        // return fewer occurrences than the active index addresses. A term
        // change already went back to 0 above.
        setSearchActiveOccurence((active) =>
          clampActiveOccurenceIndex(active, occurrences.length)
        );
      }
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

    if (!isSearchTermInRange(debouncedSearchTerm)) {
      const termChanged = searchTermRef.current !== debouncedSearchTerm;
      setSearchOccurences(null);
      setSearchActiveOccurence(0);
      searchTermRef.current = debouncedSearchTerm;
      setSelectedText("");
      // Only clear selection (and thus reset cursor) when the search term actually changed.
      // Prevent cursor disappearance on pure annotatorMode changes.
      if (termChanged) {
        annotator?.clearSelection();
      }
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
    searchRefreshKey,
    setSearchOccurences,
    setSearchActiveOccurence,
    setSelectedText,
  ]);

  return { refreshSearch, dropHitsOnEdit };
};
