import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IResponseTree, IStatement } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Box, Button, ButtonGroup, Loader, Panel } from "components";
import { EntityCreateModal, LayoutSeparatorVertical } from "components/advanced";
import { CStatement } from "constructors";
import { useSearchParams } from "hooks";
import { useUserQuery } from "hooks/react-query";
import ScrollHandler from "hooks/ScrollHandler";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BiHide, BiRefresh, BiShow } from "react-icons/bi";
import { BsSquareFill, BsSquareHalf } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { FaDiagramNext } from "react-icons/fa6";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { VscCloseAll } from "react-icons/vsc";
import { toast } from "react-toastify";
import { setDetailBoxState } from "redux/features/layout/mainPage/detailBoxStateSlice";
import { setFirstPanelExpanded } from "redux/features/layout/mainPage/firstPanelExpandedSlice";
import { setSecondPanelExpanded } from "redux/features/layout/mainPage/secondPanelExpandedSlice";
import { setFourthPanelBoxesOpened } from "redux/features/layout/mainPage/fourthPanelBoxesOpenedSlice";
import { setFourthPanelExpanded } from "redux/features/layout/mainPage/fourthPanelExpandedSlice";
import { setPanelWidthsPercent } from "redux/features/layout/mainPage/panelWidthsPercentSlice";
import { setPanelWidths } from "redux/features/layout/mainPage/panelWidthsSlice";
import { setSecondPanelRealWidth } from "redux/features/layout/mainPage/secondPanelRealWidthSlice";
import { setStatementListOpened } from "redux/features/layout/mainPage/statementListOpenedSlice";
import { setThirdPanelExpanded } from "redux/features/layout/mainPage/thirdPanelExpandedSlice";
import { setThirdPanelRealWidth } from "redux/features/layout/mainPage/thirdPanelRealWidthSlice";
import { setDisableStatementListScroll } from "redux/features/statementList/disableStatementListScrollSlice";
import { setIsLoading } from "redux/features/statementList/isLoadingSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  COLLAPSED_PANEL_WIDTH,
  EXTRA_SMALL_SCREEN_LIMIT,
  FIRST_PANEL_MIN_WIDTH,
  FOURTH_PANEL_MIN_WIDTH,
  fourthPanelBoxesHeightThirds,
  heightHeader,
  hiddenBoxHeight,
  INIT_PERCENT_PANEL_WIDTHS,
  INIT_PERCENT_PANEL_WIDTHS_EXTRA_SMALL_SCREEN,
  INIT_PERCENT_PANEL_WIDTHS_LARGE_SCREEN,
  INIT_PERCENT_PANEL_WIDTHS_SMALL_SCREEN,
  LARGE_SCREEN_LIMIT,
  MAIN_PAGE_CENTER_SEPARATOR_X_PERCENT_POSITION,
  MAIN_PAGE_SEARCH_SEPARATOR_X_PERCENT_POSITION,
  MAIN_PAGE_TREE_SEPARATOR_X_PERCENT_POSITION,
  SECOND_PANEL_MIN_WIDTH,
  SMALL_SCREEN_LIMIT,
  THIRD_PANEL_MIN_WIDTH,
} from "Theme/constants";
import { DetailBoxState, EditorBoxState } from "types";
import { floorNumberToOneDecimal, searchTree } from "utils/utils";
import { MemoizedAnnotatorBox } from "./containers/AnnotatorBox/AnnotatorBox";
import { MemoizedEntityBookmarkBox } from "./containers/EntityBookmarkBox/EntityBookmarkBox";
import { MemoizedEntityDetailBox } from "./containers/EntityDetailBox/EntityDetailBox";
import { MemoizedEntitySearchBox } from "./containers/EntitySearchBox/EntitySearchBox";
import { MemoizedStatementEditorBox } from "./containers/StatementEditorBox/StatementEditorBox";
import { MemoizedStatementListBox } from "./containers/StatementsListBox/StatementListBox";
import { MemoizedTemplateListBox } from "./containers/TemplateListBox/TemplateListBox";
import { MemoizedTerritoryTreeBox } from "./containers/TerritoryTreeBox/TerritoryTreeBox";
import { setEditorBoxState } from "redux/features/layout/mainPage/editorBoxStateSlice";

type FourthPanelBoxes = "search" | "bookmarks" | "templates";

interface MainPage {}

