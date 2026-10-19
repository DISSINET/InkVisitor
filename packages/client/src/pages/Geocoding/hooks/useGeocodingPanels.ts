import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useAppSelector } from "redux/hooks";
import { COLLAPSED_PANEL_WIDTH } from "Theme/constants";
import { animatePanelWidthVars, setPanelWidthVars } from "utils/layoutTransition";

/**
 * Where the two draggable edges of the three panels sit, and whether the two
 * side panels are folded away.
 *
 * `LayoutSeparatorVertical` is deliberately page-agnostic — it takes positions
 * and a resolver — so this page needs none of the redux slices the Main page
 * keeps for its own four panels. The positions live here and persist per
 * browser, which is the right scope for a layout preference.
 *
 * A folded panel is a strip of COLLAPSED_PANEL_WIDTH and the map takes the
 * rest; the folded panel's separator position is kept, not shown, so it opens
 * back to where it was.
 */

const STORAGE_KEY = "geocodingPanelSeparators";
const EXPANDED_STORAGE_KEY = "geocodingPanelsExpanded";

const LIST_MIN = 260;
const MAP_MIN = 320;
const SUGGESTIONS_MIN = 320;

/** Proportions to start from, close to the design's own. */
const LIST_SHARE = 0.24;
const SUGGESTIONS_SHARE = 0.28;

type Expanded = { list: boolean; suggestions: boolean };

const readStorage = <T>(key: string): T | null => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* a browser refusing site data keeps the default layout */
  }
};

export interface GeocodingPanels {
  listWidth: number;
  mapWidth: number;
  suggestionsWidth: number;
  listExpanded: boolean;
  suggestionsExpanded: boolean;
  toggleList: () => void;
  toggleSuggestions: () => void;
  /**
   * The map canvas spans every width the map can take, so a fold or a drag
   * slides the panels over it rather than resizing it. `mapCovered` is how much
   * of it the open side panels hide, which the camera has to centre around.
   */
  mapCanvasWidth: number;
  mapCovered: { left: number; right: number };
  /** x of the list/map edge and of the map/suggestions edge. */
  separators: { list: number; suggestions: number };
  resolveListDrag: (x: number) => number;
  resolveSuggestionsDrag: (x: number) => number;
  setListSeparator: (x: number) => void;
  setSuggestionsSeparator: (x: number) => void;
}

export const useGeocodingPanels = (): GeocodingPanels => {
  const layoutWidth = useAppSelector((state) => state.layout.layoutWidth);
  const [stored, setStored] = useState<{ list: number; suggestions: number } | null>(() =>
    readStorage(STORAGE_KEY)
  );
  const [expanded, setExpanded] = useState<Expanded>(
    () => readStorage<Expanded>(EXPANDED_STORAGE_KEY) ?? { list: true, suggestions: true }
  );

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
    const list = Math.min(
      Math.max(stored.list, LIST_MIN),
      layoutWidth - MAP_MIN - (expanded.suggestions ? SUGGESTIONS_MIN : COLLAPSED_PANEL_WIDTH)
    );
    const suggestions = Math.min(
      Math.max(stored.suggestions, (expanded.list ? list : COLLAPSED_PANEL_WIDTH) + MAP_MIN),
      layoutWidth - SUGGESTIONS_MIN
    );
    return { list, suggestions };
  }, [stored, layoutWidth, expanded]);

  useEffect(() => {
    if (stored) {
      writeStorage(STORAGE_KEY, stored);
    }
  }, [stored]);

  useEffect(() => writeStorage(EXPANDED_STORAGE_KEY, expanded), [expanded]);

  // the map's edges, wherever a folded neighbour leaves them
  const mapLeft = expanded.list ? separators.list : COLLAPSED_PANEL_WIDTH;
  const mapRight = expanded.suggestions
    ? separators.suggestions
    : layoutWidth - COLLAPSED_PANEL_WIDTH;

  // The panels render from these variables. A separator drag overwrites them
  // directly for the duration of the drag and lands here on drop; a fold
  // springs them to the new widths.
  useLayoutEffect(() => {
    animatePanelWidthVars([mapLeft, mapRight - mapLeft, layoutWidth - mapRight], "geocodingPage");
  }, [mapLeft, mapRight, layoutWidth]);

  // Each drag paints the two panels either side of its separator; the third
  // keeps its width, since neither separator pushes the other.
  const resolveListDrag = useCallback(
    (x: number) => {
      const list = Math.min(Math.max(x, LIST_MIN), mapRight - MAP_MIN);
      setPanelWidthVars([list, mapRight - list, layoutWidth - mapRight], "geocodingPage");
      return list;
    },
    [mapRight, layoutWidth]
  );
  const resolveSuggestionsDrag = useCallback(
    (x: number) => {
      const suggestions = Math.min(Math.max(x, mapLeft + MAP_MIN), layoutWidth - SUGGESTIONS_MIN);
      setPanelWidthVars(
        [mapLeft, suggestions - mapLeft, layoutWidth - suggestions],
        "geocodingPage"
      );
      return suggestions;
    },
    [mapLeft, layoutWidth]
  );

  return {
    listWidth: mapLeft,
    mapWidth: mapRight - mapLeft,
    suggestionsWidth: layoutWidth - mapRight,
    mapCanvasWidth: Math.max(0, layoutWidth - 2 * COLLAPSED_PANEL_WIDTH),
    mapCovered: {
      left: mapLeft - COLLAPSED_PANEL_WIDTH,
      right: layoutWidth - COLLAPSED_PANEL_WIDTH - mapRight,
    },
    listExpanded: expanded.list,
    suggestionsExpanded: expanded.suggestions,
    toggleList: () => setExpanded((current) => ({ ...current, list: !current.list })),
    toggleSuggestions: () =>
      setExpanded((current) => ({ ...current, suggestions: !current.suggestions })),
    separators,
    resolveListDrag,
    resolveSuggestionsDrag,
    setListSeparator: (x) => setStored({ ...separators, list: resolveListDrag(x) }),
    setSuggestionsSeparator: (x) =>
      setStored({ ...separators, suggestions: resolveSuggestionsDrag(x) }),
  };
};
