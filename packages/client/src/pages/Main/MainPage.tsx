import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IStatement } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Box, Button, ButtonGroup, Panel } from "components";
import {
  EntityCreateModal,
  LayoutSeparatorHorizontal,
  LayoutSeparatorVertical,
} from "components/advanced";
import { CStatement } from "constructors";
import { useSearchParams } from "hooks";
import { useUserQuery } from "hooks/react-query";
import ScrollHandler from "hooks/ScrollHandler";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BiHide } from "react-icons/bi";
import { BsSquareFill, BsSquareHalf } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { FaDiagramNext } from "react-icons/fa6";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { VscClose, VscCloseAll } from "react-icons/vsc";
import { setDetailBoxState } from "redux/features/layout/mainPage/detailBoxStateSlice";
import { setEditorBoxState } from "redux/features/layout/mainPage/editorBoxStateSlice";
import { ToggleFourthPanelBoxButton } from "./components/ToggleFourthPanelBoxButton";
import { RefreshBoxButton } from "./components/RefreshBoxButton";
import { setPanelWidths } from "redux/features/layout/mainPage/panelWidthsSlice";
import { setSecondPanelRealWidth } from "redux/features/layout/mainPage/secondPanelRealWidthSlice";
import { setThirdPanelRealWidth } from "redux/features/layout/mainPage/thirdPanelRealWidthSlice";
import { setDisableStatementListScroll } from "redux/features/statementList/disableStatementListScrollSlice";
import { setIsLoading } from "redux/features/statementList/isLoadingSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  COLLAPSED_PANEL_WIDTH,
  FIRST_PANEL_MIN_WIDTH,
  FOURTH_PANEL_MIN_WIDTH,
  fourthPanelBoxesHeightThirds,
  heightHeader,
  hiddenBoxHeight,
  SECOND_PANEL_MIN_WIDTH,
  THIRD_PANEL_MIN_WIDTH,
} from "Theme/constants";
import { DetailBoxState, EditorBoxState } from "types";
import { floorNumberToOneDecimal } from "utils/utils";
import { MemoizedAnnotatorBox } from "./containers/AnnotatorBox/AnnotatorBox";
import { MemoizedEntityBookmarkBox } from "./containers/EntityBookmarkBox/EntityBookmarkBox";
import { MemoizedEntityDetailBox } from "./containers/EntityDetailBox/EntityDetailBox";
import { MemoizedEntitySearchBox } from "./containers/EntitySearchBox/EntitySearchBox";
import { MemoizedStatementEditorBox } from "./containers/StatementEditorBox/StatementEditorBox";
import { MemoizedStatementListBox } from "./containers/StatementsListBox/StatementListBox";
import { MemoizedTemplateListBox } from "./containers/TemplateListBox/TemplateListBox";
import { MemoizedTerritoryTreeBox } from "./containers/TerritoryTreeBox/TerritoryTreeBox";
import { useBoxLayout } from "./hooks/useBoxLayout";
import { useVerticalSeparators } from "./hooks/useVerticalSeparators";
import { usePanelToggles } from "./hooks/usePanelToggles";
import { useTerritoryNavigation } from "./hooks/useTerritoryNavigation";

type FourthPanelBoxes = "search" | "bookmarks" | "templates";

interface MainPage {}