const MainPage: React.FC<MainPage> = ({}) => {
  const {
    territoryId,
    detailIdArray,
    clearAllDetailIds,
    selectedDetailId,
    appendDetailId,
    setStatementId,
    setTerritoryId,
    editorOpened,
    setEditorOpened,
  } = useSearchParams();

  const dispatch = useAppDispatch();

  const queryClient = useQueryClient();

  const layoutWidth: number = useAppSelector((state) => state.layout.layoutWidth);
  const contentHeight: number = useAppSelector((state) => state.layout.contentHeight);
  const panelWidths: number[] = useAppSelector((state) => state.layout.mainPage.panelWidths);
  const fourthPanelBoxesOpened: { [key: string]: boolean } = useAppSelector(
    (state) => state.layout.mainPage.fourthPanelBoxesOpened,
  );
  const firstPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.mainPage.firstPanelExpanded,
  );
  const secondPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.mainPage.secondPanelExpanded,
  );
  const thirdPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.mainPage.thirdPanelExpanded,
  );
  const fourthPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.mainPage.fourthPanelExpanded,
  );
  const statementListOpened: boolean = useAppSelector(
    (state) => state.layout.mainPage.statementListOpened,
  );
  const detailBoxState: DetailBoxState = useAppSelector(
    (state) => state.layout.mainPage.detailBoxState,
  );
  const editorBoxState: EditorBoxState = useAppSelector(
    (state) => state.layout.mainPage.editorBoxState,
  );
  const thirdPanelRealWidth: number = useAppSelector(
    (state) => state.layout.mainPage.thirdPanelRealWidth,
  );
  const [lastState, setLastState] = useState(DetailBoxState.Normal);

  const annotatorVisible =
    thirdPanelExpanded && !(editorOpened && editorBoxState === EditorBoxState.FullHeight);
  const [showAnnotatorContent, setShowAnnotatorContent] = useState(false);
  useEffect(() => {
    if (annotatorVisible) {
      const timer = setTimeout(() => {
        setShowAnnotatorContent(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowAnnotatorContent(false);
    }
  }, [annotatorVisible]);

  const toggleFirstPanel = () => {
    if (firstPanelExpanded) {
      dispatch(setFirstPanelExpanded(false));
    } else {
      dispatch(setFirstPanelExpanded(true));

      let newCenterPos = mainPageCenterSeparatorXPosition;
      let newSearchPos = mainPageSearchSeparatorXPosition;
      let needsUpdate = false;

      if (newCenterPos - mainPageTreeSeparatorXPosition < SECOND_PANEL_MIN_WIDTH) {
        newCenterPos = mainPageTreeSeparatorXPosition + SECOND_PANEL_MIN_WIDTH;
        needsUpdate = true;

        if (newSearchPos - newCenterPos < THIRD_PANEL_MIN_WIDTH) {
          newSearchPos = newCenterPos + THIRD_PANEL_MIN_WIDTH;
        }
      }

      if (needsUpdate) {
        setMainPageCenterSeparatorXPosition(newCenterPos);
        localStorage.setItem(
          "mainPageCenterSeparatorXPosition",
          floorNumberToOneDecimal(newCenterPos / onePercentOfLayoutWidth).toString(),
        );

        if (newSearchPos !== mainPageSearchSeparatorXPosition) {
          setMainPageSearchSeparatorXPosition(newSearchPos);
          localStorage.setItem(
            "mainPageSearchSeparatorXPosition",
            floorNumberToOneDecimal(newSearchPos / onePercentOfLayoutWidth).toString(),
          );
        }

        dispatch(
          setPanelWidths([
            panelWidths[0],
            floorNumberToOneDecimal(newCenterPos - panelWidths[0]),
            floorNumberToOneDecimal(newSearchPos - newCenterPos),
            layoutWidth - newSearchPos,
          ]),
        );
      }
    }
  };

  const firstPanelButton = () => (
    <Button
      onClick={toggleFirstPanel}
      inverted
      icon={firstPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
    />
  );

  const toggleSecondPanel = () => {
    dispatch(setSecondPanelExpanded(!secondPanelExpanded));
  };

  const secondPanelButton = () => (
    <Button
      onClick={toggleSecondPanel}
      inverted
      icon={secondPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
    />
  );

  const toggleThirdPanel = () => {
    if (thirdPanelExpanded) {
      dispatch(setThirdPanelExpanded(false));
    } else {
      dispatch(setThirdPanelExpanded(true));
      queryClient.invalidateQueries({ queryKey: ["document"] });

      let newTreePos = mainPageTreeSeparatorXPosition;
      let newSearchPos = mainPageSearchSeparatorXPosition;
      let needsUpdate = false;

      if (mainPageCenterSeparatorXPosition - newTreePos < SECOND_PANEL_MIN_WIDTH) {
        newTreePos = mainPageCenterSeparatorXPosition - SECOND_PANEL_MIN_WIDTH;
        needsUpdate = true;
      }

      let newCenterPos = mainPageCenterSeparatorXPosition;

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
        if (newTreePos !== mainPageTreeSeparatorXPosition) {
          setMainPageTreeSeparatorXPosition(newTreePos);
          localStorage.setItem(
            "mainPageTreeSeparatorXPosition",
            floorNumberToOneDecimal(newTreePos / onePercentOfLayoutWidth).toString(),
          );
        }

        if (newCenterPos !== mainPageCenterSeparatorXPosition) {
          setMainPageCenterSeparatorXPosition(newCenterPos);
          localStorage.setItem(
            "mainPageCenterSeparatorXPosition",
            floorNumberToOneDecimal(newCenterPos / onePercentOfLayoutWidth).toString(),
          );
        }

        if (newSearchPos !== mainPageSearchSeparatorXPosition) {
          setMainPageSearchSeparatorXPosition(newSearchPos);
          localStorage.setItem(
            "mainPageSearchSeparatorXPosition",
            floorNumberToOneDecimal(newSearchPos / onePercentOfLayoutWidth).toString(),
          );
        }

        dispatch(
          setPanelWidths([
            newTreePos,
            floorNumberToOneDecimal(newCenterPos - newTreePos),
            floorNumberToOneDecimal(newSearchPos - newCenterPos),
            floorNumberToOneDecimal(layoutWidth - newSearchPos),
          ]),
        );
      }
    }
  };

  const reverseThirdPanelIcon = !secondPanelExpanded;

  const thirdPanelButton = () => (
    <Button
      onClick={toggleThirdPanel}
      inverted
      icon={
        reverseThirdPanelIcon
          ? thirdPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />
          : thirdPanelExpanded ? <RiMenuUnfoldFill /> : <RiMenuFoldFill />
      }
    />
  );

  const toggleFourthPanel = () => {
    if (fourthPanelExpanded) {
      dispatch(setFourthPanelExpanded(false));
    } else {
      dispatch(setFourthPanelExpanded(true));

      let newCenterPos = mainPageCenterSeparatorXPosition;
      let newTreePos = mainPageTreeSeparatorXPosition;
      let needsUpdate = false;

      if (newCenterPos - newTreePos < SECOND_PANEL_MIN_WIDTH) {
        newCenterPos = newTreePos + SECOND_PANEL_MIN_WIDTH;
        needsUpdate = true;
      }

      if (
        mainPageSearchSeparatorXPosition - newCenterPos <
        THIRD_PANEL_MIN_WIDTH
      ) {
        newCenterPos = mainPageSearchSeparatorXPosition - THIRD_PANEL_MIN_WIDTH;
        needsUpdate = true;

        if (newCenterPos - newTreePos < SECOND_PANEL_MIN_WIDTH) {
          newTreePos = newCenterPos - SECOND_PANEL_MIN_WIDTH;
        }
      }

      if (needsUpdate) {
        if (newCenterPos !== mainPageCenterSeparatorXPosition) {
          setMainPageCenterSeparatorXPosition(newCenterPos);
          localStorage.setItem(
            "mainPageCenterSeparatorXPosition",
            floorNumberToOneDecimal(newCenterPos / onePercentOfLayoutWidth).toString(),
          );
        }

        if (newTreePos !== mainPageTreeSeparatorXPosition) {
          setMainPageTreeSeparatorXPosition(newTreePos);
          localStorage.setItem(
            "mainPageTreeSeparatorXPosition",
            floorNumberToOneDecimal(newTreePos / onePercentOfLayoutWidth).toString(),
          );
        }

        dispatch(
          setPanelWidths([
            newTreePos,
            floorNumberToOneDecimal(newCenterPos - newTreePos),
            floorNumberToOneDecimal(mainPageSearchSeparatorXPosition - newCenterPos),
            layoutWidth - mainPageSearchSeparatorXPosition,
          ]),
        );
      }
    }
  };

  const reverseFourthPanelIcon =
    (!firstPanelExpanded && !secondPanelExpanded && !thirdPanelExpanded);

  const hideFourthPanelButton = () => (
    <Button
      key="hide"
      onClick={toggleFourthPanel}
      inverted
      icon={
        reverseFourthPanelIcon
          ? fourthPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />
          : fourthPanelExpanded ? <RiMenuUnfoldFill /> : <RiMenuFoldFill />
      }
    />
  );

  const handleHideFourthPanelBoxButtonClick = (
    boxToHide: FourthPanelBoxes,
    isThisBoxHidden: boolean,
  ) => {
    if (isThisBoxHidden) {
      const newObject = {
        ...fourthPanelBoxesOpened,
        [boxToHide]: true,
      };
      dispatch(setFourthPanelBoxesOpened(newObject));
    } else {
      const newObject = {
        ...fourthPanelBoxesOpened,
        [boxToHide]: false,
      };
      dispatch(setFourthPanelBoxesOpened(newObject));
    }
  };

  // hide one of the boxes in fourth panel
  const hideFourthPanelBoxButton = (boxToHide: FourthPanelBoxes) => {
    const isThisBoxHidden = !fourthPanelBoxesOpened[boxToHide];
    return (
      <>
        {fourthPanelExpanded && (
          <Button
            key={boxToHide}
            inverted
            icon={isThisBoxHidden ? <BiShow /> : <BiHide />}
            onClick={() => handleHideFourthPanelBoxButtonClick(boxToHide, isThisBoxHidden)}
          />
        )}
      </>
    );
  };

  const refreshBoxButton = (queriesToRefresh: string[], isThisBoxHidden: boolean) => {
    return isThisBoxHidden ? (
      <></>
    ) : (
      <>
        {queriesToRefresh.length > 0 ? (
          <Button
            key="refresh queries"
            tooltipLabel="refresh data"
            inverted
            icon={<BiRefresh />}
            onClick={async () => {
              const uid = localStorage.getItem("userid");
              for (const queryToRefresh of queriesToRefresh) {
                if (queryToRefresh === "user" && uid) {
                  await queryClient.invalidateQueries({ queryKey: ["user", uid] });
                  await queryClient.refetchQueries({
                    queryKey: ["user", uid],
                    type: "active",
                  });
                } else {
                  await queryClient.invalidateQueries({
                    queryKey: [queryToRefresh],
                  });
                  await queryClient.refetchQueries({
                    queryKey: [queryToRefresh],
                    type: "active",
                  });
                }
              }
            }}
          />
        ) : null}
      </>
    );
  };

  const getFourthPanelBoxHeight = (box: FourthPanelBoxes): number => {
    const onePercentOfLayoutHeight = contentHeight / 100;

    const isThisBoxHidden = !fourthPanelBoxesOpened[box];
    const openBoxesCount = Object.values(fourthPanelBoxesOpened).filter((b) => b === true);

    if (!fourthPanelExpanded) {
      // Hidden panel state
      return contentHeight / 3;
    } else if (isThisBoxHidden) {
      return hiddenBoxHeight;
    } else {
      if (openBoxesCount.length === 3) {
        return fourthPanelBoxesHeightThirds[box] * onePercentOfLayoutHeight;
      } else if (openBoxesCount.length === 2) {
        return (contentHeight - hiddenBoxHeight) / 2;
      } else {
        return contentHeight - 2 * hiddenBoxHeight;
      }
    }
  };

  const clockPerformance = (
    profilerId: any,
    mode: any,
    actualTime: any,
    baseTime: any,
    startTime: any,
    commitTime: any,
  ) => {
    console.log({
      profilerId,
      mode,
      actualTime,
      baseTime,
      startTime,
      commitTime,
    });
  };

  const [showEntityCreateModal, setShowEntityCreateModal] = useState(false);

  const userRole = localStorage.getItem("userrole") as UserEnums.Role;

  const addStatementAtTheEndMutation = useMutation({
    mutationFn: async (newStatement: IStatement) => {
      await api.entityCreate(newStatement);
    },
    onSuccess: (data, variables) => {
      setStatementId(variables.id);
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      dispatch(setDisableStatementListScroll(false));
    },
  });

  useEffect(() => {
    if (addStatementAtTheEndMutation.isPending) {
      dispatch(setIsLoading(true));
    } else {
      dispatch(setIsLoading(false));
    }
  }, [addStatementAtTheEndMutation.isPending]);

  // user data for current user
  const { data: user } = useUserQuery();

  // Admin / Owner / Editor with writer rights
  const hasWriteRightsToSelectedTerritory = useMemo(() => {
    return (
      (user?.role === UserEnums.Role.Editor &&
        user?.rights?.some(
          (right) => right.territory === territoryId && right.mode === UserEnums.RoleMode.Write,
        )) ||
      user?.role === UserEnums.Role.Admin ||
      user?.role === UserEnums.Role.Owner
    );
  }, [user, territoryId]);

  const getStatementListBoxHeight = () => {
    if (!detailIdArray.length) {
      return contentHeight;
    } else {
      switch (detailBoxState) {
        case DetailBoxState.FullHeight:
          return hiddenBoxHeight;
        case DetailBoxState.Normal:
          return contentHeight / 2 + 20;
        case DetailBoxState.Minimized:
          return contentHeight - hiddenBoxHeight;
      }
    }
  };

  useEffect(() => {
    if (detailIdArray.length > 0) {
      if (detailBoxState === DetailBoxState.FullHeight) {
        if (statementListOpened) {
          dispatch(setStatementListOpened(false));
        }
      } else {
        if (!statementListOpened) {
          dispatch(setStatementListOpened(true));
        }
      }
    }
  }, [detailBoxState, statementListOpened, detailIdArray]);

  const handleMaximizeDetailBox = () => {
    if (detailBoxState === DetailBoxState.Normal) {
      dispatch(setDetailBoxState(DetailBoxState.FullHeight));
    } else {
      dispatch(setDetailBoxState(DetailBoxState.Normal));
    }
  };

  const handleMinimizeDetailBox = () => {
    if (detailBoxState === DetailBoxState.Minimized) {
      dispatch(setDetailBoxState(lastState));
    } else {
      setLastState(detailBoxState);
      dispatch(setDetailBoxState(DetailBoxState.Minimized));
    }
  };

  const getDetailBoxHeight = () => {
    switch (detailBoxState) {
      case DetailBoxState.FullHeight:
        return contentHeight - hiddenBoxHeight;
      case DetailBoxState.Normal:
        return contentHeight / 2 + 20;
      case DetailBoxState.Minimized:
        return hiddenBoxHeight + 22;
    }
  };

  const getMaximizeBtnTooltip = () => {
    switch (detailBoxState) {
      case DetailBoxState.FullHeight:
        return "shrink detail box";
      case DetailBoxState.Normal:
        return "maximize detail box";
      case DetailBoxState.Minimized:
        return "open detail box";
    }
  };

  const getEditorBoxHeight = () => {
    if (!editorOpened) {
      return hiddenBoxHeight;
    }
    switch (editorBoxState) {
      case EditorBoxState.FullHeight:
        return contentHeight - hiddenBoxHeight;
      case EditorBoxState.Normal:
        return contentHeight / 2 + 20;
      case EditorBoxState.Minimized:
        return hiddenBoxHeight;
    }
  };

  const getAnnotatorBoxHeight = () => {
    if (!editorOpened) {
      return contentHeight - hiddenBoxHeight;
    }
    switch (editorBoxState) {
      case EditorBoxState.FullHeight:
        return hiddenBoxHeight;
      case EditorBoxState.Normal:
        return contentHeight / 2 + 20;
      case EditorBoxState.Minimized:
        return contentHeight - hiddenBoxHeight;
    }
  };

  const handleMaximizeEditorBox = () => {
    if (!editorOpened) {
      setEditorOpened(true);
      dispatch(setEditorBoxState(EditorBoxState.Normal));
      return;
    }
    if (editorBoxState === EditorBoxState.Normal) {
      dispatch(setEditorBoxState(EditorBoxState.FullHeight));
    } else {
      dispatch(setEditorBoxState(EditorBoxState.Normal));
    }
  };

  const getEditorMaximizeBtnTooltip = () => {
    if (!editorOpened) {
      return "open editor box";
    }
    return editorBoxState === EditorBoxState.FullHeight
      ? "shrink editor box"
      : "maximize editor box";
  };

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

    if (flooredXPosition < FIRST_PANEL_MIN_WIDTH) {
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
          floorNumberToOneDecimal(xPosition - panelWidths[0]),
          floorNumberToOneDecimal(layoutWidth - panelWidths[3] - xPosition),
          panelWidths[3],
        ]),
      );
    }
  };

  const handleSearchSeparatorXPositionChange = (xPosition: number) => {
    if (mainPageSearchSeparatorXPosition !== xPosition) {
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
          floorNumberToOneDecimal(xPosition - mainPageCenterSeparatorXPosition),
          floorNumberToOneDecimal(layoutWidth - xPosition),
        ]),
      );
    }
  };

  const handleSeparatorLayoutInit = () => {
    let secondPanel = mainPageCenterSeparatorXPosition - mainPageTreeSeparatorXPosition;
    let thirdPanel = mainPageSearchSeparatorXPosition - mainPageCenterSeparatorXPosition;
    let fourthPanel = layoutWidth - mainPageSearchSeparatorXPosition;

    const tempPanelWidths = [mainPageTreeSeparatorXPosition, secondPanel, thirdPanel, fourthPanel];

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
    // calculate panel widths based on screen width
    const initPercentPanelWidths =
      layoutWidth > LARGE_SCREEN_LIMIT
        ? INIT_PERCENT_PANEL_WIDTHS_LARGE_SCREEN
        : layoutWidth < EXTRA_SMALL_SCREEN_LIMIT
          ? INIT_PERCENT_PANEL_WIDTHS_EXTRA_SMALL_SCREEN
          : layoutWidth < SMALL_SCREEN_LIMIT
            ? INIT_PERCENT_PANEL_WIDTHS_SMALL_SCREEN
            : INIT_PERCENT_PANEL_WIDTHS;

    const initPanelWidthsPx = initPercentPanelWidths.map((percentWidth) =>
      floorNumberToOneDecimal(percentWidth * onePercentOfLayoutWidth),
    );
    dispatch(setPanelWidths(initPanelWidthsPx));
    dispatch(setPanelWidthsPercent(initPercentPanelWidths));
    // set all separators to redux and local storage
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

  const secondPanelWidth = useMemo(() => {
    if (!secondPanelExpanded) {
      dispatch(setSecondPanelRealWidth(COLLAPSED_PANEL_WIDTH));
      return COLLAPSED_PANEL_WIDTH;
    }
    const width =
      (firstPanelExpanded
        ? panelWidths[1]
        : panelWidths[1] + panelWidths[0] - COLLAPSED_PANEL_WIDTH) +
      (!thirdPanelExpanded && !fourthPanelExpanded
        ? panelWidths[2] + panelWidths[3] - 2 * COLLAPSED_PANEL_WIDTH
        : 0);
    dispatch(setSecondPanelRealWidth(width));
    return width;
  }, [
    secondPanelExpanded,
    firstPanelExpanded,
    thirdPanelExpanded,
    fourthPanelExpanded,
    panelWidths,
    dispatch,
  ]);

  const thirdPanelWidth = useMemo(() => {
    let width = !thirdPanelExpanded
      ? COLLAPSED_PANEL_WIDTH
      : fourthPanelExpanded
        ? panelWidths[2]
        : panelWidths[2] + panelWidths[3] - COLLAPSED_PANEL_WIDTH;

    if (!secondPanelExpanded && thirdPanelExpanded) {
      const secondPanelBaseWidth = firstPanelExpanded
        ? panelWidths[1]
        : panelWidths[1] + panelWidths[0] - COLLAPSED_PANEL_WIDTH;
      width += secondPanelBaseWidth - COLLAPSED_PANEL_WIDTH;
    }

    dispatch(setThirdPanelRealWidth(width));
    return width;
  }, [
    secondPanelExpanded,
    firstPanelExpanded,
    thirdPanelExpanded,
    fourthPanelExpanded,
    panelWidths,
    dispatch,
  ]);

  const firstPanelWidth = useMemo(() => {
    if (!firstPanelExpanded) return COLLAPSED_PANEL_WIDTH;
    if (secondPanelExpanded || thirdPanelExpanded || fourthPanelExpanded) {
      return panelWidths[0];
    }
    return layoutWidth - 3 * COLLAPSED_PANEL_WIDTH;
  }, [firstPanelExpanded, secondPanelExpanded, thirdPanelExpanded, fourthPanelExpanded, panelWidths, layoutWidth]);

  const fourthPanelWidth = useMemo(() => {
    if (!fourthPanelExpanded) return COLLAPSED_PANEL_WIDTH;
    return layoutWidth - firstPanelWidth - secondPanelWidth - thirdPanelWidth;
  }, [
    fourthPanelExpanded,
    firstPanelWidth,
    secondPanelWidth,
    thirdPanelWidth,
    layoutWidth,
  ]);

  useEffect(() => {
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
          const isSomethingUndersized =
            Number(localStorageTreeSeparatorXPosition) * onePercentOfLayoutWidth <
              FIRST_PANEL_MIN_WIDTH ||
            (Number(localStorageCenterSeparatorXPosition) -
              Number(localStorageTreeSeparatorXPosition)) *
              onePercentOfLayoutWidth <
              SECOND_PANEL_MIN_WIDTH ||
            (Number(localStorageSearchSeparatorXPosition) -
              Number(localStorageCenterSeparatorXPosition)) *
              onePercentOfLayoutWidth <
              THIRD_PANEL_MIN_WIDTH ||
            (layoutWidth - Number(localStorageSearchSeparatorXPosition)) * onePercentOfLayoutWidth <
              FOURTH_PANEL_MIN_WIDTH;

          if (isSomethingUndersized) {
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
        console.log("layout width changed");
        handleLayoutInit();
      }
    }
  }, [layoutWidth]);

  const treeData: IResponseTree | undefined = queryClient.getQueryData(["tree"]);

  const selectedTerritoryPath = useAppSelector(
    (state) => state.territoryTree.selectedTerritoryPath,
  );

  // Get sibling territories at the same level
  const siblingTerritories = useMemo(() => {
    const parentId = selectedTerritoryPath[selectedTerritoryPath.length - 1];
    if (treeData) {
      const parentTerritory = searchTree(treeData, parentId);
      if (parentTerritory) {
        return parentTerritory.children.map((child) => child.territory.id);
      }
    }
    return [];
  }, [selectedTerritoryPath, treeData]);

  // Get previous and next territory IDs
  const previousTerritoryId = useMemo(() => {
    if (!territoryId || siblingTerritories.length === 0) return null;

    const currentIndex = siblingTerritories.indexOf(territoryId);
    if (currentIndex > 0) {
      return siblingTerritories[currentIndex - 1];
    }
    return null;
  }, [territoryId, siblingTerritories]);

  const nextTerritoryId = useMemo(() => {
    if (!territoryId || siblingTerritories.length === 0) return null;

    const currentIndex = siblingTerritories.indexOf(territoryId);
    if (currentIndex < siblingTerritories.length - 1) {
      return siblingTerritories[currentIndex + 1];
    }
    return null;
  }, [territoryId, siblingTerritories]);

  return (
    <>
      <ScrollHandler />
      {/* TREE SEPARATOR */}
      {mainPageTreeSeparatorXPosition > 0 &&
        firstPanelExpanded &&
        (secondPanelExpanded || thirdPanelExpanded || fourthPanelExpanded) && (
        <LayoutSeparatorVertical
          leftSideMinWidth={FIRST_PANEL_MIN_WIDTH}
          leftSideMaxWidth={
            (thirdPanelExpanded || fourthPanelExpanded)
              ? mainPageCenterSeparatorXPosition - SECOND_PANEL_MIN_WIDTH
              : layoutWidth -
                COLLAPSED_PANEL_WIDTH -
                COLLAPSED_PANEL_WIDTH -
                SECOND_PANEL_MIN_WIDTH
          }
          separatorXPosition={mainPageTreeSeparatorXPosition}
          setSeparatorXPosition={(xPosition) => {
            handleTreeSeparatorXPositionChange(xPosition);
          }}
          onMaxWidthReached={() => {
            if (thirdPanelWidth > THIRD_PANEL_MIN_WIDTH + 10) {
              handleCenterSeparatorXPositionChange(mainPageCenterSeparatorXPosition + 10);
            } else if (fourthPanelWidth > FOURTH_PANEL_MIN_WIDTH + 10) {
              if (!thirdPanelExpanded) {
                handleCenterSeparatorXPositionChange(mainPageCenterSeparatorXPosition + 10);
              } else {
                const newCenterPos = mainPageCenterSeparatorXPosition + 10;
                const newSearchPos = mainPageSearchSeparatorXPosition + 10;

                setMainPageCenterSeparatorXPosition(newCenterPos);
                localStorage.setItem(
                  "mainPageCenterSeparatorXPosition",
                  floorNumberToOneDecimal(newCenterPos / onePercentOfLayoutWidth).toString(),
                );
                setMainPageSearchSeparatorXPosition(newSearchPos);
                localStorage.setItem(
                  "mainPageSearchSeparatorXPosition",
                  floorNumberToOneDecimal(newSearchPos / onePercentOfLayoutWidth).toString(),
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
            }
          }}
        />
      )}

      {/* CENTER SEPARATOR */}
      {mainPageCenterSeparatorXPosition > 0 &&
        secondPanelExpanded &&
        (thirdPanelExpanded || fourthPanelExpanded) && (
        <LayoutSeparatorVertical
          leftSideMinWidth={
            (firstPanelExpanded ? mainPageTreeSeparatorXPosition : COLLAPSED_PANEL_WIDTH) +
            SECOND_PANEL_MIN_WIDTH
          }
          leftSideMaxWidth={
            thirdPanelExpanded
              ? fourthPanelExpanded
                ? layoutWidth - panelWidths[3] - THIRD_PANEL_MIN_WIDTH
                : layoutWidth - COLLAPSED_PANEL_WIDTH - THIRD_PANEL_MIN_WIDTH
              : layoutWidth - COLLAPSED_PANEL_WIDTH - FOURTH_PANEL_MIN_WIDTH
          }
          separatorXPosition={mainPageCenterSeparatorXPosition}
          setSeparatorXPosition={(xPosition) => {
            handleCenterSeparatorXPositionChange(xPosition);
          }}
          onMaxWidthReached={() => {
            if (panelWidths[3] > FOURTH_PANEL_MIN_WIDTH + 10) {
              handleSearchSeparatorXPositionChange(mainPageSearchSeparatorXPosition + 10);
            }
          }}
          onMinWidthReached={() => {
            if (panelWidths[0] > FIRST_PANEL_MIN_WIDTH + 10) {
              handleTreeSeparatorXPositionChange(mainPageTreeSeparatorXPosition - 10);
            }
          }}
        />
      )}

      {/* SEARCH SEPARATOR */}
      {mainPageSearchSeparatorXPosition > 0 && fourthPanelExpanded && thirdPanelExpanded && (
        <LayoutSeparatorVertical
          leftSideMinWidth={
            mainPageCenterSeparatorXPosition +
            (thirdPanelExpanded ? THIRD_PANEL_MIN_WIDTH : COLLAPSED_PANEL_WIDTH)
          }
          leftSideMaxWidth={layoutWidth - FOURTH_PANEL_MIN_WIDTH}
          separatorXPosition={mainPageSearchSeparatorXPosition}
          setSeparatorXPosition={(xPosition) => {
            handleSearchSeparatorXPositionChange(xPosition);
          }}
          onMinWidthReached={() => {
            if (panelWidths[1] > SECOND_PANEL_MIN_WIDTH + 10) {
              handleCenterSeparatorXPositionChange(mainPageCenterSeparatorXPosition - 10);
            } else if (panelWidths[0] > FIRST_PANEL_MIN_WIDTH + 10) {
              const newCenterPos = mainPageCenterSeparatorXPosition - 10;
              const newTreePos = mainPageTreeSeparatorXPosition - 10;

              setMainPageCenterSeparatorXPosition(newCenterPos);
              localStorage.setItem(
                "mainPageCenterSeparatorXPosition",
                floorNumberToOneDecimal(newCenterPos / onePercentOfLayoutWidth).toString(),
              );
              setMainPageTreeSeparatorXPosition(newTreePos);
              localStorage.setItem(
                "mainPageTreeSeparatorXPosition",
                floorNumberToOneDecimal(newTreePos / onePercentOfLayoutWidth).toString(),
              );

              dispatch(
                setPanelWidths([
                  newTreePos,
                  floorNumberToOneDecimal(newCenterPos - newTreePos),
                  floorNumberToOneDecimal(mainPageSearchSeparatorXPosition - newCenterPos),
                  panelWidths[3],
                ]),
              );
            }
          }}
        />
      )}

      {/* FIRST PANEL */}
      <Panel width={firstPanelWidth}>
        <Box
          height={contentHeight}
          label="Territories"
          isExpanded={firstPanelExpanded}
          buttons={[
            refreshBoxButton(["tree", "territory", "user"], !firstPanelExpanded),
            firstPanelButton(),
          ]}
          noFrame
          onHeaderClick={toggleFirstPanel}
        >
          <MemoizedTerritoryTreeBox />
        </Box>
      </Panel>

      {/* SECOND PANEL */}
      <Panel width={secondPanelWidth}>
        {secondPanelExpanded ? (
          <>
            <Box
              label="Statements"
              borderColor="white"
              height={getStatementListBoxHeight()}
              onHeaderClick={() => {
                if (detailBoxState === DetailBoxState.FullHeight) {
                  dispatch(setDetailBoxState(DetailBoxState.Normal));
                }
              }}
              disableHeaderClick={detailBoxState !== DetailBoxState.FullHeight}
              buttons={[
                <>
                  {territoryId && (
                    <ButtonGroup style={{ marginRight: "0.5rem" }}>
                      <Button
                        color="info"
                        icon={<FaDiagramNext style={{ transform: "rotate(180deg)" }} />}
                        tooltipLabel="go to previous territory"
                        onClick={() => {
                          if (previousTerritoryId) {
                            setTerritoryId(previousTerritoryId);
                            if (!statementListOpened) {
                              dispatch(setDetailBoxState(DetailBoxState.Normal));
                            }
                          }
                        }}
                        disabled={!previousTerritoryId}
                      />
                      <Button
                        color="info"
                        icon={<FaDiagramNext />}
                        tooltipLabel="go to next territory"
                        onClick={() => {
                          if (nextTerritoryId) {
                            setTerritoryId(nextTerritoryId);
                            if (!statementListOpened) {
                              dispatch(setDetailBoxState(DetailBoxState.Normal));
                            }
                          }
                        }}
                        disabled={!nextTerritoryId}
                      />
                    </ButtonGroup>
                  )}
                  {/* Admin / Owner / Editor with writer rights */}
                  {hasWriteRightsToSelectedTerritory && territoryId && (
                    <ButtonGroup style={{ marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                      <Button
                        key="add"
                        icon={<FaPlus />}
                        tooltipLabel="add new statement at the end of the list"
                        color="primary"
                        label="statement"
                        onClick={() => {
                          if (user) {
                            addStatementAtTheEndMutation.mutate(
                              CStatement(userRole, user.options, "", "", territoryId),
                            );
                            if (detailBoxState === DetailBoxState.FullHeight) {
                              dispatch(setDetailBoxState(DetailBoxState.Normal));
                            }
                          }
                        }}
                      />
                    </ButtonGroup>
                  )}
                </>,
                statementListOpened &&
                  territoryId &&
                  refreshBoxButton(["territory", "statement", "user"], false),
                secondPanelButton(),
              ]}
            >
              <MemoizedStatementListBox />
            </Box>
            {(selectedDetailId || detailIdArray.length > 0) && (
              <Box
                label="Detail"
                borderColor="white"
                onHeaderClick={handleMaximizeDetailBox}
                disableHeaderClick={detailBoxState === DetailBoxState.FullHeight}
                height={getDetailBoxHeight()}
                disableScroll
                buttons={[
                  <>
                    {userRole !== UserEnums.Role.Viewer && (
                      <Button
                        icon={<FaPlus />}
                        label="entity"
                        onClick={() => setShowEntityCreateModal(true)}
                        tooltipLabel="create new entity"
                      />
                    )}
                  </>,
                  <Button
                    dataTestId="maximize-detail-box"
                    inverted
                    tooltipLabel={getMaximizeBtnTooltip()}
                    icon={
                      detailBoxState === DetailBoxState.Normal ? (
                        <BsSquareFill />
                      ) : (
                        <BsSquareHalf style={{ transform: "rotate(270deg)" }} />
                      )
                    }
                    onClick={handleMaximizeDetailBox}
                  />,
                  <>
                    {detailBoxState !== DetailBoxState.Minimized && (
                      <Button
                        tooltipLabel={"minimize detail box"}
                        inverted
                        icon={<BiHide />}
                        onClick={handleMinimizeDetailBox}
                      />
                    )}
                  </>,
                  <Button
                    inverted
                    tooltipLabel="close all tabs"
                    icon={<VscCloseAll style={{ transform: "scale(1.3)" }} />}
                    onClick={() => {
                      clearAllDetailIds();
                      dispatch(setDetailBoxState(DetailBoxState.Normal));
                    }}
                  />,
                ]}
              >
                <MemoizedEntityDetailBox />
              </Box>
            )}
          </>
        ) : (
          <Box
            height={contentHeight}
            label="Statements"
            borderColor="white"
            isExpanded={false}
            buttons={[secondPanelButton()]}
            onHeaderClick={toggleSecondPanel}
          />
        )}
        {showEntityCreateModal && (
          <EntityCreateModal
            closeModal={() => setShowEntityCreateModal(false)}
            onMutationSuccess={(entity) => {
              if (entity.class !== EntityEnums.Class.Value) {
                appendDetailId(entity.id);
              }
              if (entity.class === EntityEnums.Class.Territory) {
                queryClient.invalidateQueries({ queryKey: ["tree"] });
              }
            }}
          />
        )}
      </Panel>

      {/* THIRD PANEL */}
      <Panel width={thirdPanelWidth}>
        <Box
          borderColor="white"
          height={getAnnotatorBoxHeight()}
          label="Annotator"
          isExpanded={thirdPanelExpanded}
          buttons={[thirdPanelButton()]}
        >
          {showAnnotatorContent ? (
            <MemoizedAnnotatorBox
              height={Math.max(0, (getAnnotatorBoxHeight() ?? 0) - heightHeader)}
              width={(thirdPanelRealWidth || thirdPanelWidth) - 10}
            />
          ) : (
            annotatorVisible && <Loader show />
          )}
        </Box>

        <Box
          borderColor="white"
          height={getEditorBoxHeight()}
          label="Editor"
          isExpanded={thirdPanelExpanded}
          onHeaderClick={handleMaximizeEditorBox}
          disableHeaderClick={editorOpened && editorBoxState === EditorBoxState.FullHeight}
          buttons={[
            <>
              {thirdPanelExpanded && (
                <>
                  <Button
                    key="maximize-editor"
                    inverted
                    tooltipLabel={getEditorMaximizeBtnTooltip()}
                    icon={
                      editorOpened && editorBoxState === EditorBoxState.Normal ? (
                        <BsSquareFill />
                      ) : (
                        <BsSquareHalf style={{ transform: "rotate(270deg)" }} />
                      )
                    }
                    onClick={handleMaximizeEditorBox}
                  />
                </>
              )}
            </>,
            <>
              {thirdPanelExpanded && editorOpened && (
                <Button
                  key="hide-editor"
                  inverted
                  tooltipLabel="minimize editor box"
                  icon={<BiHide />}
                  onClick={() => setEditorOpened(false)}
                />
              )}
            </>,
            thirdPanelButton(),
          ]}
        >
          <MemoizedStatementEditorBox />
        </Box>
      </Panel>

      {/* FOURTH PANEL */}
      <Panel width={fourthPanelWidth}>
        <Box
          height={getFourthPanelBoxHeight("search")}
          label="Search"
          color="white"
          isExpanded={fourthPanelExpanded}
          buttons={[
            refreshBoxButton(["search-templates", "search"], !fourthPanelExpanded),
            hideFourthPanelBoxButton("search"),
            hideFourthPanelButton(),
          ]}
          onHeaderClick={toggleFourthPanel}
          disableHeaderClick
        >
          <MemoizedEntitySearchBox />
        </Box>
        <Box
          height={getFourthPanelBoxHeight("bookmarks")}
          label="Bookmarks"
          color="white"
          isExpanded={fourthPanelExpanded}
          buttons={[
            refreshBoxButton(["bookmarks"], !fourthPanelExpanded),
            hideFourthPanelBoxButton("bookmarks"),
            hideFourthPanelButton(),
          ]}
          onHeaderClick={toggleFourthPanel}
          disableHeaderClick
        >
          <MemoizedEntityBookmarkBox />
        </Box>
        <Box
          height={getFourthPanelBoxHeight("templates")}
          label="Templates"
          color="white"
          isExpanded={fourthPanelExpanded}
          buttons={[
            refreshBoxButton(["templates"], !fourthPanelExpanded),
            hideFourthPanelBoxButton("templates"),
            hideFourthPanelButton(),
          ]}
          onHeaderClick={toggleFourthPanel}
          disableHeaderClick
        >
          <MemoizedTemplateListBox />
        </Box>
      </Panel>
    </>
  );
};

export default MainPage;
