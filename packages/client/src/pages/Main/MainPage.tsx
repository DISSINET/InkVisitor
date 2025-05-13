import { EntityEnums, UserEnums } from "@shared/enums";
import { IStatement } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collapsedPanelWidth,
  FIRST_PANEL_MIN_WIDTH,
  fourthPanelBoxesHeightThirds,
  hiddenBoxHeight,
  INIT_PERCENT_PANEL_WIDTHS,
  MAIN_PAGE_CENTER_SEPARATOR_X_PERCENT_POSITION,
  MAIN_PAGE_TREE_SEPARATOR_X_PERCENT_POSITION,
  SECOND_PANEL_MIN_WIDTH,
  THIRD_PANEL_MIN_WIDTH,
} from "Theme/constants";
import api from "api";
import { Box, Button, ButtonGroup, Panel } from "components";
import {
  EntityCreateModal,
  LayoutSeparatorVertical,
} from "components/advanced";
import { CStatement } from "constructors";
import { useSearchParams } from "hooks";
import ScrollHandler from "hooks/ScrollHandler";
import React, { useEffect, useMemo, useState } from "react";
import { BiHide, BiRefresh, BiShow } from "react-icons/bi";
import { BsSquareFill, BsSquareHalf } from "react-icons/bs";
import { FaHighlighter, FaList, FaPlus } from "react-icons/fa";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { VscCloseAll } from "react-icons/vsc";
import { setDetailBoxState } from "redux/features/layout/mainPage/detailBoxStateSlice";
import { setDetailBoxMinimized } from "redux/features/layout/mainPage/detailBoxMinimizedSlice";
import { setFirstPanelExpanded } from "redux/features/layout/mainPage/firstPanelExpandedSlice";
import { setFourthPanelBoxesOpened } from "redux/features/layout/mainPage/fourthPanelBoxesOpenedSlice";
import { setFourthPanelExpanded } from "redux/features/layout/mainPage/fourthPanelExpandedSlice";
import { setPanelWidthsPercent } from "redux/features/layout/mainPage/panelWidthsPercentSlice";
import { setPanelWidths } from "redux/features/layout/mainPage/panelWidthsSlice";
import { setStatementListOpened } from "redux/features/layout/mainPage/statementListOpenedSlice";
import { setThirdPanelExpanded } from "redux/features/layout/mainPage/thirdPanelExpandedSlice";
import { setDisableStatementListScroll } from "redux/features/statementList/disableStatementListScrollSlice";
import { setIsLoading } from "redux/features/statementList/isLoadingSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { DetailBoxState } from "types";
import { floorNumberToOneDecimal } from "utils/utils";
import { MemoizedEntityBookmarkBox } from "./containers/EntityBookmarkBox/EntityBookmarkBox";
import { MemoizedEntityDetailBox } from "./containers/EntityDetailBox/EntityDetailBox";
import { MemoizedEntitySearchBox } from "./containers/EntitySearchBox/EntitySearchBox";
import { MemoizedStatementEditorBox } from "./containers/StatementEditorBox/StatementEditorBox";
import { MemoizedStatementListBox } from "./containers/StatementsListBox/StatementListBox";
import { MemoizedTemplateListBox } from "./containers/TemplateListBox/TemplateListBox";
import { MemoizedTerritoryTreeBox } from "./containers/TerritoryTreeBox/TerritoryTreeBox";

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
    annotatorOpened,
    setAnnotatorOpened,
  } = useSearchParams();

  const dispatch = useAppDispatch();

  const queryClient = useQueryClient();

  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );
  const panelWidths: number[] = useAppSelector(
    (state) => state.layout.mainPage.panelWidths
  );
  const panelWidthsPercent: number[] = useAppSelector(
    (state) => state.layout.mainPage.panelWidthsPercent
  );
  const fourthPanelBoxesOpened: { [key: string]: boolean } = useAppSelector(
    (state) => state.layout.mainPage.fourthPanelBoxesOpened
  );
  const firstPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.mainPage.firstPanelExpanded
  );
  const thirdPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.mainPage.thirdPanelExpanded
  );
  const fourthPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.mainPage.fourthPanelExpanded
  );
  const statementListOpened: boolean = useAppSelector(
    (state) => state.layout.mainPage.statementListOpened
  );
  const detailBoxMinimized: boolean = useAppSelector(
    (state) => state.layout.mainPage.detailBoxMinimized
  );
  const detailBoxState: DetailBoxState = useAppSelector(
    (state) => state.layout.mainPage.detailBoxState
  );
  const [lastState, setLastState] = useState(DetailBoxState.Normal);

  const toggleFirstPanel = () => {
    if (firstPanelExpanded) {
      dispatch(setFirstPanelExpanded(false));
      localStorage.setItem("firstPanelExpanded", "false");
    } else {
      dispatch(setFirstPanelExpanded(true));
      localStorage.setItem("firstPanelExpanded", "true");
    }
  };

  const firstPanelButton = () => (
    <Button
      onClick={toggleFirstPanel}
      inverted
      icon={firstPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
    />
  );

  const toggleThirdPanel = () => {
    if (thirdPanelExpanded) {
      dispatch(setThirdPanelExpanded(false));
      localStorage.setItem("thirdPanelExpanded", "false");
    } else {
      dispatch(setThirdPanelExpanded(true));
      localStorage.setItem("thirdPanelExpanded", "true");
    }
  };

  const thirdPanelButton = () => (
    <Button
      onClick={toggleThirdPanel}
      inverted
      icon={thirdPanelExpanded ? <RiMenuUnfoldFill /> : <RiMenuFoldFill />}
    />
  );

  const toggleFourthPanel = () => {
    if (fourthPanelExpanded) {
      dispatch(setFourthPanelExpanded(false));
      localStorage.setItem("fourthPanelExpanded", "false");
    } else {
      dispatch(setFourthPanelExpanded(true));
      localStorage.setItem("fourthPanelExpanded", "true");
    }
  };

  const hideFourthPanelButton = () => (
    <Button
      key="hide"
      onClick={toggleFourthPanel}
      inverted
      icon={fourthPanelExpanded ? <RiMenuUnfoldFill /> : <RiMenuFoldFill />}
    />
  );

  const handleHideFourthPanelBoxButtonClick = (
    boxToHide: FourthPanelBoxes,
    isThisBoxHidden: boolean
  ) => {
    if (isThisBoxHidden) {
      const newObject = {
        ...fourthPanelBoxesOpened,
        [boxToHide]: true,
      };
      dispatch(setFourthPanelBoxesOpened(newObject));
      localStorage.setItem("fourthPanelBoxesOpened", JSON.stringify(newObject));
    } else {
      const newObject = {
        ...fourthPanelBoxesOpened,
        [boxToHide]: false,
      };
      dispatch(setFourthPanelBoxesOpened(newObject));
      localStorage.setItem("fourthPanelBoxesOpened", JSON.stringify(newObject));
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
            onClick={() =>
              handleHideFourthPanelBoxButtonClick(boxToHide, isThisBoxHidden)
            }
          />
        )}
      </>
    );
  };

  const refreshBoxButton = (
    queriesToRefresh: string[],
    isThisBoxHidden: boolean
  ) => {
    return isThisBoxHidden ? (
      <></>
    ) : (
      <>
        {queriesToRefresh.length && (
          <Button
            key="refresh queries"
            tooltipLabel="refresh data"
            inverted
            icon={<BiRefresh />}
            onClick={() => {
              queriesToRefresh.forEach((queryToRefresh) => {
                queryClient.invalidateQueries({ queryKey: [queryToRefresh] });
              });
            }}
          />
        )}
      </>
    );
  };

  const getFourthPanelBoxHeight = (box: FourthPanelBoxes): number => {
    const onePercentOfLayoutHeight = contentHeight / 100;

    const isThisBoxHidden = !fourthPanelBoxesOpened[box];
    const openBoxesCount = Object.values(fourthPanelBoxesOpened).filter(
      (b) => b === true
    );

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
    commitTime: any
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

  // get user data
  const userId = localStorage.getItem("userid");
  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    enabled: !!userId && api.isLoggedIn(),
  });

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

      if (detailBoxState === DetailBoxState.Minimized) {
        if (!detailBoxMinimized) {
          dispatch(setDetailBoxMinimized(true));
        }
      } else {
        if (detailBoxMinimized) {
          dispatch(setDetailBoxMinimized(false));
        }
      }
    }
  }, [detailBoxState, statementListOpened, detailBoxMinimized, detailIdArray]);

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

  const minimizeDetailBoxButton = () => {
    return (
      <>
        <Button
          tooltipLabel={
            detailBoxState === DetailBoxState.Minimized
              ? "open detail box"
              : "minimize detail box"
          }
          inverted
          icon={
            detailBoxState === DetailBoxState.Minimized ? (
              <BiShow />
            ) : (
              <BiHide />
            )
          }
          onClick={handleMinimizeDetailBox}
        />
      </>
    );
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

  const onePercentOfLayoutWidth = useMemo(
    () => layoutWidth / 100,
    [layoutWidth]
  );

  // TREE SEPARATOR STATE
  const localStorageTreeSeparatorXPosition = localStorage.getItem(
    "mainPageTreeSeparatorXPosition"
  );
  const [mainPageTreeSeparatorXPosition, setMainPageTreeSeparatorXPosition] =
    useState<number>(
      localStorageTreeSeparatorXPosition
        ? Number(localStorageTreeSeparatorXPosition) * onePercentOfLayoutWidth
        : MAIN_PAGE_TREE_SEPARATOR_X_PERCENT_POSITION * onePercentOfLayoutWidth
    );

  // CENTER SEPARATOR STATE
  const localStorageCenterSeparatorXPosition = localStorage.getItem(
    "mainPageCenterSeparatorXPosition"
  );
  const [
    mainPageCenterSeparatorXPosition,
    setMainPageCenterSeparatorXPosition,
  ] = useState<number>(
    localStorageCenterSeparatorXPosition
      ? Number(localStorageCenterSeparatorXPosition) * onePercentOfLayoutWidth
      : MAIN_PAGE_CENTER_SEPARATOR_X_PERCENT_POSITION * onePercentOfLayoutWidth
  );

  const handleTreeSeparatorXPositionChange = (xPosition: number) => {
    const flooredXPosition = floorNumberToOneDecimal(xPosition);
    if (mainPageTreeSeparatorXPosition !== flooredXPosition) {
      setMainPageTreeSeparatorXPosition(flooredXPosition);

      const separatorXPercentPosition = floorNumberToOneDecimal(
        xPosition / onePercentOfLayoutWidth
      );
      localStorage.setItem(
        "mainPageTreeSeparatorXPosition",
        separatorXPercentPosition.toString()
      );

      dispatch(
        setPanelWidths([
          flooredXPosition,
          floorNumberToOneDecimal(
            mainPageCenterSeparatorXPosition - flooredXPosition
          ),
          panelWidths[2],
          panelWidths[3],
        ])
      );
    }
  };

  const handleCenterSeparatorXPositionChange = (xPosition: number) => {
    if (mainPageCenterSeparatorXPosition !== xPosition) {
      setMainPageCenterSeparatorXPosition(xPosition);

      const separatorXPercentPosition = floorNumberToOneDecimal(
        xPosition / onePercentOfLayoutWidth
      );
      localStorage.setItem(
        "mainPageCenterSeparatorXPosition",
        separatorXPercentPosition.toString()
      );

      dispatch(
        setPanelWidths([
          panelWidths[0],
          floorNumberToOneDecimal(xPosition - panelWidths[0]),
          layoutWidth - panelWidths[3] - xPosition,
          panelWidths[3],
        ])
      );
    }
  };

  const isPanelUndersized = (panelWidth: number, minWidth: number) =>
    panelWidth < minWidth;

  const handleSeparatorLayoutInit = (initPanelWidthsPx: number[]) => {
    let secondPanel =
      mainPageCenterSeparatorXPosition - mainPageTreeSeparatorXPosition;
    let thirdPanel =
      layoutWidth - (mainPageCenterSeparatorXPosition + initPanelWidthsPx[3]);

    const tempPanelWidths = [
      mainPageTreeSeparatorXPosition,
      secondPanel,
      thirdPanel,
      initPanelWidthsPx[3],
    ];

    dispatch(
      setPanelWidths(tempPanelWidths.map((pW) => floorNumberToOneDecimal(pW)))
    );
    dispatch(
      setPanelWidthsPercent(
        tempPanelWidths.map((panelWidth) =>
          floorNumberToOneDecimal(panelWidth / onePercentOfLayoutWidth)
        )
      )
    );
  };

  useEffect(() => {
    if (layoutWidth > 0) {
      const initPanelWidthsPx = INIT_PERCENT_PANEL_WIDTHS.map(
        (percentWidth) => {
          return floorNumberToOneDecimal(
            percentWidth * onePercentOfLayoutWidth
          );
        }
      );
      if (!panelWidths.length) {
        if (
          !localStorageCenterSeparatorXPosition ||
          !localStorageTreeSeparatorXPosition
        ) {
          console.log("first layout init");
          // first layout INIT
          dispatch(setPanelWidths(initPanelWidthsPx));
          dispatch(setPanelWidthsPercent(INIT_PERCENT_PANEL_WIDTHS));
          setMainPageTreeSeparatorXPosition(initPanelWidthsPx[0]);
          localStorage.setItem(
            "mainPageTreeSeparatorXPosition",
            (initPanelWidthsPx[0] / onePercentOfLayoutWidth).toString()
          );
          setMainPageCenterSeparatorXPosition(
            initPanelWidthsPx[0] + initPanelWidthsPx[1]
          );
          localStorage.setItem(
            "mainPageCenterSeparatorXPosition",
            (
              (initPanelWidthsPx[0] + initPanelWidthsPx[1]) /
              onePercentOfLayoutWidth
            ).toString()
          );
        } else {
          // layout init with saved separator
          console.log("init load - separator determines panel widths");
          handleSeparatorLayoutInit(initPanelWidthsPx);
        }
      } else {
        // change of layout width (different monitor) / redirect from different page
        console.log("layout width changed / redirect from different page");
        const panelWidthsPx = panelWidthsPercent.map((percentWidth) => {
          return floorNumberToOneDecimal(
            percentWidth * onePercentOfLayoutWidth
          );
        });
        const firstPanelUndersized = isPanelUndersized(
          panelWidthsPx[0],
          FIRST_PANEL_MIN_WIDTH
        );
        const secondPanelUndersized = isPanelUndersized(
          panelWidthsPx[1],
          SECOND_PANEL_MIN_WIDTH
        );
        const thirdPanelUndersized = isPanelUndersized(
          panelWidthsPx[2],
          THIRD_PANEL_MIN_WIDTH
        );

        if (
          !firstPanelUndersized &&
          !secondPanelUndersized &&
          !thirdPanelUndersized
        ) {
          console.log("not undersized - set calculated width");
          handleSeparatorLayoutInit(panelWidthsPx);
        } else {
          console.log("something is undersized - set init width");
          dispatch(setPanelWidths(initPanelWidthsPx));
          setMainPageTreeSeparatorXPosition(initPanelWidthsPx[0]);
          localStorage.setItem(
            "mainPageTreeSeparatorXPosition",
            (initPanelWidthsPx[0] / onePercentOfLayoutWidth).toString()
          );
          setMainPageCenterSeparatorXPosition(
            initPanelWidthsPx[0] + initPanelWidthsPx[1]
          );
          localStorage.setItem(
            "mainPageCenterSeparatorXPosition",
            (
              (initPanelWidthsPx[0] + initPanelWidthsPx[1]) /
              onePercentOfLayoutWidth
            ).toString()
          );
        }
      }
    }
  }, [layoutWidth]);

  return (
    <>
      <ScrollHandler />
      {/* TREE SEPARATOR */}
      {mainPageTreeSeparatorXPosition > 0 && firstPanelExpanded && (
        <LayoutSeparatorVertical
          leftSideMinWidth={FIRST_PANEL_MIN_WIDTH}
          leftSideMaxWidth={mainPageCenterSeparatorXPosition - 200}
          separatorXPosition={mainPageTreeSeparatorXPosition}
          setSeparatorXPosition={(xPosition) => {
            handleTreeSeparatorXPositionChange(xPosition);
          }}
        />
      )}

      {/* CENTER SEPARATOR */}
      {mainPageCenterSeparatorXPosition > 0 && thirdPanelExpanded && (
        <LayoutSeparatorVertical
          leftSideMinWidth={
            // FIRST_PANEL_MIN_WIDTH + SECOND_PANEL_MIN_WIDTH
            mainPageTreeSeparatorXPosition + 200
          }
          leftSideMaxWidth={
            layoutWidth - panelWidths[3] - THIRD_PANEL_MIN_WIDTH
          }
          separatorXPosition={mainPageCenterSeparatorXPosition}
          setSeparatorXPosition={(xPosition) => {
            handleCenterSeparatorXPositionChange(xPosition);
          }}
        />
      )}

      {/* FIRST PANEL */}
      <Panel width={firstPanelExpanded ? panelWidths[0] : collapsedPanelWidth}>
        <Box
          height={contentHeight}
          label="Territories"
          isExpanded={firstPanelExpanded}
          buttons={[
            refreshBoxButton(["tree", "user"], !firstPanelExpanded),
            firstPanelButton(),
          ]}
          noPadding
          onHeaderClick={toggleFirstPanel}
        >
          <MemoizedTerritoryTreeBox />
        </Box>
      </Panel>

      {/* SECOND PANEL */}
      <Panel
        width={
          (firstPanelExpanded
            ? panelWidths[1]
            : panelWidths[1] + panelWidths[0] - collapsedPanelWidth) +
          (thirdPanelExpanded ? 0 : panelWidths[2] - collapsedPanelWidth) +
          (!fourthPanelExpanded && !thirdPanelExpanded
            ? panelWidths[3] - collapsedPanelWidth
            : 0)
        }
      >
        <Box
          label="Statements"
          borderColor="white"
          height={getStatementListBoxHeight()}
          buttons={[
            <>
              <ButtonGroup style={{ marginLeft: "5px", marginRight: "5px" }}>
                <Button
                  color="success"
                  icon={<FaList />}
                  // label={`list (${territory.statements.length})`}
                  label={`list`}
                  onClick={() => {
                    setAnnotatorOpened(false);
                  }}
                  inverted={!!annotatorOpened}
                ></Button>
                <Button
                  color="success"
                  icon={<FaHighlighter />}
                  label="annotator"
                  onClick={() => {
                    setAnnotatorOpened(true);
                  }}
                  inverted={!annotatorOpened}
                ></Button>
              </ButtonGroup>
              <ButtonGroup style={{ marginLeft: "5px", marginRight: "5px" }}>
                {/* TODO: check if user has write rights to Territory */}
                {userRole !== UserEnums.Role.Viewer && territoryId && (
                  <Button
                    key="add"
                    icon={<FaPlus />}
                    tooltipLabel="add new statement at the end of the list"
                    color="primary"
                    label="statement"
                    onClick={() => {
                      if (user) {
                        addStatementAtTheEndMutation.mutate(
                          CStatement(
                            userRole,
                            user.options,
                            "",
                            "",
                            territoryId
                          )
                        );
                      }
                    }}
                  />
                )}
              </ButtonGroup>
            </>,
            statementListOpened &&
              territoryId &&
              refreshBoxButton(["territory", "statement", "user"], false),
          ]}
        >
          <MemoizedStatementListBox />
        </Box>
        {(selectedDetailId || detailIdArray.length > 0) && (
          <Box
            label="Detail"
            borderColor="white"
            onHeaderClick={handleMaximizeDetailBox}
            height={getDetailBoxHeight()}
            // Scroll is disabled because of the tabs and is handled inside the EntityDetail component
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
              refreshBoxButton(["entity", "user"], false),
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
              minimizeDetailBoxButton(),
              <Button
                inverted
                tooltipLabel="close all tabs"
                icon={<VscCloseAll style={{ transform: "scale(1.3)" }} />}
                onClick={() => {
                  // First ensure statement list is opened
                  dispatch(setStatementListOpened(true));
                  localStorage.setItem("statementListOpened", "true");

                  // Then clear the detail IDs
                  clearAllDetailIds();
                  dispatch(setDetailBoxState(DetailBoxState.Normal));
                }}
              />,
            ]}
          >
            <MemoizedEntityDetailBox />
          </Box>
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
      <Panel
        width={
          !thirdPanelExpanded
            ? collapsedPanelWidth
            : fourthPanelExpanded
            ? panelWidths[2]
            : panelWidths[2] + panelWidths[3] - collapsedPanelWidth
        }
      >
        <Box
          borderColor="white"
          height={contentHeight}
          label="Editor"
          buttons={[thirdPanelButton()]}
          isExpanded={thirdPanelExpanded}
        >
          <MemoizedStatementEditorBox />
        </Box>
      </Panel>

      {/* FOURTH PANEL */}
      <Panel width={fourthPanelExpanded ? panelWidths[3] : collapsedPanelWidth}>
        <Box
          height={getFourthPanelBoxHeight("search")}
          label="Search"
          color="white"
          isExpanded={fourthPanelExpanded}
          buttons={[
            refreshBoxButton(
              ["search-templates", "search"],
              !fourthPanelExpanded
            ),
            hideFourthPanelBoxButton("search"),
            hideFourthPanelButton(),
          ]}
          onHeaderClick={toggleFourthPanel}
          disableOpenBoxHeaderClick
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
          disableOpenBoxHeaderClick
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
          disableOpenBoxHeaderClick
        >
          <MemoizedTemplateListBox />
        </Box>
      </Panel>
    </>
  );
};

export default MainPage;
