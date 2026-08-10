import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IStatement } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Box, Button, ButtonGroup, IconButton, Panel } from "components";
import {
  EntityCreateModal,
  LayoutSeparatorHorizontal,
  LayoutSeparatorVertical,
} from "components/advanced";
import { CStatement } from "constructors";
import { useSearchParams } from "hooks";
import { useTreeQuery, useUserQuery } from "hooks/react-query";
import ScrollHandler from "hooks/ScrollHandler";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BiHide } from "react-icons/bi";
import { BsSquareFill, BsSquareHalf } from "react-icons/bs";
import { FaDiagramNext } from "react-icons/fa6";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { VscClose, VscCloseAll } from "react-icons/vsc";
import { setDetailBoxState } from "redux/features/layout/mainPage/detailBoxStateSlice";
import { setEditorBoxState } from "redux/features/layout/mainPage/editorBoxStateSlice";
import { setSecondPanelExpanded } from "redux/features/layout/mainPage/secondPanelExpandedSlice";
import { setThirdPanelExpanded } from "redux/features/layout/mainPage/thirdPanelExpandedSlice";
import { setDisableStatementListScroll } from "redux/features/statementList/disableStatementListScrollSlice";
import { setIsLoading } from "redux/features/statementList/isLoadingSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  COLLAPSED_PANEL_WIDTH,
  fourthPanelBoxesHeightThirds,
  BOX_HEADER_HEIGHT,
  BOX_CONTENT_BORDER_PX,
  hiddenBoxHeight,
} from "Theme/constants";
import { ButtonSize, DetailBoxState, EditorBoxState } from "types";
import { isLayoutUndersized } from "utils/layoutUtils";
import {
  animateBoxHeightVars,
  animatePanelWidthVars,
  animateSeparatorPositionVars,
} from "utils/layoutTransition";
import { getStoredUserRole } from "utils/userStorage";
import { searchTree } from "utils/utils";
import { RefreshBoxButton } from "./components/RefreshBoxButton";
import { ToggleFourthPanelBoxButton } from "./components/ToggleFourthPanelBoxButton";
import { MemoizedAnnotatorBox } from "./containers/AnnotatorBox/AnnotatorBox";
import { MemoizedEntityBookmarkBox } from "./containers/EntityBookmarkBox/EntityBookmarkBox";
import { MemoizedEntityDetailBox } from "./containers/EntityDetailBox/EntityDetailBox";
import { MemoizedEntitySearchBox } from "./containers/EntitySearchBox/EntitySearchBox";
import { MemoizedStatementEditorBox } from "./containers/StatementEditorBox/StatementEditorBox";
import { MemoizedStatementListBox } from "./containers/StatementsListBox/StatementListBox";
import { MemoizedTemplateListBox } from "./containers/TemplateListBox/TemplateListBox";
import { MemoizedTerritoryTreeBox } from "./containers/TerritoryTreeBox/TerritoryTreeBox";
import { useBoxLayout } from "./hooks/useBoxLayout";
import { usePanelToggles } from "./hooks/usePanelToggles";
import { useTerritoryNavigation } from "./hooks/useTerritoryNavigation";
import { useVerticalSeparators } from "./hooks/useVerticalSeparators";
import { IcoPlusBold } from "Theme/icons";

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
  const prevStatementIdRef = useRef(statementId);
  useEffect(() => {
    const isNewStatement = prevStatementIdRef.current !== statementId;
    prevStatementIdRef.current = statementId;

    if (statementId && isNewStatement) {
      dispatch(setThirdPanelExpanded(true));
      if (!editorOpened || editorBoxState === EditorBoxState.Minimized) {
        setEditorOpened(true);
        dispatch(setEditorBoxState(EditorBoxState.Normal));
      }
    }
  }, [statementId]);

  const prevTerritoryIdRef = useRef(territoryId);
  useEffect(() => {
    const isNewTerritory = prevTerritoryIdRef.current !== territoryId;
    prevTerritoryIdRef.current = territoryId;

    if (territoryId && isNewTerritory) {
      dispatch(setSecondPanelExpanded(true));
    }
  }, [territoryId, dispatch]);

  const prevEditorStateRef = useRef({ editorOpened, editorBoxState });
  useEffect(() => {
    const prev = prevEditorStateRef.current;
    prevEditorStateRef.current = { editorOpened, editorBoxState };

    const wasFullSize = prev.editorOpened && prev.editorBoxState === EditorBoxState.FullHeight;
    const isNowFullSize = editorOpened && editorBoxState === EditorBoxState.FullHeight;

    if (wasFullSize && !isNowFullSize) {
      queryClient.invalidateQueries({ queryKey: ["document"] });
    }
  }, [editorOpened, editorBoxState, queryClient]);

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

  // The annotator Box's header content lives in AnnotatorBox (it owns the
  // resource/document data it is built from); this page only owns the Box
  // itself, so AnnotatorBox reports what to show through onHeaderChange.
  const [annotatorHeader, setAnnotatorHeader] = useState<ReactNode>(null);

  const userRole = getStoredUserRole() as UserEnums.Role;

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

  const { data: treeData } = useTreeQuery();

  // Admin / Owner / Editor with writer rights.
  // The tree node carries the right the server derived for that territory,
  // which follows the assignment down the branch; a user's own rights entry
  // names only the territory it was assigned to, so a write right on an
  // ancestor never appears against its descendants.
  const hasWriteRightsToSelectedTerritory = useMemo(() => {
    if (user?.role === UserEnums.Role.Admin || user?.role === UserEnums.Role.Owner) {
      return true;
    }
    if (!treeData || !territoryId) {
      return false;
    }
    const node = searchTree(treeData, territoryId);
    return (
      node?.right === UserEnums.RoleMode.Write || node?.right === UserEnums.RoleMode.Admin
    );
  }, [user?.role, treeData, territoryId]);

  const {
    detailSeparatorY,
    editorSeparatorY,
    previewDetailSeparatorYPosition,
    previewEditorSeparatorYPosition,
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

  const restoreDetailBox = useCallback(() => {
    dispatch(setDetailBoxState(DetailBoxState.Normal));
  }, [dispatch]);

  const {
    treeSeparator,
    centerSeparator,
    searchSeparator,
    onePercentOfLayoutWidth,
    isFirstRender,
    separatorPositions,
    beginSeparatorDrag,
    previewSeparatorDrag,
    commitSeparatorDrag,
    handleLayoutInit,
  } = useVerticalSeparators();

  const {
    toggleFirstPanel,
    toggleSecondPanel,
    toggleThirdPanel,
    toggleFourthPanel,
    expandThirdPanelLayout,
  } = usePanelToggles({
    treeSeparator,
    centerSeparator,
    searchSeparator,
    onePercentOfLayoutWidth,
  });

  const prevThirdPanelExpandedRef = useRef(thirdPanelExpanded);
  useEffect(() => {
    const wasExpanded = prevThirdPanelExpandedRef.current;
    prevThirdPanelExpandedRef.current = thirdPanelExpanded;

    if (!wasExpanded && thirdPanelExpanded) {
      expandThirdPanelLayout();
    }
  }, [thirdPanelExpanded]);

  const firstPanelButton = () => (
    <IconButton
      onClick={toggleFirstPanel}
      icon={firstPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
    />
  );

  const secondPanelButton = () => (
    <IconButton
      onClick={toggleSecondPanel}
      icon={secondPanelExpanded ? <RiMenuFoldFill /> : <RiMenuUnfoldFill />}
    />
  );

  const reverseThirdPanelIcon = !firstPanelExpanded && !secondPanelExpanded && !fourthPanelExpanded;

  const thirdPanelButton = () => (
    <IconButton
      onClick={toggleThirdPanel}
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
      shape="square"
      size={ButtonSize.Small}
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

  // The panels render from these variables. A separator drag overwrites them
  // directly for the duration of the drag and lands here on drop.
  useLayoutEffect(() => {
    animatePanelWidthVars(
      [firstPanelWidth, secondPanelWidth, thirdPanelWidth, fourthPanelWidth],
      "mainPage",
    );
  }, [firstPanelWidth, secondPanelWidth, thirdPanelWidth, fourthPanelWidth]);

  // Same for the separators, which a drag on any one of them can move.
  useLayoutEffect(() => {
    animateSeparatorPositionVars(separatorPositions, "mainPage");
  }, [separatorPositions.tree, separatorPositions.center, separatorPositions.search]);

  // Same for the boxes a horizontal separator splits, and for the fourth
  // panel's stack. The heights come from getters rather than memos, so the
  // effect has to name the values themselves: reasserting them on a render that
  // had nothing to do with them - a query settling, a ping - would spring the
  // boxes back to the committed layout while a drag is holding them elsewhere.
  const boxHeights = {
    statements: getStatementListBoxHeight(),
    detail: getDetailBoxHeight(),
    annotator: getAnnotatorBoxHeight(),
    editor: getEditorBoxHeight(),
    search: getFourthPanelBoxHeight("search"),
    bookmarks: getFourthPanelBoxHeight("bookmarks"),
    templates: getFourthPanelBoxHeight("templates"),
  };

  useLayoutEffect(() => {
    animateBoxHeightVars(boxHeights, "mainPage");
  }, [
    boxHeights.statements,
    boxHeights.detail,
    boxHeights.annotator,
    boxHeights.editor,
    boxHeights.search,
    boxHeights.bookmarks,
    boxHeights.templates,
  ]);

  // Rebuild the layout when the window cannot hold the panels that are open.
  // Only then: a separator that runs out of room stops at its boundary and the
  // layout it leaves behind is the one the user asked for, so a panel sitting on
  // its minimum is not a reason to throw their widths away.
  useEffect(() => {
    if (layoutWidth > 0 && panelWidths.length && !isFirstRender.current) {
      if (
        isLayoutUndersized(
          [firstPanelExpanded, secondPanelExpanded, thirdPanelExpanded, fourthPanelExpanded],
          layoutWidth,
        )
      ) {
        handleLayoutInit();
      }
    }
  }, [
    layoutWidth,
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
            positionVarKey="tree"
            separatorXPosition={treeSeparator.position}
            onDragStart={beginSeparatorDrag}
            resolveDrag={(xPosition) => previewSeparatorDrag("tree", xPosition)}
            setSeparatorXPosition={(xPosition) => commitSeparatorDrag("tree", xPosition)}
          />
        )}

      {/* CENTER SEPARATOR */}
      {centerSeparator.position > 0 &&
        secondPanelExpanded &&
        (thirdPanelExpanded || fourthPanelExpanded) && (
          <LayoutSeparatorVertical
            positionVarKey="center"
            separatorXPosition={centerSeparator.position}
            onDragStart={beginSeparatorDrag}
            resolveDrag={(xPosition) => previewSeparatorDrag("center", xPosition)}
            setSeparatorXPosition={(xPosition) => commitSeparatorDrag("center", xPosition)}
          />
        )}

      {/* SEARCH SEPARATOR */}
      {searchSeparator.position > 0 && fourthPanelExpanded && thirdPanelExpanded && (
        <LayoutSeparatorVertical
          positionVarKey="search"
          separatorXPosition={searchSeparator.position}
          onDragStart={beginSeparatorDrag}
          resolveDrag={(xPosition) => previewSeparatorDrag("search", xPosition)}
          setSeparatorXPosition={(xPosition) => commitSeparatorDrag("search", xPosition)}
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
            applyPreview={previewDetailSeparatorYPosition}
            panelIndex={1}
            boxHeightVarKey="statements"
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
            applyPreview={previewEditorSeparatorYPosition}
            panelIndex={2}
            boxHeightVarKey="annotator"
          />
        )}

      {/* FIRST PANEL */}
      <Panel width={firstPanelWidth} widthVarIndex={0}>
        <Box
          height={contentHeight}
          label="Territories"
          isExpanded={firstPanelExpanded}
          buttons={[
            <RefreshBoxButton
              queriesToRefresh={["tree", "territory", "user"]}
              isHidden={!firstPanelExpanded}
            />,
            firstPanelButton(),
          ]}
          noFrame
          onHeaderClick={toggleFirstPanel}
        >
          <MemoizedTerritoryTreeBox />
        </Box>
      </Panel>

      {/* SECOND PANEL */}
      <Panel width={secondPanelWidth} widthVarIndex={1}>
        {secondPanelExpanded ? (
          <>
            <Box
              label="Statements"
              borderColor="white"
              height={getStatementListBoxHeight()}
              heightVarKey="statements"
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
                      <IconButton
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
                        inverted={false}
                      />
                      <IconButton
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
                        inverted={false}
                      />
                    </ButtonGroup>
                  )}
                  {/* Admin / Owner / Editor with writer rights */}
                  {hasWriteRightsToSelectedTerritory && territoryId && (
                    <ButtonGroup style={{ marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                      <Button
                        key="add"
                        icon={<IcoPlusBold />}
                        tooltipLabel="add new statement at the end of the list"
                        color="primary"
                        inverted
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
                statementListOpened && territoryId && (
                  <RefreshBoxButton
                    queriesToRefresh={["territory", "statement", "user"]}
                    isHidden={false}
                  />
                ),
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
                heightVarKey="detail"
                disableScroll
                buttons={[
                  <>
                    {userRole !== UserEnums.Role.Viewer && (
                      <Button
                        icon={<IcoPlusBold />}
                        label="entity"
                        inverted
                        onClick={() => setShowEntityCreateModal(true)}
                        tooltipLabel="create new entity"
                      />
                    )}
                  </>,
                  <IconButton
                    dataTestId="maximize-detail-box"
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
                      <IconButton
                        tooltipLabel={"minimize detail box"}
                        icon={<BiHide />}
                        onClick={handleMinimizeDetailBox}
                      />
                    )}
                  </>,
                  <IconButton
                    tooltipLabel="close all tabs"
                    icon={<VscCloseAll style={{ transform: "scale(1.3)" }} />}
                    onClick={() => {
                      clearAllDetailIds();
                      dispatch(setDetailBoxState(DetailBoxState.Normal));
                    }}
                  />,
                ]}
              >
                <MemoizedEntityDetailBox
                  isMinimized={detailBoxState === DetailBoxState.Minimized}
                  onRestore={restoreDetailBox}
                />
              </Box>
            )}
          </>
        ) : (
          <>
            <Box
              height={getStatementListBoxHeight()}
              heightVarKey="statements"
              label="Statements"
              borderColor="white"
              isExpanded={false}
              buttons={[secondPanelButton()]}
              onHeaderClick={toggleSecondPanel}
            />
            {(selectedDetailId || detailIdArray.length > 0) && (
              <Box
                height={getDetailBoxHeight()}
                heightVarKey="detail"
                label="Detail"
                borderColor="white"
                isExpanded={false}
                buttons={[secondPanelButton()]}
                onHeaderClick={toggleSecondPanel}
              />
            )}
          </>
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
      <Panel width={thirdPanelWidth} widthVarIndex={2}>
        <Box
          borderColor="white"
          height={getAnnotatorBoxHeight()}
          heightVarKey="annotator"
          label="Annotator"
          headerComponent={annotatorHeader}
          // Document identity fills the free header space; the caption and the
          // panel button stay visible, so the header content yields, not them.
          shrinkLabel={false}
          isExpanded={thirdPanelExpanded}
          buttons={[thirdPanelButton()]}
        >
          <MemoizedAnnotatorBox
            height={Math.max(
              0,
              (getAnnotatorBoxHeight() ?? 0) - BOX_HEADER_HEIGHT - 1.5 * BOX_CONTENT_BORDER_PX,
            )}
            width={thirdPanelWidth - 10}
            onHeaderChange={setAnnotatorHeader}
          />
        </Box>

        {statementId && (
          <Box
            borderColor="white"
            height={getEditorBoxHeight()}
            heightVarKey="editor"
            label="Editor"
            isExpanded={thirdPanelExpanded}
            onHeaderClick={handleMaximizeEditorBox}
            disableHeaderClick
            buttons={[
              <>
                {thirdPanelExpanded && (
                  <>
                    <IconButton
                      key="maximize-editor"
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
                  <IconButton
                    key="hide-editor"
                    tooltipLabel="minimize editor box"
                    icon={<BiHide />}
                    onClick={() => setEditorOpened(false)}
                  />
                )}
              </>,
              <>
                {thirdPanelExpanded && (
                  <IconButton
                    key="close-editor"
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
      <Panel width={fourthPanelWidth} widthVarIndex={3}>
        <Box
          height={getFourthPanelBoxHeight("search")}
          heightVarKey="search"
          label="Search"
          color="white"
          isExpanded={fourthPanelExpanded}
          buttons={[
            <RefreshBoxButton
              queriesToRefresh={["search-templates", "search"]}
              isHidden={!fourthPanelExpanded}
            />,
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
          heightVarKey="bookmarks"
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
          heightVarKey="templates"
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
