import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setPanelWidths } from "redux/features/layout/mainPage/panelWidthsSlice";
import { setPanelWidthsPercent } from "redux/features/layout/mainPage/panelWidthsPercentSlice";
import {
  COLLAPSED_PANEL_WIDTH,
  FIRST_PANEL_MIN_WIDTH,
  FOURTH_PANEL_MIN_WIDTH,
  MAIN_PAGE_CENTER_SEPARATOR_X_PERCENT_POSITION,
  MAIN_PAGE_SEARCH_SEPARATOR_X_PERCENT_POSITION,
  MAIN_PAGE_TREE_SEPARATOR_X_PERCENT_POSITION,
  SECOND_PANEL_MIN_WIDTH,
  THIRD_PANEL_MIN_WIDTH,
} from "Theme/constants";
import {
  arePanelWidthsUndersized,
  getEffectivePanelWidths,
  getInitPercentPanelWidths,
  isLayoutUndersized,
  panelWidthsFromSeparators,
  writePanelWidthVars,
  writeSeparatorPositionVars,
} from "utils/layoutUtils";
import { floorNumberToOneDecimal } from "utils/utils";

export type VerticalSeparatorKey = "tree" | "center" | "search";

// The x of each panel edge that can be dragged. A type rather than an interface
// so it satisfies the keyed signature the variable writers take.
export type SeparatorPositions = {
  tree: number;
  center: number;
  search: number;
};

