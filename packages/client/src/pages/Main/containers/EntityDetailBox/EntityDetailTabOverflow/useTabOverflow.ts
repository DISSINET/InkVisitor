import { useResizeObserver } from "hooks";
import { useMemo } from "react";
import { OVERFLOW_TAB_WIDTH } from "./EntityDetailTabOverflowStyles";

/**
 * Width (px) a tab may shrink to before the rest of the tabs move behind the
 * caret. At this size a tab carries its class bar and close button and little
 * else - the drag handle needs MIN_TAB_WIDTH_FOR_MOVE_ICON to appear.
 */
const MIN_TAB_WIDTH = 60;

/**
 * Splits a strip of tabs into the ones that fit its width and the ones behind
 * the caret. `tabGroupRef` goes on the strip.
 */
export const useTabOverflow = <T extends { id: string }>(
  entities: T[],
  selectedId: string | undefined
) => {
  const { ref: tabGroupRef, width: tabGroupWidth } = useResizeObserver<HTMLDivElement>();

  // tabs share the strip evenly, so past a certain count every label is clipped
  // to a few characters; the ones that do not fit go behind the caret instead
  const visibleTabCount = useMemo(() => {
    if (!tabGroupWidth || entities.length * MIN_TAB_WIDTH <= tabGroupWidth) {
      return entities.length;
    }
    return Math.max(1, Math.floor((tabGroupWidth - OVERFLOW_TAB_WIDTH) / MIN_TAB_WIDTH));
  }, [tabGroupWidth, entities.length]);

  // A tab selected from elsewhere - a link, a query result, the caret list -
  // can sit past the last visible slot. It borrows that slot for display and
  // the tab that held it moves behind the caret; the order the tabs are kept
  // in is untouched, so a narrower strip never rewrites it. Each visible tab
  // carries its index in `entities` so drag-and-drop still moves the right one.
  const { visibleTabs, overflowEntities } = useMemo(() => {
    const selectedIndex = entities.findIndex((e) => e.id === selectedId);

    if (selectedIndex >= visibleTabCount) {
      const lastSlot = visibleTabCount - 1;
      return {
        visibleTabs: [
          ...entities.slice(0, lastSlot).map((entity, index) => ({ entity, index })),
          { entity: entities[selectedIndex], index: selectedIndex },
        ],
        overflowEntities: entities.filter((_, i) => i >= lastSlot && i !== selectedIndex),
      };
    }

    return {
      visibleTabs: entities.slice(0, visibleTabCount).map((entity, index) => ({ entity, index })),
      overflowEntities: entities.slice(visibleTabCount),
    };
  }, [entities, visibleTabCount, selectedId]);

  return { tabGroupRef, visibleTabs, overflowEntities };
};
