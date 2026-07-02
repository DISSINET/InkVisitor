import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setFirstPanelExpanded } from "redux/features/layout/mainPage/firstPanelExpandedSlice";
import { setSecondPanelExpanded } from "redux/features/layout/mainPage/secondPanelExpandedSlice";
import { setThirdPanelExpanded } from "redux/features/layout/mainPage/thirdPanelExpandedSlice";
import { setFourthPanelExpanded } from "redux/features/layout/mainPage/fourthPanelExpandedSlice";
import { setPanelWidths } from "redux/features/layout/mainPage/panelWidthsSlice";
import {
  COLLAPSED_PANEL_WIDTH,
  FIRST_PANEL_MIN_WIDTH,
  FOURTH_PANEL_MIN_WIDTH,
  SECOND_PANEL_MIN_WIDTH,
  THIRD_PANEL_MIN_WIDTH,
} from "Theme/constants";
import { floorNumberToOneDecimal } from "utils/utils";

interface SeparatorState {
  position: number;
  setPosition: (x: number) => void;
}

interface UsePanelTogglesParams {
  treeSeparator: SeparatorState;
  centerSeparator: SeparatorState;
  searchSeparator: SeparatorState;
  onePercentOfLayoutWidth: number;
}

export function usePanelToggles({
  treeSeparator,
  centerSeparator,
  searchSeparator,
  onePercentOfLayoutWidth,
}: UsePanelTogglesParams) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const layoutWidth = useAppSelector((state) => state.layout.layoutWidth);
  const panelWidths = useAppSelector((state) => state.layout.mainPage.panelWidths);
  const firstPanelExpanded = useAppSelector((state) => state.layout.mainPage.firstPanelExpanded);
  const secondPanelExpanded = useAppSelector((state) => state.layout.mainPage.secondPanelExpanded);
  const thirdPanelExpanded = useAppSelector((state) => state.layout.mainPage.thirdPanelExpanded);
  const fourthPanelExpanded = useAppSelector((state) => state.layout.mainPage.fourthPanelExpanded);

  const persistSeparator = (key: string, position: number) => {
    localStorage.setItem(
      key,
      floorNumberToOneDecimal(position / onePercentOfLayoutWidth).toString(),
    );
  };

  const updateSeparator = (
    separator: SeparatorState,
    key: string,
    currentPos: number,
    newPos: number,
  ) => {
    if (newPos !== currentPos) {
      separator.setPosition(newPos);
      persistSeparator(key, newPos);
    }
  };

  const toggleFirstPanel = () => {
    if (firstPanelExpanded) {
      dispatch(setFirstPanelExpanded(false));
      return;
    }

    dispatch(setFirstPanelExpanded(true));

    let newCenterPos = centerSeparator.position;
    let newSearchPos = searchSeparator.position;
    let needsUpdate = false;

    if (newCenterPos - treeSeparator.position < SECOND_PANEL_MIN_WIDTH) {
      newCenterPos = treeSeparator.position + SECOND_PANEL_MIN_WIDTH;
      needsUpdate = true;

      if (newSearchPos - newCenterPos < THIRD_PANEL_MIN_WIDTH) {
        newSearchPos = newCenterPos + THIRD_PANEL_MIN_WIDTH;
      }
    }

    if (needsUpdate) {
      centerSeparator.setPosition(newCenterPos);
      persistSeparator("mainPageCenterSeparatorXPosition", newCenterPos);

      updateSeparator(
        searchSeparator,
        "mainPageSearchSeparatorXPosition",
        searchSeparator.position,
        newSearchPos,
      );

      dispatch(
        setPanelWidths([
          panelWidths[0],
          floorNumberToOneDecimal(newCenterPos - panelWidths[0]),
          floorNumberToOneDecimal(newSearchPos - newCenterPos),
          layoutWidth - newSearchPos,
        ]),
      );
    }
  };

  const toggleSecondPanel = () => {
    if (secondPanelExpanded) {
      dispatch(setSecondPanelExpanded(false));
      return;
    }

    dispatch(setSecondPanelExpanded(true));

    let newTreePos = treeSeparator.position;
    let newCenterPos = centerSeparator.position;
    let newSearchPos = searchSeparator.position;
    let needsUpdate = false;

    const panel3Space = thirdPanelExpanded
      ? Math.max(newSearchPos - newCenterPos, THIRD_PANEL_MIN_WIDTH)
      : COLLAPSED_PANEL_WIDTH;
    const panel4Space = fourthPanelExpanded ? FOURTH_PANEL_MIN_WIDTH : COLLAPSED_PANEL_WIDTH;

    const maxCenterPos = layoutWidth - panel3Space - panel4Space;

    if (newCenterPos > maxCenterPos) {
      newCenterPos = maxCenterPos;
      needsUpdate = true;
    }

    if (newCenterPos - newTreePos < SECOND_PANEL_MIN_WIDTH) {
      newTreePos = newCenterPos - SECOND_PANEL_MIN_WIDTH;
      needsUpdate = true;
    }

    if (newTreePos < FIRST_PANEL_MIN_WIDTH) {
      newTreePos = FIRST_PANEL_MIN_WIDTH;
      newCenterPos = Math.max(newCenterPos, newTreePos + SECOND_PANEL_MIN_WIDTH);
      needsUpdate = true;
    }

    if (thirdPanelExpanded && newSearchPos - newCenterPos < THIRD_PANEL_MIN_WIDTH) {
      newSearchPos = newCenterPos + THIRD_PANEL_MIN_WIDTH;
      needsUpdate = true;
    }

    if (needsUpdate) {
      updateSeparator(
        treeSeparator,
        "mainPageTreeSeparatorXPosition",
        treeSeparator.position,
        newTreePos,
      );
      updateSeparator(
        centerSeparator,
        "mainPageCenterSeparatorXPosition",
        centerSeparator.position,
        newCenterPos,
      );
      updateSeparator(
        searchSeparator,
        "mainPageSearchSeparatorXPosition",
        searchSeparator.position,
        newSearchPos,
      );

      dispatch(
        setPanelWidths([
          newTreePos,
          floorNumberToOneDecimal(newCenterPos - newTreePos),
          floorNumberToOneDecimal(newSearchPos - newCenterPos),
          layoutWidth - newSearchPos,
        ]),
      );
    }
  };

  const toggleThirdPanel = () => {
    if (thirdPanelExpanded) {
      dispatch(setThirdPanelExpanded(false));

      // hand the freed third-panel width to the second panel (preferred over the
      // fourth): move the center separator right and keep the search separator,
      // so the fourth panel keeps its width. Remember the width to restore it.
      if (secondPanelExpanded && fourthPanelExpanded) {
        const freed = panelWidths[2] - COLLAPSED_PANEL_WIDTH;
        if (freed > 0) {
          localStorage.setItem(
            "mainPageThirdPanelRestoreWidth",
            floorNumberToOneDecimal(panelWidths[2] / onePercentOfLayoutWidth).toString(),
          );
          const newCenterPos = centerSeparator.position + freed;
          centerSeparator.setPosition(newCenterPos);
          persistSeparator("mainPageCenterSeparatorXPosition", newCenterPos);
          dispatch(
            setPanelWidths([
              panelWidths[0],
              floorNumberToOneDecimal(newCenterPos - panelWidths[0]),
              COLLAPSED_PANEL_WIDTH,
              panelWidths[3],
            ]),
          );
        }
      } else if (!secondPanelExpanded) {
        // when second panel is hidden, give ALL freed visual space to first panel
        // instead of fourth. fourthPanelWidth = layoutWidth - sum(others), so the
        // only way to keep fourth unchanged is to push all three separators right
        // until first panel absorbs everything. Save original positions to restore.
        const desiredTreePos = panelWidths[0] + panelWidths[1] + panelWidths[2] - 2 * COLLAPSED_PANEL_WIDTH;
        const desiredCenterPos = desiredTreePos + SECOND_PANEL_MIN_WIDTH;
        const desiredSearchPos = desiredCenterPos + COLLAPSED_PANEL_WIDTH;

        const newSearchPos = Math.min(desiredSearchPos, layoutWidth - FOURTH_PANEL_MIN_WIDTH);
        const newCenterPos = Math.min(desiredCenterPos, newSearchPos - COLLAPSED_PANEL_WIDTH);
        const newTreePos = Math.min(desiredTreePos, newCenterPos - SECOND_PANEL_MIN_WIDTH);

        if (newTreePos > treeSeparator.position) {
          localStorage.setItem(
            "mainPageThirdPanelRestoreTree",
            floorNumberToOneDecimal(treeSeparator.position / onePercentOfLayoutWidth).toString(),
          );
          localStorage.setItem(
            "mainPageThirdPanelRestoreCenter",
            floorNumberToOneDecimal(centerSeparator.position / onePercentOfLayoutWidth).toString(),
          );
          localStorage.setItem(
            "mainPageThirdPanelRestoreSearch",
            floorNumberToOneDecimal(searchSeparator.position / onePercentOfLayoutWidth).toString(),
          );

          treeSeparator.setPosition(newTreePos);
          persistSeparator("mainPageTreeSeparatorXPosition", newTreePos);
          centerSeparator.setPosition(newCenterPos);
          persistSeparator("mainPageCenterSeparatorXPosition", newCenterPos);
          searchSeparator.setPosition(newSearchPos);
          persistSeparator("mainPageSearchSeparatorXPosition", newSearchPos);
          dispatch(
            setPanelWidths([
              newTreePos,
              floorNumberToOneDecimal(newCenterPos - newTreePos),
              COLLAPSED_PANEL_WIDTH,
              floorNumberToOneDecimal(layoutWidth - newSearchPos),
            ]),
          );
        }
      }
      return;
    }

    dispatch(setThirdPanelExpanded(true));
    queryClient.invalidateQueries({ queryKey: ["document"] });

    // if all three separators were shifted right when second panel was hidden,
    // restore them all to exact pre-collapse positions
    const savedTree = localStorage.getItem("mainPageThirdPanelRestoreTree");
    const savedCenter = localStorage.getItem("mainPageThirdPanelRestoreCenter");
    const savedSearch = localStorage.getItem("mainPageThirdPanelRestoreSearch");
    if (savedTree && savedCenter && savedSearch && !secondPanelExpanded) {
      localStorage.removeItem("mainPageThirdPanelRestoreTree");
      localStorage.removeItem("mainPageThirdPanelRestoreCenter");
      localStorage.removeItem("mainPageThirdPanelRestoreSearch");
      const restoreTreePos = Number(savedTree) * onePercentOfLayoutWidth;
      const restoreCenterPos = Number(savedCenter) * onePercentOfLayoutWidth;
      const restoreSearchPos = Number(savedSearch) * onePercentOfLayoutWidth;
      treeSeparator.setPosition(restoreTreePos);
      persistSeparator("mainPageTreeSeparatorXPosition", restoreTreePos);
      centerSeparator.setPosition(restoreCenterPos);
      persistSeparator("mainPageCenterSeparatorXPosition", restoreCenterPos);
      searchSeparator.setPosition(restoreSearchPos);
      persistSeparator("mainPageSearchSeparatorXPosition", restoreSearchPos);
      dispatch(
        setPanelWidths([
          restoreTreePos,
          floorNumberToOneDecimal(restoreCenterPos - restoreTreePos),
          floorNumberToOneDecimal(restoreSearchPos - restoreCenterPos),
          floorNumberToOneDecimal(layoutWidth - restoreSearchPos),
        ]),
      );
      return;
    }

    // if the third panel's width was previously parked into the second panel,
    // give it back by moving the center separator left (fourth panel untouched)
    const storedRestore = localStorage.getItem("mainPageThirdPanelRestoreWidth");
    if (storedRestore && secondPanelExpanded && fourthPanelExpanded) {
      localStorage.removeItem("mainPageThirdPanelRestoreWidth");
      const restoreWidth = Math.max(
        Number(storedRestore) * onePercentOfLayoutWidth,
        THIRD_PANEL_MIN_WIDTH,
      );
      const minCenterPos = treeSeparator.position + SECOND_PANEL_MIN_WIDTH;
      const newCenterPos = Math.max(searchSeparator.position - restoreWidth, minCenterPos);

      centerSeparator.setPosition(newCenterPos);
      persistSeparator("mainPageCenterSeparatorXPosition", newCenterPos);
      dispatch(
        setPanelWidths([
          panelWidths[0],
          floorNumberToOneDecimal(newCenterPos - panelWidths[0]),
          floorNumberToOneDecimal(searchSeparator.position - newCenterPos),
          panelWidths[3],
        ]),
      );
      return;
    }

    let newTreePos = treeSeparator.position;
    let newSearchPos = searchSeparator.position;
    let needsUpdate = false;

    if (centerSeparator.position - newTreePos < SECOND_PANEL_MIN_WIDTH) {
      newTreePos = centerSeparator.position - SECOND_PANEL_MIN_WIDTH;
      needsUpdate = true;
    }

    let newCenterPos = centerSeparator.position;

    if (newSearchPos - newCenterPos < THIRD_PANEL_MIN_WIDTH) {
      newSearchPos = newCenterPos + THIRD_PANEL_MIN_WIDTH;
      needsUpdate = true;

      if (layoutWidth - newSearchPos < FOURTH_PANEL_MIN_WIDTH) {
        newSearchPos = layoutWidth - FOURTH_PANEL_MIN_WIDTH;
        newCenterPos = newSearchPos - THIRD_PANEL_MIN_WIDTH;

        if (newCenterPos - newTreePos < SECOND_PANEL_MIN_WIDTH) {
          newTreePos = newCenterPos - SECOND_PANEL_MIN_WIDTH;
        }
      }
    }

    if (needsUpdate) {
      updateSeparator(
        treeSeparator,
        "mainPageTreeSeparatorXPosition",
        treeSeparator.position,
        newTreePos,
      );
      updateSeparator(
        centerSeparator,
        "mainPageCenterSeparatorXPosition",
        centerSeparator.position,
        newCenterPos,
      );
      updateSeparator(
        searchSeparator,
        "mainPageSearchSeparatorXPosition",
        searchSeparator.position,
        newSearchPos,
      );

      dispatch(
        setPanelWidths([
          newTreePos,
          floorNumberToOneDecimal(newCenterPos - newTreePos),
          floorNumberToOneDecimal(newSearchPos - newCenterPos),
          floorNumberToOneDecimal(layoutWidth - newSearchPos),
        ]),
      );
    }
  };

  const toggleFourthPanel = () => {
    if (fourthPanelExpanded) {
      dispatch(setFourthPanelExpanded(false));
      return;
    }

    dispatch(setFourthPanelExpanded(true));

    let newCenterPos = centerSeparator.position;
    let newTreePos = treeSeparator.position;
    let needsUpdate = false;

    if (newCenterPos - newTreePos < SECOND_PANEL_MIN_WIDTH) {
      newCenterPos = newTreePos + SECOND_PANEL_MIN_WIDTH;
      needsUpdate = true;
    }

    if (searchSeparator.position - newCenterPos < THIRD_PANEL_MIN_WIDTH) {
      newCenterPos = searchSeparator.position - THIRD_PANEL_MIN_WIDTH;
      needsUpdate = true;

      if (newCenterPos - newTreePos < SECOND_PANEL_MIN_WIDTH) {
        newTreePos = newCenterPos - SECOND_PANEL_MIN_WIDTH;
      }
    }

    if (needsUpdate) {
      updateSeparator(
        centerSeparator,
        "mainPageCenterSeparatorXPosition",
        centerSeparator.position,
        newCenterPos,
      );
      updateSeparator(
        treeSeparator,
        "mainPageTreeSeparatorXPosition",
        treeSeparator.position,
        newTreePos,
      );

      dispatch(
        setPanelWidths([
          newTreePos,
          floorNumberToOneDecimal(newCenterPos - newTreePos),
          floorNumberToOneDecimal(searchSeparator.position - newCenterPos),
          layoutWidth - searchSeparator.position,
        ]),
      );
    }
  };

  return { toggleFirstPanel, toggleSecondPanel, toggleThirdPanel, toggleFourthPanel };
}