export function useVerticalSeparators() {
  const dispatch = useAppDispatch();

  const layoutWidth = useAppSelector((state) => state.layout.layoutWidth);
  const panelWidths = useAppSelector((state) => state.layout.mainPage.panelWidths);
  const firstPanelExpanded = useAppSelector((state) => state.layout.mainPage.firstPanelExpanded);
  const secondPanelExpanded = useAppSelector((state) => state.layout.mainPage.secondPanelExpanded);
  const thirdPanelExpanded = useAppSelector((state) => state.layout.mainPage.thirdPanelExpanded);
  const fourthPanelExpanded = useAppSelector((state) => state.layout.mainPage.fourthPanelExpanded);

  const onePercentOfLayoutWidth = useMemo(() => layoutWidth / 100, [layoutWidth]);

  // TREE SEPARATOR STATE
  const localStorageTreeSeparatorXPosition = localStorage.getItem("mainPageTreeSeparatorXPosition");
  const [mainPageTreeSeparatorXPosition, setMainPageTreeSeparatorXPosition] = useState<number>(
    localStorageTreeSeparatorXPosition
      ? Number(localStorageTreeSeparatorXPosition) * onePercentOfLayoutWidth
      : MAIN_PAGE_TREE_SEPARATOR_X_PERCENT_POSITION * onePercentOfLayoutWidth,
  );

  // CENTER SEPARATOR STATE
  const localStorageCenterSeparatorXPosition = localStorage.getItem(
    "mainPageCenterSeparatorXPosition",
  );
  const [mainPageCenterSeparatorXPosition, setMainPageCenterSeparatorXPosition] = useState<number>(
    localStorageCenterSeparatorXPosition
      ? Number(localStorageCenterSeparatorXPosition) * onePercentOfLayoutWidth
      : MAIN_PAGE_CENTER_SEPARATOR_X_PERCENT_POSITION * onePercentOfLayoutWidth,
  );

  // SEARCH SEPARATOR STATE
  const localStorageSearchSeparatorXPosition = localStorage.getItem(
    "mainPageSearchSeparatorXPosition",
  );
  const [mainPageSearchSeparatorXPosition, setMainPageSearchSeparatorXPosition] = useState<number>(
    localStorageSearchSeparatorXPosition
      ? Number(localStorageSearchSeparatorXPosition) * onePercentOfLayoutWidth
      : MAIN_PAGE_SEARCH_SEPARATOR_X_PERCENT_POSITION * onePercentOfLayoutWidth,
  );

  const expandedPanels = [
    firstPanelExpanded,
    secondPanelExpanded,
    thirdPanelExpanded,
    fourthPanelExpanded,
  ];

  const separatorPositions: SeparatorPositions = {
    tree: mainPageTreeSeparatorXPosition,
    center: mainPageCenterSeparatorXPosition,
    search: mainPageSearchSeparatorXPosition,
  };

  const basePanelWidths = (positions: SeparatorPositions) => [
    positions.tree,
    positions.center - positions.tree,
    positions.search - positions.center,
    layoutWidth - positions.search,
  ];

  // How far a separator travels before it starts pushing its neighbours.
  const separatorBounds = (
    separator: VerticalSeparatorKey,
    positions: SeparatorPositions,
  ): { min: number; max: number } => {
    const widths = basePanelWidths(positions);

    switch (separator) {
      case "tree":
        return {
          min: FIRST_PANEL_MIN_WIDTH,
          max: secondPanelExpanded
            ? thirdPanelExpanded || fourthPanelExpanded
              ? positions.center - SECOND_PANEL_MIN_WIDTH
              : layoutWidth - 2 * COLLAPSED_PANEL_WIDTH - SECOND_PANEL_MIN_WIDTH
            : thirdPanelExpanded
              ? positions.search - THIRD_PANEL_MIN_WIDTH - COLLAPSED_PANEL_WIDTH
              : layoutWidth -
                (fourthPanelExpanded ? widths[3] : COLLAPSED_PANEL_WIDTH) -
                2 * COLLAPSED_PANEL_WIDTH,
        };
      case "center":
        return {
          min:
            (firstPanelExpanded ? positions.tree : COLLAPSED_PANEL_WIDTH) +
            SECOND_PANEL_MIN_WIDTH,
          max: thirdPanelExpanded
            ? fourthPanelExpanded
              ? layoutWidth - widths[3] - THIRD_PANEL_MIN_WIDTH
              : layoutWidth - COLLAPSED_PANEL_WIDTH - THIRD_PANEL_MIN_WIDTH
            : layoutWidth - COLLAPSED_PANEL_WIDTH - FOURTH_PANEL_MIN_WIDTH,
        };
      case "search":
        return {
          min:
            (secondPanelExpanded
              ? positions.center
              : (firstPanelExpanded ? widths[0] : COLLAPSED_PANEL_WIDTH) +
                COLLAPSED_PANEL_WIDTH) +
            (thirdPanelExpanded ? THIRD_PANEL_MIN_WIDTH : COLLAPSED_PANEL_WIDTH),
          max: layoutWidth - FOURTH_PANEL_MIN_WIDTH,
        };
    }
  };

  // Resolves a position the pointer asks for into the layout it produces: the
  // dragged separator against its bounds, and the neighbours it pushes moved by
  // whatever the pointer asked for past them. A function of the positions it is
  // handed, so a drag can run it per pointer event against where the drag
  // already is, and the drop can run it once more for the same answer.
  const resolveSeparatorDrag = (
    separator: VerticalSeparatorKey,
    requestedXPosition: number,
    from: SeparatorPositions,
  ): SeparatorPositions => {
    const bounds = separatorBounds(separator, from);
    const overflow = Math.max(0, requestedXPosition - bounds.max);
    const underflow = Math.max(0, bounds.min - requestedXPosition);
    const positions = { ...from };

    if (overflow > 0) {
      const widths = basePanelWidths(from);
      const effectiveWidths = getEffectivePanelWidths(
        widths,
        expandedPanels,
        layoutWidth,
      );

      if (separator === "tree") {
        if (effectiveWidths[2] > THIRD_PANEL_MIN_WIDTH + overflow) {
          positions.center = from.center + overflow;
        } else if (effectiveWidths[3] > FOURTH_PANEL_MIN_WIDTH + overflow) {
          positions.center = from.center + overflow;
          if (thirdPanelExpanded) {
            positions.search = from.search + overflow;
          }
        }
      } else if (
        separator === "center" &&
        widths[3] > FOURTH_PANEL_MIN_WIDTH + overflow
      ) {
        positions.search = from.search + overflow;
      }
    }

    if (underflow > 0) {
      const widths = basePanelWidths(from);

      if (separator === "center") {
        if (widths[0] > FIRST_PANEL_MIN_WIDTH + underflow) {
          positions.tree = from.tree - underflow;
        }
      } else if (separator === "search") {
        if (widths[1] > SECOND_PANEL_MIN_WIDTH + underflow) {
          positions.center = from.center - underflow;
        } else if (widths[0] > FIRST_PANEL_MIN_WIDTH + underflow) {
          positions.center = from.center - underflow;
          positions.tree = from.tree - underflow;
        }
      }
    }

    // Neighbours that moved out of the way free the dragged separator to keep
    // following the pointer, so its own limit is only final once they have.
    const pushedBounds = separatorBounds(separator, positions);
    positions[separator] = Math.min(
      Math.max(requestedXPosition, pushedBounds.min),
      pushedBounds.max,
    );

    return positions;
  };

  // React state trails a drag by design, so the resolver reads and writes this
  // instead. Nothing reads it outside a drag, and every drag seeds it below, so
  // a drag that dies without committing - its separator unmounted because a
  // panel collapsed under it - leaves nothing behind that the next one inherits.
  const dragPositions = useRef<SeparatorPositions>(separatorPositions);

  const beginSeparatorDrag = () => {
    dragPositions.current = separatorPositions;
  };

  // Paints where a drag has reached without touching the store, and answers
  // with the position the dragged separator is allowed to be at.
  const previewSeparatorDrag = (
    separator: VerticalSeparatorKey,
    requestedXPosition: number,
  ): number => {
    const positions = resolveSeparatorDrag(
      separator,
      requestedXPosition,
      dragPositions.current,
    );
    dragPositions.current = positions;

    writeSeparatorPositionVars(positions);
    writePanelWidthVars(
      getEffectivePanelWidths(
        basePanelWidths(positions),
        expandedPanels,
        layoutWidth,
      ),
    );

    return positions[separator];
  };

  const persistSeparatorXPosition = (storageKey: string, xPosition: number) =>
    localStorage.setItem(
      storageKey,
      floorNumberToOneDecimal(xPosition / onePercentOfLayoutWidth).toString(),
    );

  const commitSeparatorDrag = (
    separator: VerticalSeparatorKey,
    requestedXPosition: number,
  ) => {
    const positions = resolveSeparatorDrag(
      separator,
      requestedXPosition,
      dragPositions.current,
    );
    dragPositions.current = positions;

    const movedTree = positions.tree !== separatorPositions.tree;
    const movedCenter = positions.center !== separatorPositions.center;
    const movedSearch = positions.search !== separatorPositions.search;

    if (!movedTree && !movedCenter && !movedSearch) {
      return;
    }

    if (movedTree) {
      setMainPageTreeSeparatorXPosition(positions.tree);
      persistSeparatorXPosition("mainPageTreeSeparatorXPosition", positions.tree);
    }
    if (movedCenter) {
      setMainPageCenterSeparatorXPosition(positions.center);
      persistSeparatorXPosition(
        "mainPageCenterSeparatorXPosition",
        positions.center,
      );
    }
    if (movedSearch) {
      setMainPageSearchSeparatorXPosition(positions.search);
      persistSeparatorXPosition(
        "mainPageSearchSeparatorXPosition",
        positions.search,
      );
    }

    const widths = basePanelWidths(positions);

    // Only when the window cannot hold the open panels at all. A drag that ran
    // out of room simply stopped at its boundary, which needs no telling off.
    if (isLayoutUndersized(expandedPanels, layoutWidth)) {
      toast.info("The interface is undersized. Lower the zoom or collapse one of the panels.");
    }

    dispatch(setPanelWidths(widths.map(floorNumberToOneDecimal)));
  };

  const handleSeparatorLayoutInit = () => {
    const treePos =
      Number(localStorageTreeSeparatorXPosition) * onePercentOfLayoutWidth;
    const centerPos =
      Number(localStorageCenterSeparatorXPosition) * onePercentOfLayoutWidth;
    const searchPos =
      Number(localStorageSearchSeparatorXPosition) * onePercentOfLayoutWidth;

    setMainPageTreeSeparatorXPosition(treePos);
    setMainPageCenterSeparatorXPosition(centerPos);
    setMainPageSearchSeparatorXPosition(searchPos);

    const tempPanelWidths = [
      treePos,
      centerPos - treePos,
      searchPos - centerPos,
      layoutWidth - searchPos,
    ];

    dispatch(setPanelWidths(tempPanelWidths.map((pW) => floorNumberToOneDecimal(pW))));
    dispatch(
      setPanelWidthsPercent(
        tempPanelWidths.map((panelWidth) =>
          floorNumberToOneDecimal(panelWidth / onePercentOfLayoutWidth),
        ),
      ),
    );
  };

  const handleLayoutInit = () => {
    const initPercentPanelWidths = getInitPercentPanelWidths(layoutWidth);
    const initPanelWidthsPx = initPercentPanelWidths.map((percentWidth: number) =>
      floorNumberToOneDecimal(percentWidth * onePercentOfLayoutWidth),
    );
    dispatch(setPanelWidths(initPanelWidthsPx));
    dispatch(setPanelWidthsPercent(initPercentPanelWidths));
    setMainPageTreeSeparatorXPosition(initPanelWidthsPx[0]);
    localStorage.setItem(
      "mainPageTreeSeparatorXPosition",
      (initPanelWidthsPx[0] / onePercentOfLayoutWidth).toString(),
    );
    setMainPageCenterSeparatorXPosition(initPanelWidthsPx[0] + initPanelWidthsPx[1]);
    localStorage.setItem(
      "mainPageCenterSeparatorXPosition",
      ((initPanelWidthsPx[0] + initPanelWidthsPx[1]) / onePercentOfLayoutWidth).toString(),
    );
    setMainPageSearchSeparatorXPosition(
      initPanelWidthsPx[0] + initPanelWidthsPx[1] + initPanelWidthsPx[2],
    );
    localStorage.setItem(
      "mainPageSearchSeparatorXPosition",
      (
        (initPanelWidthsPx[0] + initPanelWidthsPx[1] + initPanelWidthsPx[2]) /
        onePercentOfLayoutWidth
      ).toString(),
    );
  };

  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    if (layoutWidth > 0) {
      if (isFirstRender.current || !panelWidths.length) {
        // This is either initial load or coming from different page
        if (
          !localStorageCenterSeparatorXPosition ||
          !localStorageTreeSeparatorXPosition ||
          !localStorageSearchSeparatorXPosition
        ) {
          console.log("first layout init");
          // first layout INIT
          handleLayoutInit();
        } else {
          const savedWidths = panelWidthsFromSeparators(
            Number(localStorageTreeSeparatorXPosition),
            Number(localStorageCenterSeparatorXPosition),
            Number(localStorageSearchSeparatorXPosition),
            layoutWidth,
          );

          if (
            arePanelWidthsUndersized(
              savedWidths,
              [
                firstPanelExpanded,
                secondPanelExpanded,
                thirdPanelExpanded,
                fourthPanelExpanded,
              ],
              layoutWidth,
            )
          ) {
            // something is undersized
            console.log("something is undersized");
            handleLayoutInit();
          } else {
            // layout init with saved separator - coming from different page
            console.log(
              "page reload / coming from different page - separator determines panel widths",
            );
            handleSeparatorLayoutInit();
          }
        }

        isFirstRender.current = false;
      } else {
        // change of layout width (different monitor / change of zoom)
        if (
          localStorageTreeSeparatorXPosition &&
          localStorageCenterSeparatorXPosition &&
          localStorageSearchSeparatorXPosition
        ) {
          handleSeparatorLayoutInit();
        } else {
          handleLayoutInit();
        }
      }
    }
  }, [layoutWidth]);

  return {
    treeSeparator: {
      position: mainPageTreeSeparatorXPosition,
      setPosition: setMainPageTreeSeparatorXPosition,
    },
    centerSeparator: {
      position: mainPageCenterSeparatorXPosition,
      setPosition: setMainPageCenterSeparatorXPosition,
    },
    searchSeparator: {
      position: mainPageSearchSeparatorXPosition,
      setPosition: setMainPageSearchSeparatorXPosition,
    },
    onePercentOfLayoutWidth,
    isFirstRender,
    separatorPositions,
    beginSeparatorDrag,
    previewSeparatorDrag,
    commitSeparatorDrag,
    handleLayoutInit,
  };
}
