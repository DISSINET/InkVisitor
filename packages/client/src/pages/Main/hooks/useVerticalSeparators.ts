import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setPanelWidths } from "redux/features/layout/mainPage/panelWidthsSlice";
import { setPanelWidthsPercent } from "redux/features/layout/mainPage/panelWidthsPercentSlice";
import {
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
  getInitPercentPanelWidths,
  panelWidthsFromSeparators,
} from "utils/layoutUtils";
import { floorNumberToOneDecimal } from "utils/utils";

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

  const handleTreeSeparatorXPositionChange = (xPosition: number) => {
    const flooredXPosition = floorNumberToOneDecimal(xPosition);
    const clampedXPosition = Math.max(flooredXPosition, FIRST_PANEL_MIN_WIDTH);

    if (
      firstPanelExpanded &&
      secondPanelExpanded &&
      thirdPanelExpanded &&
      fourthPanelExpanded &&
      flooredXPosition < FIRST_PANEL_MIN_WIDTH
    ) {
      toast.info("The interface is undersized. Lower the zoom or collapse one of the panels.");
    }

    if (mainPageTreeSeparatorXPosition !== clampedXPosition) {
      setMainPageTreeSeparatorXPosition(clampedXPosition);

      const separatorXPercentPosition = floorNumberToOneDecimal(
        clampedXPosition / onePercentOfLayoutWidth,
      );
      localStorage.setItem("mainPageTreeSeparatorXPosition", separatorXPercentPosition.toString());

      dispatch(
        setPanelWidths([
          clampedXPosition,
          floorNumberToOneDecimal(mainPageCenterSeparatorXPosition - clampedXPosition),
          panelWidths[2],
          panelWidths[3],
        ]),
      );
    }
  };

  const handleCenterSeparatorXPositionChange = (xPosition: number) => {
    if (mainPageCenterSeparatorXPosition !== xPosition) {
      const secondPanelWidth = xPosition - panelWidths[0];
      const thirdPanelWidth = layoutWidth - panelWidths[3] - xPosition;

      if (
        firstPanelExpanded &&
        secondPanelExpanded &&
        thirdPanelExpanded &&
        fourthPanelExpanded &&
        (secondPanelWidth < SECOND_PANEL_MIN_WIDTH || thirdPanelWidth < THIRD_PANEL_MIN_WIDTH)
      ) {
        toast.info("The interface is undersized. Lower the zoom or collapse one of the panels.");
      }

      setMainPageCenterSeparatorXPosition(xPosition);

      const separatorXPercentPosition = floorNumberToOneDecimal(
        xPosition / onePercentOfLayoutWidth,
      );
      localStorage.setItem(
        "mainPageCenterSeparatorXPosition",
        separatorXPercentPosition.toString(),
      );

      dispatch(
        setPanelWidths([
          panelWidths[0],
          floorNumberToOneDecimal(secondPanelWidth),
          floorNumberToOneDecimal(thirdPanelWidth),
          panelWidths[3],
        ]),
      );
    }
  };

  const handleSearchSeparatorXPositionChange = (xPosition: number) => {
    if (mainPageSearchSeparatorXPosition !== xPosition) {
      const thirdPanelWidth = xPosition - mainPageCenterSeparatorXPosition;
      const fourthPanelWidth = layoutWidth - xPosition;

      if (
        firstPanelExpanded &&
        secondPanelExpanded &&
        thirdPanelExpanded &&
        fourthPanelExpanded &&
        (thirdPanelWidth < THIRD_PANEL_MIN_WIDTH || fourthPanelWidth < FOURTH_PANEL_MIN_WIDTH)
      ) {
        toast.info("The interface is undersized. Lower the zoom or collapse one of the panels.");
      }

      setMainPageSearchSeparatorXPosition(xPosition);

      const separatorXPercentPosition = floorNumberToOneDecimal(
        xPosition / onePercentOfLayoutWidth,
      );
      localStorage.setItem(
        "mainPageSearchSeparatorXPosition",
        separatorXPercentPosition.toString(),
      );

      dispatch(
        setPanelWidths([
          panelWidths[0],
          panelWidths[1],
          floorNumberToOneDecimal(thirdPanelWidth),
          floorNumberToOneDecimal(fourthPanelWidth),
        ]),
      );
    }
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
            arePanelWidthsUndersized(savedWidths, [
              firstPanelExpanded,
              secondPanelExpanded,
              thirdPanelExpanded,
              fourthPanelExpanded,
            ])
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
    handleTreeSeparatorXPositionChange,
    handleCenterSeparatorXPositionChange,
    handleSearchSeparatorXPositionChange,
    handleLayoutInit,
  };
}
