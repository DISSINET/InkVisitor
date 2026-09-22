import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "redux/hooks";

/**
 * Where the two draggable edges of the three panels sit.
 *
 * `LayoutSeparatorVertical` is deliberately page-agnostic — it takes positions
 * and a resolver — so this page needs none of the redux slices the Main page
 * keeps for its own four panels. The positions live here and persist per
 * browser, which is the right scope for a layout preference.
 */

const STORAGE_KEY = "geocodingPanelSeparators";

const LIST_MIN = 260;
const MAP_MIN = 320;
const SUGGESTIONS_MIN = 320;

/** Proportions to start from, close to the design's own. */
const LIST_SHARE = 0.24;
const SUGGESTIONS_SHARE = 0.28;

export interface GeocodingPanels {
  listWidth: number;
  mapWidth: number;
  suggestionsWidth: number;
  /** x of the list/map edge and of the map/suggestions edge. */
  separators: { list: number; suggestions: number };
  resolveListDrag: (x: number) => number;
  resolveSuggestionsDrag: (x: number) => number;
  setListSeparator: (x: number) => void;
  setSuggestionsSeparator: (x: number) => void;
}

export const useGeocodingPanels = (): GeocodingPanels => {
  const layoutWidth = useAppSelector((state) => state.layout.layoutWidth);
  const [stored, setStored] = useState<{ list: number; suggestions: number } | null>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const separators = useMemo(() => {
    if (!layoutWidth) {
      return { list: LIST_MIN, suggestions: LIST_MIN + MAP_MIN };
    }
    const fallback = {
      list: Math.max(LIST_MIN, Math.round(layoutWidth * LIST_SHARE)),
      suggestions: Math.round(layoutWidth * (1 - SUGGESTIONS_SHARE)),
    };
    if (!stored) {
      return fallback;
    }
    // a window narrower than the stored layout would otherwise leave a panel
    // at a width it cannot honour
    const list = Math.min(Math.max(stored.list, LIST_MIN), layoutWidth - MAP_MIN - SUGGESTIONS_MIN);
    const suggestions = Math.min(
      Math.max(stored.suggestions, list + MAP_MIN),
      layoutWidth - SUGGESTIONS_MIN,
    );
    return { list, suggestions };
  }, [stored, layoutWidth]);

  useEffect(() => {
    if (!stored) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* a browser refusing site data keeps the default proportions */
    }
  }, [stored]);

  const resolveListDrag = useCallback(
    (x: number) => Math.min(Math.max(x, LIST_MIN), separators.suggestions - MAP_MIN),
    [separators.suggestions],
  );
  const resolveSuggestionsDrag = useCallback(
    (x: number) =>
      Math.min(Math.max(x, separators.list + MAP_MIN), layoutWidth - SUGGESTIONS_MIN),
    [separators.list, layoutWidth],
  );

  return {
    listWidth: separators.list,
    mapWidth: separators.suggestions - separators.list,
    suggestionsWidth: layoutWidth - separators.suggestions,
    separators,
    resolveListDrag,
    resolveSuggestionsDrag,
    setListSeparator: (x) => setStored({ ...separators, list: resolveListDrag(x) }),
    setSuggestionsSeparator: (x) => setStored({ ...separators, suggestions: resolveSuggestionsDrag(x) }),
  };
};
