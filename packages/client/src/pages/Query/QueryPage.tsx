import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { Explore } from "@inkvisitor/shared/types/query";
import api from "api";
import { Box, Button, ButtonGroup, Panel } from "components";
import { LayoutSeparatorHorizontal, LayoutSeparatorVertical } from "components/advanced";
import { useSearchParams } from "hooks/useSearchParamsContext";
import { MemoizedEntityDetailBox } from "pages/Main/containers/EntityDetailBox/EntityDetailBox";
import { BiBarChartAlt2, BiRefresh, BiSearch, BiTable } from "react-icons/bi";
import { BsSquareFill, BsSquareHalf } from "react-icons/bs";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { VscCloseAll } from "react-icons/vsc";
import { toast } from "react-toastify";
import { useUserQuery } from "hooks/react-query";
import { UserEnums } from "@inkvisitor/shared/enums";
import { useAppSelector } from "redux/hooks";
import { COLLAPSED_PANEL_WIDTH } from "Theme/constants";
import { floorNumberToOneDecimal } from "utils/utils";
import { MemoizedExplorerBox } from "./Explorer/ExplorerBox";
import {
  defaultExploreStatsParams,
  ExploreActionType,
  exploreReducer,
  exploreStateInitial,
} from "./Explorer/state";
import { MemoizedQueryBox } from "./Query/QueryBox";
import { queryReducer, queryStateInitial } from "./Query/state";
import { getAllEdges, getAllNodes, isQueryRequestEmpty } from "./Query/utils";
import {
  QUERY_LEFT_PANEL_MIN_WIDTH,
  QUERY_PAGE_SEPARATOR_X_PERCENT_POSITION,
  QUERY_RIGHT_PANEL_MIN_WIDTH,
  QUERY_SEARCH_PANEL_MIN_HEIGHT,
  QueryValidity,
  QueryValidityProblem,
} from "./types";
import { invalidateAllExplorerQueries, useQueryData } from "./useQueryData";
import { buildStableSignature, isEdgeValid } from "./utils";
interface QueryPage {}
export const QueryPage: React.FC<QueryPage> = ({}) => {
  const layoutWidth: number = useAppSelector((state) => state.layout.layoutWidth);
  const contentHeight: number = useAppSelector((state) => state.layout.contentHeight);

  const { data: userData } = useUserQuery(true);
  const canBatchEdit =
    userData?.role === UserEnums.Role.Owner || userData?.role === UserEnums.Role.Admin;
  const {
    selectedDetailId,
    detailIdArray,
    clearAllDetailIds,
    appendDetailId,
    setSelectedDetailId,
    replaceDetailIds,
  } = useSearchParams();

  const QUERY_DETAIL_MAX_TABS = 14;
  const [queryState, queryStateDispatch] = useReducer(queryReducer, queryStateInitial);

  /**
   * Collects all problems with the query state
   */

  const queryStateValidity = useMemo<QueryValidity>(() => {
    let isValid = true;
    let problems: QueryValidityProblem[] = [];

    const allEdges = getAllEdges(queryState);
    const allNodes = getAllNodes(queryState);

    allNodes.forEach((node) => {
      // if edge is invalid for the source node
      node.edges.forEach((edge) => {
        if (!isEdgeValid(node, edge)) {
          isValid = false;
          problems.push({
            source: edge.id,
            text: "Invalid edge",
          });
        }
      });
    });

    // // if edge has an invalid target node
    // allEdges.forEach((edge) => {
    //   if (!Query.isTargetNodeValid(edge.node.type, edge.type)) {
    //     isValid = false;
    //     problems.push({
    //       source: edge.node.id,
    //       text: "Invalid target node",
    //     });
    //   }
    // });

    return {
      problems,
      isValid,
    };
  }, [queryState]);

  const [exploreState, exploreStateDispatch] = useReducer(exploreReducer, exploreStateInitial);

  // Explorer view mode (Table / Stats) toggle, surfaced as Box header buttons.
  // Preserve the inactive view's config so toggling does not lose columns / stats.
  const lastColumnsRef = useRef<Explore.IExploreColumn[]>([]);
  const lastStatsRef = useRef<Explore.IExploreStatsParams>(defaultExploreStatsParams);
  useEffect(() => {
    if (exploreState.view.mode === Explore.EViewMode.Table) {
      lastColumnsRef.current = exploreState.view.columns;
    } else {
      lastStatsRef.current = exploreState.view.stats;
    }
  }, [exploreState.view]);

  const setExploreViewMode = (mode: Explore.EViewMode) => {
    if (mode === exploreState.view.mode) {
      return;
    }
    const nextView: Explore.IView =
      mode === Explore.EViewMode.Stats
        ? { mode: Explore.EViewMode.Stats, stats: lastStatsRef.current }
        : { mode: Explore.EViewMode.Table, columns: lastColumnsRef.current };
    exploreStateDispatch({ type: ExploreActionType.setViewMode, payload: nextView });
  };
  const isStatsView = exploreState.view.mode === Explore.EViewMode.Stats;

  const queryClient = useQueryClient();

  const handleInvalidateQuery = () => {
    invalidateAllExplorerQueries(queryClient);
  };

  const stableSignature = useMemo(() => {
    return buildStableSignature(queryState as any, exploreState as any);
  }, [queryState, exploreState]);

  // No search criteria yet -> the query is not fired (see useQueryData); the
  // explorer views use this to prompt the user instead of showing empty results.
  const isRequestEmpty = useMemo(
    () => isQueryRequestEmpty(queryState, exploreState),
    [queryState, exploreState],
  );

  // Only fire the API query when the user explicitly submits via Run Search or Enter.
  const [committedSignature, setCommittedSignature] = useState<string | null>(null);

  const handleRunSearch = useCallback(() => {
    setCommittedSignature(stableSignature);
  }, [stableSignature]);

  // Global Enter shortcut: run search unless focus is in a text input, textarea,
  // or select (e.g. Suggester, react-select dropdown).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      handleRunSearch();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleRunSearch]);

  // True when the user has criteria set but hasn't run the search yet (or has
  // changed the query since the last run).
  const isSearchPending = !isRequestEmpty && committedSignature !== stableSignature;

  const onePercentOfContentHeight = useMemo(() => contentHeight / 100, [contentHeight]);
  const onePercentOfLayoutWidth = useMemo(() => layoutWidth / 100, [layoutWidth]);

  const handleExport = (rowIndices: number[], selectedColumnIds?: string[]) => {
    toast.success("Exporting data...");
    const exportExplore =
      selectedColumnIds && exploreState.view.mode === Explore.EViewMode.Table
        ? {
            ...exploreState,
            view: {
              ...exploreState.view,
              columns: exploreState.view.columns.filter((c: Explore.IExploreColumn) =>
                selectedColumnIds.includes(c.id),
              ),
            },
          }
        : exploreState;
    api.queryExport(queryState, exportExplore, rowIndices);
  };

  const explorerBoxMaximizedStorageKey = "queryExplorerBoxMaximized";

  const persistSeparatorYPercent = (yPosition: number) => {
    const separatorYPercentPosition = floorNumberToOneDecimal(
      yPosition / onePercentOfContentHeight,
    );
    localStorage.setItem("querySeparatorYPosition", separatorYPercentPosition.toString());
  };

  const [explorerBoxMaximized, setExplorerBoxMaximized] = useState(
    () => localStorage.getItem(explorerBoxMaximizedStorageKey) === "true",
  );
  const savedExplorerSeparatorYRef = useRef<number | null>(null);

  const getDefaultSeparatorYPosition = () => contentHeight / 2;

  const handleSeparatorYPositionChange = (yPosition: number) => {
    if (querySeparatorYPosition !== yPosition) {
      if (explorerBoxMaximized && yPosition > QUERY_SEARCH_PANEL_MIN_HEIGHT) {
        setExplorerBoxMaximized(false);
        localStorage.setItem(explorerBoxMaximizedStorageKey, "false");
        savedExplorerSeparatorYRef.current = null;
      } else if (
        !explorerBoxMaximized &&
        yPosition === QUERY_SEARCH_PANEL_MIN_HEIGHT &&
        querySeparatorYPosition !== QUERY_SEARCH_PANEL_MIN_HEIGHT
      ) {
        savedExplorerSeparatorYRef.current = querySeparatorYPosition;
        setExplorerBoxMaximized(true);
        localStorage.setItem(explorerBoxMaximizedStorageKey, "true");
      }

      setQuerySeparatorYPosition(yPosition);
      persistSeparatorYPercent(yPosition);
    }
  };

  const localStorageSeparatorYPosition = localStorage.getItem("querySeparatorYPosition");
  const [querySeparatorYPosition, setQuerySeparatorYPosition] = useState<number>(() => {
    if (localStorage.getItem(explorerBoxMaximizedStorageKey) === "true") {
      return QUERY_SEARCH_PANEL_MIN_HEIGHT;
    }
    return localStorageSeparatorYPosition
      ? Number(localStorageSeparatorYPosition) * (contentHeight / 100)
      : contentHeight / 2;
  });

  const [currentContentHeight, setCurrentContentHeight] = useState(contentHeight);

  useEffect(() => {
    if (explorerBoxMaximized) {
      setQuerySeparatorYPosition(QUERY_SEARCH_PANEL_MIN_HEIGHT);
      setCurrentContentHeight(contentHeight);
      return;
    }

    const onePercentOfLastContentHeight = currentContentHeight / 100;
    const separatorXPercentPosition = floorNumberToOneDecimal(
      querySeparatorYPosition / onePercentOfLastContentHeight,
    );
    setQuerySeparatorYPosition(separatorXPercentPosition * onePercentOfContentHeight);
    localStorage.setItem("querySeparatorYPosition", separatorXPercentPosition.toString());
    setCurrentContentHeight(contentHeight);
  }, [contentHeight, explorerBoxMaximized]);

  const isExplorerAtMaxHeight = querySeparatorYPosition === QUERY_SEARCH_PANEL_MIN_HEIGHT;

  const toggleExplorerBoxMaximized = () => {
    if (isExplorerAtMaxHeight) {
      const restoredHeight =
        savedExplorerSeparatorYRef.current !== null &&
        savedExplorerSeparatorYRef.current !== QUERY_SEARCH_PANEL_MIN_HEIGHT
          ? savedExplorerSeparatorYRef.current
          : getDefaultSeparatorYPosition();
      setExplorerBoxMaximized(false);
      localStorage.setItem(explorerBoxMaximizedStorageKey, "false");
      savedExplorerSeparatorYRef.current = null;
      setQuerySeparatorYPosition(restoredHeight);
      persistSeparatorYPercent(restoredHeight);
      return;
    }

    savedExplorerSeparatorYRef.current = querySeparatorYPosition;
    setExplorerBoxMaximized(true);
    localStorage.setItem(explorerBoxMaximizedStorageKey, "true");
    setQuerySeparatorYPosition(QUERY_SEARCH_PANEL_MIN_HEIGHT);
    persistSeparatorYPercent(QUERY_SEARCH_PANEL_MIN_HEIGHT);
  };

  const handleSeparatorXPositionChange = (xPosition: number) => {
    if (querySeparatorXPosition !== xPosition) {
      setQuerySeparatorXPosition(xPosition);

      const separatorXPercentPosition = floorNumberToOneDecimal(
        xPosition / onePercentOfLayoutWidth,
      );
      localStorage.setItem("querySeparatorXPosition", separatorXPercentPosition.toString());
    }
  };

  const localStorageSeparatorXPosition = localStorage.getItem("querySeparatorXPosition");
  const [querySeparatorXPosition, setQuerySeparatorXPosition] = useState<number>(
    localStorageSeparatorXPosition
      ? Number(localStorageSeparatorXPosition) * onePercentOfLayoutWidth
      : QUERY_PAGE_SEPARATOR_X_PERCENT_POSITION * onePercentOfLayoutWidth,
  );

  const [currentLayoutWidth, setCurrentLayoutWidth] = useState(layoutWidth);

  useEffect(() => {
    const onePercentOfLastLayoutWidth = currentLayoutWidth / 100;
    const separatorXPercentPosition = floorNumberToOneDecimal(
      querySeparatorXPosition / onePercentOfLastLayoutWidth,
    );
    setQuerySeparatorXPosition(separatorXPercentPosition * onePercentOfLayoutWidth);
    localStorage.setItem("querySeparatorXPosition", separatorXPercentPosition.toString());
    setCurrentLayoutWidth(layoutWidth);
  }, [layoutWidth]);

  const {
    data: queryData,
    error: queryError,
    isFetching: queryIsFetching,
    getCachedEntity,
  } = useQueryData({
    queryState,
    exploreState,
    stableSignature,
    queryStateValidity,
    committedSignature,
  });

  const isDetailOpen = !!(selectedDetailId || detailIdArray.length > 0);

  const queryLeftPanelExpandedStorageKey = "queryLeftPanelExpanded";
  const [queryLeftPanelExpanded, setQueryLeftPanelExpanded] = useState(
    () => localStorage.getItem(queryLeftPanelExpandedStorageKey) !== "false",
  );
  const savedLeftPanelSeparatorXRef = useRef<number | null>(null);

  const queryDetailPanelExpandedStorageKey = "queryDetailPanelExpanded";
  const [queryDetailPanelExpanded, setQueryDetailPanelExpanded] = useState(
    () => localStorage.getItem(queryDetailPanelExpandedStorageKey) !== "false",
  );
  const savedSeparatorXRef = useRef<number | null>(null);

  const toggleQueryLeftPanel = () => {
    setQueryLeftPanelExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(queryLeftPanelExpandedStorageKey, String(next));
      if (prev) {
        savedLeftPanelSeparatorXRef.current = querySeparatorXPosition;
        if (isDetailOpen && !queryDetailPanelExpanded) {
          setQueryDetailPanelExpanded(true);
          localStorage.setItem(queryDetailPanelExpandedStorageKey, "true");
        }
      }
      return next;
    });
  };

  const toggleQueryDetailPanel = () => {
    setQueryDetailPanelExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(queryDetailPanelExpandedStorageKey, String(next));
      if (!next) {
        if (!queryLeftPanelExpanded) {
          setQueryLeftPanelExpanded(true);
          localStorage.setItem(queryLeftPanelExpandedStorageKey, "true");
        }
        savedSeparatorXRef.current = querySeparatorXPosition;
      }
      return next;
    });
  };

  const expandQueryDetailPanel = useCallback(() => {
    setQueryDetailPanelExpanded((prev) => {
      if (prev) {
        return prev;
      }
      localStorage.setItem(queryDetailPanelExpandedStorageKey, "true");
      return true;
    });
  }, []);

  const openEntityInDetail = useCallback(
    (entityId: string) => {
      expandQueryDetailPanel();

      if (detailIdArray.includes(entityId)) {
        setSelectedDetailId(entityId);
      } else {
        appendDetailId(entityId, QUERY_DETAIL_MAX_TABS);
      }
    },
    [appendDetailId, detailIdArray, expandQueryDetailPanel, setSelectedDetailId],
  );

  const openEntitiesInDetail = useCallback(
    (entityIds: string[]) => {
      if (entityIds.length === 0) {
        return;
      }

      expandQueryDetailPanel();

      let idsToAdd = entityIds;
      if (entityIds.length > QUERY_DETAIL_MAX_TABS) {
        toast.info(
          `Maximum number of tabs reached, only the first ${QUERY_DETAIL_MAX_TABS} displayed.`,
        );
        idsToAdd = entityIds.slice(0, QUERY_DETAIL_MAX_TABS);
      }

      const filteredArray = detailIdArray.filter((id) => !idsToAdd.includes(id));
      let newDetailIdArray = filteredArray.concat(idsToAdd);
      if (newDetailIdArray.length > QUERY_DETAIL_MAX_TABS) {
        newDetailIdArray = newDetailIdArray.slice(newDetailIdArray.length - QUERY_DETAIL_MAX_TABS);
      }

      replaceDetailIds(newDetailIdArray);
      setSelectedDetailId(idsToAdd[idsToAdd.length - 1]);
    },
    [detailIdArray, expandQueryDetailPanel, replaceDetailIds, setSelectedDetailId],
  );

  useEffect(() => {
    if (queryLeftPanelExpanded && savedLeftPanelSeparatorXRef.current !== null) {
      setQuerySeparatorXPosition(savedLeftPanelSeparatorXRef.current);
      savedLeftPanelSeparatorXRef.current = null;
    }
  }, [queryLeftPanelExpanded]);

  useEffect(() => {
    if (queryDetailPanelExpanded && savedSeparatorXRef.current !== null) {
      setQuerySeparatorXPosition(savedSeparatorXRef.current);
      savedSeparatorXRef.current = null;
    }
  }, [queryDetailPanelExpanded]);

  const detailPanelWidth = useMemo(() => {
    if (!isDetailOpen) {
      return 0;
    }
    if (!queryDetailPanelExpanded) {
      return COLLAPSED_PANEL_WIDTH;
    }
    return layoutWidth - (queryLeftPanelExpanded ? querySeparatorXPosition : COLLAPSED_PANEL_WIDTH);
  }, [
    isDetailOpen,
    queryDetailPanelExpanded,
    queryLeftPanelExpanded,
    layoutWidth,
    querySeparatorXPosition,
  ]);

  const leftPanelWidth = useMemo(() => {
    if (!queryLeftPanelExpanded) {
      return COLLAPSED_PANEL_WIDTH;
    }
    return isDetailOpen ? layoutWidth - detailPanelWidth : layoutWidth;
  }, [queryLeftPanelExpanded, isDetailOpen, layoutWidth, detailPanelWidth]);

  return (
    <>
      {queryLeftPanelExpanded && querySeparatorYPosition > 0 && (
        <LayoutSeparatorHorizontal
          width={leftPanelWidth}
          topPositionMin={QUERY_SEARCH_PANEL_MIN_HEIGHT}
          topPositionMax={contentHeight - QUERY_SEARCH_PANEL_MIN_HEIGHT}
          separatorYPosition={querySeparatorYPosition}
          setSeparatorYPosition={(yPosition) => handleSeparatorYPositionChange(yPosition)}
        />
      )}

      {isDetailOpen &&
        queryLeftPanelExpanded &&
        queryDetailPanelExpanded &&
        querySeparatorXPosition > 0 && (
          <LayoutSeparatorVertical
            leftSideMinWidth={QUERY_LEFT_PANEL_MIN_WIDTH}
            leftSideMaxWidth={layoutWidth - QUERY_RIGHT_PANEL_MIN_WIDTH}
            separatorXPosition={querySeparatorXPosition}
            setSeparatorXPosition={(xPosition) => handleSeparatorXPositionChange(xPosition)}
          />
        )}

      <Panel width={leftPanelWidth}>
        {queryLeftPanelExpanded ? (
          <>
            <Box
              noFrame
              borderColor="white"
              height={querySeparatorYPosition}
              label="Query Builder"
              onHeaderClick={toggleExplorerBoxMaximized}
              buttons={[
                <Button
                  key="run-search"
                  tooltipLabel="run search (Enter)"
                  label="run search"
                  icon={<BiSearch />}
                  disabled={!isSearchPending}
                  onClick={handleRunSearch}
                />,
                <Button
                  key="toggle-query-left-panel"
                  inverted
                  tooltipLabel="collapse left panel"
                  icon={<RiMenuFoldFill />}
                  onClick={toggleQueryLeftPanel}
                />,
              ]}
            >
              <MemoizedQueryBox
                state={queryState}
                dispatch={queryStateDispatch}
                isQueryFetching={queryIsFetching}
                queryError={queryError}
                queryStateValidity={queryStateValidity}
                onOpenEntityInDetail={openEntityInDetail}
              />
            </Box>
            <Box
              noFrame
              borderColor="white"
              height={contentHeight - querySeparatorYPosition}
              label="Explorer"
              buttons={[
                <ButtonGroup
                  key="explorer-view-mode"
                  $noMarginRight
                  style={{ marginRight: "0.6rem" }}
                >
                  <Button
                    tooltipLabel="table view"
                    label="table"
                    inverted={isStatsView}
                    icon={<BiTable />}
                    onClick={() => setExploreViewMode(Explore.EViewMode.Table)}
                  />
                  <Button
                    tooltipLabel="stats view"
                    label="stats"
                    inverted={!isStatsView}
                    icon={<BiBarChartAlt2 />}
                    onClick={() => setExploreViewMode(Explore.EViewMode.Stats)}
                  />
                </ButtonGroup>,
                <Button
                  key="refresh queries"
                  tooltipLabel="refresh data"
                  inverted
                  icon={<BiRefresh />}
                  onClick={handleInvalidateQuery}
                />,
                <Button
                  key="maximize-explorer-box"
                  dataTestId="maximize-explorer-box"
                  inverted
                  tooltipLabel={
                    isExplorerAtMaxHeight ? "restore half height" : "maximize explorer box"
                  }
                  icon={
                    isExplorerAtMaxHeight ? (
                      <BsSquareHalf style={{ transform: "rotate(270deg)" }} />
                    ) : (
                      <BsSquareFill />
                    )
                  }
                  onClick={toggleExplorerBoxMaximized}
                />,
                <Button
                  key="toggle-query-left-panel"
                  inverted
                  tooltipLabel="collapse left panel"
                  icon={<RiMenuFoldFill />}
                  onClick={toggleQueryLeftPanel}
                />,
              ]}
            >
              <MemoizedExplorerBox
                state={exploreState}
                height={contentHeight - querySeparatorYPosition}
                dispatch={exploreStateDispatch}
                data={queryData}
                isQueryFetching={queryIsFetching}
                isRequestEmpty={isRequestEmpty}
                isSearchPending={isSearchPending}
                queryError={queryError}
                onExport={handleExport}
                stableSignature={stableSignature}
                getCachedEntity={getCachedEntity}
                onOpenEntityInDetail={openEntityInDetail}
                onOpenEntitiesInDetail={openEntitiesInDetail}
                isDetailOpen={isDetailOpen}
                detailPanelWidth={detailPanelWidth}
                canBatchEdit={canBatchEdit}
              />
            </Box>
          </>
        ) : (
          <Box
            noFrame
            borderColor="white"
            height={contentHeight}
            label="Query"
            isExpanded={false}
            onHeaderClick={toggleQueryLeftPanel}
            buttons={[
              <Button
                key="toggle-query-left-panel"
                inverted
                tooltipLabel="expand query panel"
                icon={<RiMenuUnfoldFill />}
                onClick={toggleQueryLeftPanel}
              />,
            ]}
          />
        )}
      </Panel>
      {isDetailOpen && (
        <Panel width={detailPanelWidth}>
          <Box
            label="Detail"
            borderColor="white"
            height={contentHeight}
            disableScroll
            isExpanded={queryDetailPanelExpanded}
            onHeaderClick={toggleQueryDetailPanel}
            buttons={[
              <>
                {queryDetailPanelExpanded && (
                  <Button
                    inverted
                    tooltipLabel="close all tabs"
                    icon={<VscCloseAll style={{ transform: "scale(1.3)" }} />}
                    onClick={clearAllDetailIds}
                  />
                )}
              </>,
              <Button
                key="toggle-query-detail-panel"
                inverted
                tooltipLabel={
                  queryDetailPanelExpanded ? "collapse detail box" : "expand detail box"
                }
                icon={queryDetailPanelExpanded ? <RiMenuUnfoldFill /> : <RiMenuFoldFill />}
                onClick={toggleQueryDetailPanel}
              />,
            ]}
          >
            <MemoizedEntityDetailBox
              maxTabs={QUERY_DETAIL_MAX_TABS}
              onTabOpen={() => {
                if (!queryDetailPanelExpanded) {
                  toggleQueryDetailPanel();
                }
              }}
            />
          </Box>
        </Panel>
      )}
    </>
  );
};