const MainPage: React.FC<MainPage> = ({}) => {
  const {
    territoryId,
    statementId,
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
  useEffect(() => {
    if (statementId && (!editorOpened || editorBoxState === EditorBoxState.Minimized)) {
      setEditorOpened(true);
      dispatch(setEditorBoxState(EditorBoxState.Normal));
    }
  }, [statementId]);

  const prevEditorBoxStateRef = useRef(editorBoxState);
  useEffect(() => {
    const wasFullHeight = prevEditorBoxStateRef.current === EditorBoxState.FullHeight;
    prevEditorBoxStateRef.current = editorBoxState;

    if (wasFullHeight && editorBoxState !== EditorBoxState.FullHeight) {
      queryClient.invalidateQueries({ queryKey: ["document"] });
    }
  }, [editorBoxState, queryClient]);

  useEffect(() => {
    if (thirdPanelExpanded && editorBoxState !== EditorBoxState.FullHeight) {
      queryClient.invalidateQueries({ queryKey: ["document"] });
    }
  }, [thirdPanelExpanded]);

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

  const {
    detailSeparatorY,
    editorSeparatorY,
    handleDetailSeparatorYChange,
    handleEditorSeparatorYChange,
    getStatementListBoxHeight,
    getDetailBoxHeight,
    getEditorBoxHeight,
    getAnnotatorBoxHeight,
    handleMaximizeDetailBox,
    handleMinimizeDetailBox,
    handleMaximizeEditorBox,
    getMaximizeBtnTooltip,
    getEditorMaximizeBtnTooltip,
  } = useBoxLayout({
    detailIdArrayLength: detailIdArray.length,
    statementId,
    editorOpened,
    setEditorOpened,
  });

  const {
    treeSeparator,
    centerSeparator,
    searchSeparator,
    onePercentOfLayoutWidth,
    isFirstRender,
    handleTreeSeparatorXPositionChange,
    handleCenterSeparatorXPositionChange,
    handleSearchSeparatorXPositionChange,
    handleLayoutInit,
  } = useVerticalSeparators();

  const { toggleFirstPanel, toggleSecondPanel, toggleThirdPanel, toggleFourthPanel } =
    usePanelToggles({
      treeSeparator,
      centerSeparator,
      searchSeparator,
      onePercentOfLayoutWidth,
    });

  const firstPanelButton = () => (
    <Button
      onClick={toggleFirstPanel}
      inverted
      icon={firstPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
    />
  );

  const secondPanelButton = () => (
    <Button
      onClick={toggleSecondPanel}
      inverted
      icon={secondPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
    />
  );

  const reverseThirdPanelIcon =
    !firstPanelExpanded ||
    !secondPanelExpanded ||
    (!thirdPanelExpanded && fourthPanelExpanded) ||
    (firstPanelExpanded &&
      secondPanelExpanded &&
      thirdPanelExpanded &&
      fourthPanelExpanded);

  const thirdPanelButton = () => (
    <Button
      onClick={toggleThirdPanel}
      inverted
      icon={
        reverseThirdPanelIcon ? (
          thirdPanelExpanded ? (
            <RiMenuFoldFill />
          ) : (
            <RiMenuUnfoldFill />
          )
        ) : thirdPanelExpanded ? (
          <RiMenuUnfoldFill />
        ) : (
          <RiMenuFoldFill />
        )
      }
    />
  );

  const reverseFourthPanelIcon = !firstPanelExpanded && !secondPanelExpanded && !thirdPanelExpanded;

  const hideFourthPanelButton = () => (
    <Button
      key="hide"
      onClick={toggleFourthPanel}
      inverted
      icon={
        reverseFourthPanelIcon ? (
          fourthPanelExpanded ? (
            <RiMenuFoldFill />
          ) : (
            <RiMenuUnfoldFill />
          )
        ) : fourthPanelExpanded ? (
          <RiMenuUnfoldFill />
        ) : (
          <RiMenuFoldFill />
        )
      }
    />
  );

  const secondPanelWidth = useMemo(() => {
    if (!secondPanelExpanded) {
      return COLLAPSED_PANEL_WIDTH;
    }
    return (
      (firstPanelExpanded
        ? panelWidths[1]
        : panelWidths[1] + panelWidths[0] - COLLAPSED_PANEL_WIDTH) +
      (!thirdPanelExpanded && !fourthPanelExpanded
        ? panelWidths[2] + panelWidths[3] - 2 * COLLAPSED_PANEL_WIDTH
        : 0)
    );
  }, [
    secondPanelExpanded,
    firstPanelExpanded,
    thirdPanelExpanded,
    fourthPanelExpanded,
    panelWidths,
  ]);

  useEffect(() => {
    dispatch(setSecondPanelRealWidth(secondPanelWidth));
  }, [secondPanelWidth, dispatch]);

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

    return width;
  }, [
    secondPanelExpanded,
    firstPanelExpanded,
    thirdPanelExpanded,
    fourthPanelExpanded,
    panelWidths,
  ]);

  useEffect(() => {
    dispatch(setThirdPanelRealWidth(thirdPanelWidth));
  }, [thirdPanelWidth, dispatch]);

  const firstPanelWidth = useMemo(() => {
    if (!firstPanelExpanded) return COLLAPSED_PANEL_WIDTH;
    if (secondPanelExpanded || thirdPanelExpanded || fourthPanelExpanded) {
      return panelWidths[0];
    }
    return layoutWidth - 3 * COLLAPSED_PANEL_WIDTH;
  }, [
    firstPanelExpanded,
    secondPanelExpanded,
    thirdPanelExpanded,
    fourthPanelExpanded,
    panelWidths,
    layoutWidth,
  ]);

  const fourthPanelWidth = useMemo(() => {
    if (!fourthPanelExpanded) return COLLAPSED_PANEL_WIDTH;
    return layoutWidth - firstPanelWidth - secondPanelWidth - thirdPanelWidth;
  }, [fourthPanelExpanded, firstPanelWidth, secondPanelWidth, thirdPanelWidth, layoutWidth]);

  // double check for errors after opening the panel and recalculating sizes
  useEffect(() => {
    if (layoutWidth > 0 && panelWidths.length && !isFirstRender.current) {
      const isUndersized =
        (firstPanelExpanded && firstPanelWidth < FIRST_PANEL_MIN_WIDTH) ||
        (secondPanelExpanded && secondPanelWidth < SECOND_PANEL_MIN_WIDTH) ||
        (thirdPanelExpanded && thirdPanelWidth < THIRD_PANEL_MIN_WIDTH) ||
        (fourthPanelExpanded && fourthPanelWidth < FOURTH_PANEL_MIN_WIDTH);

      if (isUndersized) {
        handleLayoutInit();
      }
    }
  }, [
    firstPanelWidth,
    secondPanelWidth,
    thirdPanelWidth,
    fourthPanelWidth,
    firstPanelExpanded,
    secondPanelExpanded,
    thirdPanelExpanded,
    fourthPanelExpanded,
  ]);

  const { previousTerritoryId, nextTerritoryId } = useTerritoryNavigation(territoryId);

  return (
    <>
      <ScrollHandler />
      {/* TREE SEPARATOR */}
      {treeSeparator.position > 0 &&
        firstPanelExpanded &&
        (secondPanelExpanded || thirdPanelExpanded || fourthPanelExpanded) && (
          <LayoutSeparatorVertical
            leftSideMinWidth={FIRST_PANEL_MIN_WIDTH}
            leftSideMaxWidth={
              secondPanelExpanded
                ? thirdPanelExpanded || fourthPanelExpanded
                  ? centerSeparator.position - SECOND_PANEL_MIN_WIDTH
                  : layoutWidth - 2 * COLLAPSED_PANEL_WIDTH - SECOND_PANEL_MIN_WIDTH
                : thirdPanelExpanded
                  ? searchSeparator.position - THIRD_PANEL_MIN_WIDTH - COLLAPSED_PANEL_WIDTH
                  : layoutWidth -
                    (fourthPanelExpanded ? panelWidths[3] : COLLAPSED_PANEL_WIDTH) -
                    COLLAPSED_PANEL_WIDTH -
                    COLLAPSED_PANEL_WIDTH
            }
            separatorXPosition={treeSeparator.position}
            setSeparatorXPosition={(xPosition) => {
              handleTreeSeparatorXPositionChange(xPosition);
            }}
            onMaxWidthReached={(overflow) => {
              if (thirdPanelWidth > THIRD_PANEL_MIN_WIDTH + overflow) {
                handleCenterSeparatorXPositionChange(centerSeparator.position + overflow);
              } else if (fourthPanelWidth > FOURTH_PANEL_MIN_WIDTH + overflow) {
                if (!thirdPanelExpanded) {
                  handleCenterSeparatorXPositionChange(centerSeparator.position + overflow);
                } else {
                  const newCenterPos = centerSeparator.position + overflow;
                  const newSearchPos = searchSeparator.position + overflow;

                  centerSeparator.setPosition(newCenterPos);
                  localStorage.setItem(
                    "mainPageCenterSeparatorXPosition",
                    floorNumberToOneDecimal(newCenterPos / onePercentOfLayoutWidth).toString(),
                  );
                  searchSeparator.setPosition(newSearchPos);
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
      {centerSeparator.position > 0 &&
        secondPanelExpanded &&
        (thirdPanelExpanded || fourthPanelExpanded) && (
          <LayoutSeparatorVertical
            leftSideMinWidth={
              (firstPanelExpanded ? treeSeparator.position : COLLAPSED_PANEL_WIDTH) +
              SECOND_PANEL_MIN_WIDTH
            }
            leftSideMaxWidth={
              thirdPanelExpanded
                ? fourthPanelExpanded
                  ? layoutWidth - panelWidths[3] - THIRD_PANEL_MIN_WIDTH
                  : layoutWidth - COLLAPSED_PANEL_WIDTH - THIRD_PANEL_MIN_WIDTH
                : layoutWidth - COLLAPSED_PANEL_WIDTH - FOURTH_PANEL_MIN_WIDTH
            }
            separatorXPosition={centerSeparator.position}
            setSeparatorXPosition={(xPosition) => {
              handleCenterSeparatorXPositionChange(xPosition);
            }}
            onMaxWidthReached={(overflow) => {
              if (panelWidths[3] > FOURTH_PANEL_MIN_WIDTH + overflow) {
                handleSearchSeparatorXPositionChange(searchSeparator.position + overflow);
              }
            }}
            onMinWidthReached={(overflow) => {
              if (panelWidths[0] > FIRST_PANEL_MIN_WIDTH + overflow) {
                handleTreeSeparatorXPositionChange(treeSeparator.position - overflow);
              }
            }}
          />
        )}

      {/* SEARCH SEPARATOR */}
      {searchSeparator.position > 0 && fourthPanelExpanded && thirdPanelExpanded && (
        <LayoutSeparatorVertical
          leftSideMinWidth={
            (secondPanelExpanded
              ? centerSeparator.position
              : (firstPanelExpanded ? panelWidths[0] : COLLAPSED_PANEL_WIDTH) +
                COLLAPSED_PANEL_WIDTH) +
            (thirdPanelExpanded ? THIRD_PANEL_MIN_WIDTH : COLLAPSED_PANEL_WIDTH)
          }
          leftSideMaxWidth={layoutWidth - FOURTH_PANEL_MIN_WIDTH}
          separatorXPosition={searchSeparator.position}
          setSeparatorXPosition={(xPosition) => {
            handleSearchSeparatorXPositionChange(xPosition);
          }}
          onMinWidthReached={(overflow) => {
            if (panelWidths[1] > SECOND_PANEL_MIN_WIDTH + overflow) {
              handleCenterSeparatorXPositionChange(centerSeparator.position - overflow);
            } else if (panelWidths[0] > FIRST_PANEL_MIN_WIDTH + overflow) {
              const newCenterPos = centerSeparator.position - overflow;
              const newTreePos = treeSeparator.position - overflow;

              centerSeparator.setPosition(newCenterPos);
              localStorage.setItem(
                "mainPageCenterSeparatorXPosition",
                floorNumberToOneDecimal(newCenterPos / onePercentOfLayoutWidth).toString(),
              );
              treeSeparator.setPosition(newTreePos);
              localStorage.setItem(
                "mainPageTreeSeparatorXPosition",
                floorNumberToOneDecimal(newTreePos / onePercentOfLayoutWidth).toString(),
              );

              dispatch(
                setPanelWidths([
                  newTreePos,
                  floorNumberToOneDecimal(newCenterPos - newTreePos),
                  floorNumberToOneDecimal(searchSeparator.position - newCenterPos),
                  panelWidths[3],
                ]),
              );
            }
          }}
        />
      )}

      {/* DETAIL HORIZONTAL SEPARATOR (second panel) */}
      {secondPanelExpanded &&
        detailIdArray.length > 0 &&
        detailBoxState === DetailBoxState.Normal && (
          <LayoutSeparatorHorizontal
            topPositionMin={hiddenBoxHeight * 2}
            topPositionMax={contentHeight - hiddenBoxHeight * 2}
            separatorYPosition={detailSeparatorY}
            setSeparatorYPosition={handleDetailSeparatorYChange}
            width={secondPanelWidth}
            left={firstPanelWidth}
          />
        )}

      {/* EDITOR HORIZONTAL SEPARATOR (third panel) */}
      {thirdPanelExpanded &&
        statementId &&
        editorOpened &&
        editorBoxState === EditorBoxState.Normal && (
          <LayoutSeparatorHorizontal
            topPositionMin={hiddenBoxHeight * 2}
            topPositionMax={contentHeight - hiddenBoxHeight * 2}
            separatorYPosition={editorSeparatorY}
            setSeparatorYPosition={handleEditorSeparatorYChange}
            width={thirdPanelWidth}
            left={firstPanelWidth + secondPanelWidth}
          />
        )}

      {/* FIRST PANEL */}
      <Panel width={firstPanelWidth}>
        <Box
          height={contentHeight}
          label="Territories"
          isExpanded={firstPanelExpanded}
          buttons={[
            <RefreshBoxButton queriesToRefresh={["tree", "territory", "user"]} isHidden={!firstPanelExpanded} />,
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
                  <RefreshBoxButton queriesToRefresh={["territory", "statement", "user"]} isHidden={false} />,
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
          <MemoizedAnnotatorBox
            height={Math.max(0, (getAnnotatorBoxHeight() ?? 0) - heightHeader)}
            width={(thirdPanelRealWidth || thirdPanelWidth) - 10}
          />
        </Box>

        {statementId && (
          <Box
            borderColor="white"
            height={getEditorBoxHeight()}
            label="Editor"
            isExpanded={thirdPanelExpanded}
            onHeaderClick={handleMaximizeEditorBox}
            disableHeaderClick
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
              <>
                {thirdPanelExpanded && (
                  <Button
                    key="close-editor"
                    inverted
                    tooltipLabel="close editor box"
                    icon={<VscClose style={{ transform: "scale(1.3)" }} />}
                    onClick={() => {
                      setStatementId("");
                      dispatch(setEditorBoxState(EditorBoxState.Normal));
                    }}
                  />
                )}
              </>,
              thirdPanelButton(),
            ]}
          >
            <MemoizedStatementEditorBox />
          </Box>
        )}
      </Panel>

      {/* FOURTH PANEL */}
      <Panel width={fourthPanelWidth}>
        <Box
          height={getFourthPanelBoxHeight("search")}
          label="Search"
          color="white"
          isExpanded={fourthPanelExpanded}
          buttons={[
            <RefreshBoxButton queriesToRefresh={["search-templates", "search"]} isHidden={!fourthPanelExpanded} />,
            <ToggleFourthPanelBoxButton boxToHide="search" />,
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
            <RefreshBoxButton queriesToRefresh={["bookmarks"]} isHidden={!fourthPanelExpanded} />,
            <ToggleFourthPanelBoxButton boxToHide="bookmarks" />,
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
            <RefreshBoxButton queriesToRefresh={["templates"]} isHidden={!fourthPanelExpanded} />,
            <ToggleFourthPanelBoxButton boxToHide="templates" />,
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
