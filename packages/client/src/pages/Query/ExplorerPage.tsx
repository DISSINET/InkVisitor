import { useQueryClient } from "@tanstack/react-query";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { UserEnums } from "@inkvisitor/shared/enums";
import { Explore } from "@inkvisitor/shared/types/query";
import api from "api";
import { Box, Button, Checkbox, IconButton, Panel, SwitchGroup } from "components";
import { LayoutSeparatorHorizontal, LayoutSeparatorVertical } from "components/advanced";
import { useUserQuery } from "hooks/react-query";
import { useSearchParams } from "hooks/useSearchParamsContext";
import { MemoizedEntityDetailBox } from "pages/Main/containers/EntityDetailBox/EntityDetailBox";
import { BiBarChartAlt2, BiHide, BiRefresh, BiTable } from "react-icons/bi";
import { IcoSearch } from "Theme/icons";
import { BsSquareFill, BsSquareHalf } from "react-icons/bs";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { VscCloseAll } from "react-icons/vsc";
import { toast } from "react-toastify";
import { useAppSelector } from "redux/hooks";
import { COLLAPSED_PANEL_WIDTH } from "Theme/constants";
import {
  animateBoxHeightVars,
  animatePanelWidthVars,
  setBoxHeightVars,
  setPanelWidthVars,
} from "utils/layoutTransition";
import { floorNumberToOneDecimal } from "utils/utils";
import {
  QUERY_BUILDER_MIN_HEIGHT,
  QUERY_LEFT_PANEL_MIN_WIDTH,
  QUERY_PAGE_SEPARATOR_X_PERCENT_POSITION,
  QUERY_RIGHT_PANEL_MIN_WIDTH,
  QUERY_SEARCH_PANEL_MIN_HEIGHT,
} from "./constants";
import { MemoizedExplorerBox } from "./Explorer/ExplorerBox";
import ExplorerTableIdsFilter from "./Explorer/ExplorerTable/Filters/ExplorerTableIdsFilter";
import ExplorerTableLabelFilter from "./Explorer/ExplorerTable/Filters/ExplorerTableLabelFilter";
import {
  defaultExploreStatsParams,
  ExploreActionType,
  exploreReducer,
  exploreStateInitial,
} from "./Explorer/state";
import { StyledResultExpansionButtons } from "./ExplorerPageStyles";
import { FloatingSearchContainer } from "./FloatingSearchContainer/FloatingSearchContainer";
import { MemoizedQueryBox } from "./Query/QueryBox";
import SavedQueriesPanel from "./SavedQueries/SavedQueriesPanel";
import { queryReducer, queryStateInitial } from "./Query/state";
import { getAllEdges, getAllNodes, isQueryRequestEmpty } from "./Query/utils";
import { QueryValidity, QueryValidityProblem } from "./types";
import {
  buildQueryWithResultExpansion,
  invalidateAllExplorerQueries,
  useQueryData,
} from "./useQueryData";
import { buildSearchSignature, buildStableSignature, isEdgeValid } from "./utils";
import { ButtonSize } from "types";

interface ExplorerPage {}
export const ExplorerPage: React.FC<ExplorerPage> = ({}) => {
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

  // Page-level result expansion (#2969): append the equivalents (SYN/IDE/AEE)
  // and/or subordinates (inverse SCL/SOE/HOL + child territories) of the final
  // result entities to the Explorer results. Sent to the server via the root
  // node's params (see buildQueryWithResultExpansion). Persisted across sessions.
  const includeSubordinatesStorageKey = "queryIncludeSubordinates";
  const includeEquivalentsStorageKey = "queryIncludeEquivalents";
  const [includeSubordinates, setIncludeSubordinates] = useState(
    () => localStorage.getItem(includeSubordinatesStorageKey) === "true",
  );
  const [includeEquivalents, setIncludeEquivalents] = useState(
    () => localStorage.getItem(includeEquivalentsStorageKey) === "true",
  );
  const handleToggleIncludeSubordinates = useCallback((value: boolean) => {
    localStorage.setItem(includeSubordinatesStorageKey, String(value));
    setIncludeSubordinates(value);
  }, []);
  const handleToggleIncludeEquivalents = useCallback((value: boolean) => {
    localStorage.setItem(includeEquivalentsStorageKey, String(value));
    setIncludeEquivalents(value);
  }, []);

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
    return buildStableSignature(queryState as any, exploreState as any, {
      includeEquivalents,
      includeSubordinates,
    });
  }, [queryState, exploreState, includeEquivalents, includeSubordinates]);

  const searchSignature = useMemo(() => {
    return buildSearchSignature(queryState as any, exploreState as any, {
      includeEquivalents,
      includeSubordinates,
    });
  }, [queryState, exploreState, includeEquivalents, includeSubordinates]);

  // No search criteria yet -> the query is not fired (see useQueryData); the
  // explorer views use this to prompt the user instead of showing empty results.
  const isRequestEmpty = useMemo(
    () => isQueryRequestEmpty(queryState, exploreState),
    [queryState, exploreState],
  );

  // Only fire the API query when the user explicitly submits via Run Search or
  // Enter. View-only changes (adding/removing columns, switching view mode) do
  // not require an explicit submit — they match the committed search signature
  // and re-fetch automatically because the cache key (stableSignature) changes.
  const [committedSearchSignature, setCommittedSearchSignature] = useState<string | null>(null);

  const handleRunSearch = useCallback(() => {
    setCommittedSearchSignature(searchSignature);
  }, [searchSignature]);

  // Global Enter shortcut: run search unless focus is in a text input, textarea,
  // or select — except when that input lives inside a container marked with
  // [data-run-on-enter] (floating search panel, UUID filter panel), where Enter
  // should also trigger the search alongside any local handler on the input.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        if (!document.activeElement?.closest("[data-run-on-enter]")) return;
      }
      handleRunSearch();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleRunSearch]);

  // True when the user has criteria set but hasn't run the search yet (or has
  // changed the query since the last run).
  const isSearchPending = !isRequestEmpty && committedSearchSignature !== searchSignature;

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
    // export must run the same (resolved) query as the displayed results -
    // rowIndices are positional against the server-side result order
    api.queryExport(
      buildQueryWithResultExpansion(queryState, includeEquivalents, includeSubordinates),
      exportExplore,
      rowIndices,
    );
  };

  const explorerBoxMaximizedStorageKey = "queryExplorerBoxMaximized";
  const explorerBoxMinimizedStorageKey = "queryExplorerBoxMinimized";

  const persistSeparatorYPercent = (yPosition: number) => {
    const separatorYPercentPosition = floorNumberToOneDecimal(
      yPosition / onePercentOfContentHeight,
    );
    localStorage.setItem("querySeparatorYPosition", separatorYPercentPosition.toString());
  };

  const [explorerBoxMaximized, setExplorerBoxMaximized] = useState(
    () => localStorage.getItem(explorerBoxMaximizedStorageKey) === "true",
  );
  const [explorerBoxMinimized, setExplorerBoxMinimized] = useState(
    () =>
      localStorage.getItem(explorerBoxMinimizedStorageKey) === "true" &&
      localStorage.getItem(explorerBoxMaximizedStorageKey) !== "true",
  );
  const savedExplorerSeparatorYRef = useRef<number | null>(null);

  const getDefaultSeparatorYPosition = () => contentHeight / 2;

  const explorerMinimizedSeparatorY = contentHeight - QUERY_SEARCH_PANEL_MIN_HEIGHT;

  const handleSeparatorYPositionChange = (yPosition: number) => {
    if (querySeparatorYPosition !== yPosition) {
      if (explorerBoxMaximized && yPosition > QUERY_SEARCH_PANEL_MIN_HEIGHT) {
        setExplorerBoxMaximized(false);
        localStorage.setItem(explorerBoxMaximizedStorageKey, "false");
        savedExplorerSeparatorYRef.current = null;
      } else if (
        !explorerBoxMaximized &&
        !explorerBoxMinimized &&
        yPosition === QUERY_SEARCH_PANEL_MIN_HEIGHT &&
        querySeparatorYPosition !== QUERY_SEARCH_PANEL_MIN_HEIGHT
      ) {
        savedExplorerSeparatorYRef.current = querySeparatorYPosition;
        setExplorerBoxMaximized(true);
        localStorage.setItem(explorerBoxMaximizedStorageKey, "true");
      }

      if (explorerBoxMinimized && yPosition < explorerMinimizedSeparatorY) {
        setExplorerBoxMinimized(false);
        localStorage.setItem(explorerBoxMinimizedStorageKey, "false");
        savedExplorerSeparatorYRef.current = null;
      } else if (
        !explorerBoxMaximized &&
        !explorerBoxMinimized &&
        yPosition === explorerMinimizedSeparatorY &&
        querySeparatorYPosition !== explorerMinimizedSeparatorY
      ) {
        savedExplorerSeparatorYRef.current = querySeparatorYPosition;
        setExplorerBoxMinimized(true);
        localStorage.setItem(explorerBoxMinimizedStorageKey, "true");
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
    if (localStorage.getItem(explorerBoxMinimizedStorageKey) === "true") {
      return contentHeight - QUERY_SEARCH_PANEL_MIN_HEIGHT;
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

    if (explorerBoxMinimized) {
      setQuerySeparatorYPosition(contentHeight - QUERY_SEARCH_PANEL_MIN_HEIGHT);
      setCurrentContentHeight(contentHeight);
      return;
    }

    const onePercentOfLastContentHeight = currentContentHeight / 100;
    const separatorXPercentPosition = floorNumberToOneDecimal(
      querySeparatorYPosition / onePercentOfLastContentHeight,
    );
    const newY = Math.max(
      QUERY_BUILDER_MIN_HEIGHT,
      Math.min(
        separatorXPercentPosition * onePercentOfContentHeight,
        contentHeight - QUERY_SEARCH_PANEL_MIN_HEIGHT,
      ),
    );
    setQuerySeparatorYPosition(newY);
    localStorage.setItem(
      "querySeparatorYPosition",
      floorNumberToOneDecimal(newY / onePercentOfContentHeight).toString(),
    );
    setCurrentContentHeight(contentHeight);
  }, [contentHeight, explorerBoxMaximized, explorerBoxMinimized]);

  const isExplorerNormal = !explorerBoxMaximized && !explorerBoxMinimized;

  const restoreExplorerToHalf = () => {
    const restoredHeight =
      savedExplorerSeparatorYRef.current !== null &&
      savedExplorerSeparatorYRef.current !== QUERY_SEARCH_PANEL_MIN_HEIGHT &&
      savedExplorerSeparatorYRef.current !== explorerMinimizedSeparatorY
        ? savedExplorerSeparatorYRef.current
        : getDefaultSeparatorYPosition();
    setExplorerBoxMaximized(false);
    localStorage.setItem(explorerBoxMaximizedStorageKey, "false");
    setExplorerBoxMinimized(false);
    localStorage.setItem(explorerBoxMinimizedStorageKey, "false");
    savedExplorerSeparatorYRef.current = null;
    setQuerySeparatorYPosition(restoredHeight);
    persistSeparatorYPercent(restoredHeight);
  };

  const handleMaximizeExplorerBox = () => {
    if (isExplorerNormal) {
      savedExplorerSeparatorYRef.current = querySeparatorYPosition;
      setExplorerBoxMaximized(true);
      localStorage.setItem(explorerBoxMaximizedStorageKey, "true");
      setQuerySeparatorYPosition(QUERY_SEARCH_PANEL_MIN_HEIGHT);
      persistSeparatorYPercent(QUERY_SEARCH_PANEL_MIN_HEIGHT);
      return;
    }

    restoreExplorerToHalf();
  };

  const getMaximizeExplorerBtnTooltip = () => {
    if (explorerBoxMinimized) {
      return "open explorer box";
    }
    if (explorerBoxMaximized) {
      return "restore half height";
    }
    return "maximize explorer box";
  };

  const toggleExplorerBoxMinimized = () => {
    savedExplorerSeparatorYRef.current = querySeparatorYPosition;
    setExplorerBoxMinimized(true);
    localStorage.setItem(explorerBoxMinimizedStorageKey, "true");
    if (explorerBoxMaximized) {
      setExplorerBoxMaximized(false);
      localStorage.setItem(explorerBoxMaximizedStorageKey, "false");
    }
    setQuerySeparatorYPosition(explorerMinimizedSeparatorY);
    persistSeparatorYPercent(explorerMinimizedSeparatorY);
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
    const newX = Math.max(
      QUERY_LEFT_PANEL_MIN_WIDTH,
      Math.min(
        separatorXPercentPosition * onePercentOfLayoutWidth,
        layoutWidth - QUERY_RIGHT_PANEL_MIN_WIDTH,
      ),
    );
    setQuerySeparatorXPosition(newX);
    localStorage.setItem(
      "querySeparatorXPosition",
      floorNumberToOneDecimal(newX / onePercentOfLayoutWidth).toString(),
    );
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
    searchSignature,
    queryStateValidity,
    committedSearchSignature,
    globalIncludeEquivalents: includeEquivalents,
    globalIncludeSubordinates: includeSubordinates,
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

  // The panels render from these variables. A separator drag overwrites them
  // directly for the duration of the drag and lands here on drop.
  useLayoutEffect(() => {
    animatePanelWidthVars([leftPanelWidth, detailPanelWidth], "explorerPage");
  }, [leftPanelWidth, detailPanelWidth]);

  // Same for the two boxes the horizontal separator splits.
  useLayoutEffect(() => {
    animateBoxHeightVars(
      {
        queryBuilder: querySeparatorYPosition,
        explorer: contentHeight - querySeparatorYPosition,
      },
      "explorerPage",
    );
  }, [querySeparatorYPosition, contentHeight]);

  return (
    <>
      {queryLeftPanelExpanded && isExplorerNormal && querySeparatorYPosition > 0 && (
        <LayoutSeparatorHorizontal
          panelIndex={0}
          boxHeightVarKey="queryBuilder"
          applyPreview={(yPosition) =>
            setBoxHeightVars(
              {
                queryBuilder: yPosition,
                explorer: contentHeight - yPosition,
              },
              "explorerPage",
            )
          }
          topPositionMin={QUERY_BUILDER_MIN_HEIGHT}
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
            separatorXPosition={querySeparatorXPosition}
            // the separator only renders with both panels expanded, where the
            // left panel reaches exactly to it
            resolveDrag={(xPosition) => {
              const resolved = Math.min(
                Math.max(xPosition, QUERY_LEFT_PANEL_MIN_WIDTH),
                layoutWidth - QUERY_RIGHT_PANEL_MIN_WIDTH,
              );
              setPanelWidthVars([resolved, layoutWidth - resolved], "explorerPage");
              return resolved;
            }}
            setSeparatorXPosition={(xPosition) => handleSeparatorXPositionChange(xPosition)}
          />
        )}

      <Panel width={leftPanelWidth} widthVarIndex={0}>
        {queryLeftPanelExpanded ? (
          <>
            <Box
              noFrame
              borderColor="white"
              height={querySeparatorYPosition}
              heightVarKey="queryBuilder"
              label="Query Builder"
              disableHeaderClick={!explorerBoxMaximized}
              onHeaderClick={handleMaximizeExplorerBox}
              headerComponent={
                <ExplorerTableLabelFilter
                  filters={exploreState.filters}
                  dispatch={exploreStateDispatch}
                />
              }
              buttons={[
                <StyledResultExpansionButtons key="result-expansion-toggles">
                  {/* accent colours echo the eq/sub badges on the resulting
                      entity tags (see StyledExpansionBadge) */}
                  <Checkbox
                    label="EQUIVALENTS"
                    size={15}
                    color="info"
                    noFill
                    value={includeEquivalents}
                    tooltipLabel="include equivalents"
                    tooltipContent="Also include entities equivalent (SYN, IDE, AEE) to the query results."
                    onChangeFn={handleToggleIncludeEquivalents}
                    disableEnterKey
                  />
                  <Checkbox
                    label="SUBORDINATES"
                    size={15}
                    color="warning"
                    noFill
                    value={includeSubordinates}
                    tooltipLabel="include subordinates"
                    tooltipContent="Also include subordinate entities (subclasses, subordinates, meronyms and child territories, all levels) of the query results."
                    onChangeFn={handleToggleIncludeSubordinates}
                    disableEnterKey
                  />
                </StyledResultExpansionButtons>,
                <Button
                  key="run-search"
                  tooltipLabel="run search (Enter)"
                  label="run search"
                  icon={<IcoSearch />}
                  disabled={!isSearchPending}
                  onClick={handleRunSearch}
                />,
                <>
                  {/* collapsing the left panel only makes sense while the detail
                      panel is there to take over the freed width */}
                  {isDetailOpen && (
                    <IconButton
                      key="toggle-query-left-panel"
                      tooltipLabel="collapse left panel"
                      icon={<RiMenuFoldFill />}
                      onClick={toggleQueryLeftPanel}
                    />
                  )}
                </>,
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
              {!explorerBoxMaximized && (
                <SavedQueriesPanel
                  queryState={queryState}
                  queryStateDispatch={queryStateDispatch}
                  includeEquivalents={includeEquivalents}
                  includeSubordinates={includeSubordinates}
                  onToggleIncludeEquivalents={handleToggleIncludeEquivalents}
                  onToggleIncludeSubordinates={handleToggleIncludeSubordinates}
                  exploreFilters={exploreState.filters}
                  exploreDispatch={exploreStateDispatch}
                />
              )}
              {!explorerBoxMaximized && (
                <ExplorerTableIdsFilter
                  filters={exploreState.filters}
                  dispatch={exploreStateDispatch}
                />
              )}
              <FloatingSearchContainer
                filters={exploreState.filters}
                exploreDispatch={exploreStateDispatch}
                hideButton={explorerBoxMaximized}
              />
            </Box>
            <Box
              noFrame
              borderColor="white"
              height={contentHeight - querySeparatorYPosition}
              heightVarKey="explorer"
              label="Explorer"
              disableHeaderClick
              onHeaderClick={handleMaximizeExplorerBox}
              headerComponent={
                <SwitchGroup key="explorer-view-mode" activeIndex={isStatsView ? 1 : 0}>
                  <Button
                    size={ButtonSize.Medium}
                    tooltipLabel="table view"
                    label="table"
                    shape="rounded-sm"
                    noBorder
                    inverted
                    noBackground
                    textColor={isStatsView ? undefined : "white"}
                    noHoverBackground={!isStatsView}
                    color={isStatsView ? "greyer" : "primary"}
                    icon={<BiTable />}
                    onClick={() => {
                      setExploreViewMode(Explore.EViewMode.Table);
                      if (explorerBoxMinimized) restoreExplorerToHalf();
                    }}
                    textRegular={isStatsView}
                  />
                  <Button
                    size={ButtonSize.Medium}
                    tooltipLabel="stats view"
                    label="stats"
                    shape="rounded-sm"
                    noBorder
                    inverted
                    noBackground
                    textColor={isStatsView ? "white" : undefined}
                    noHoverBackground={isStatsView}
                    color={!isStatsView ? "greyer" : "primary"}
                    icon={<BiBarChartAlt2 />}
                    onClick={() => {
                      setExploreViewMode(Explore.EViewMode.Stats);
                      if (explorerBoxMinimized) restoreExplorerToHalf();
                    }}
                    textRegular={!isStatsView}
                  />
                </SwitchGroup>
              }
              buttons={[
                <IconButton
                  key="refresh queries"
                  tooltipLabel="refresh data"
                  icon={<BiRefresh />}
                  onClick={handleInvalidateQuery}
                />,
                <IconButton
                  key="maximize-explorer-box"
                  dataTestId="maximize-explorer-box"
                  tooltipLabel={getMaximizeExplorerBtnTooltip()}
                  icon={
                    isExplorerNormal ? (
                      <BsSquareFill />
                    ) : (
                      <BsSquareHalf style={{ transform: "rotate(270deg)" }} />
                    )
                  }
                  onClick={handleMaximizeExplorerBox}
                />,
                <>
                  {!explorerBoxMinimized && (
                    <IconButton
                      key="minimize-explorer-box"
                      dataTestId="minimize-explorer-box"
                      tooltipLabel="minimize explorer box"
                      icon={<BiHide />}
                      onClick={toggleExplorerBoxMinimized}
                    />
                  )}
                </>,
                <>
                  {isDetailOpen && (
                    <IconButton
                      key="toggle-query-left-panel"
                      tooltipLabel="collapse left panel"
                      icon={<RiMenuFoldFill />}
                      onClick={toggleQueryLeftPanel}
                    />
                  )}
                </>,
              ]}
            >
              <MemoizedExplorerBox
                state={exploreState}
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
              <IconButton
                key="toggle-query-left-panel"
                tooltipLabel="expand query panel"
                icon={<RiMenuUnfoldFill />}
                onClick={toggleQueryLeftPanel}
              />,
            ]}
          />
        )}
      </Panel>
      {isDetailOpen && (
        <Panel width={detailPanelWidth} widthVarIndex={1}>
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
                  <IconButton
                    tooltipLabel="close all tabs"
                    icon={<VscCloseAll style={{ transform: "scale(1.3)" }} />}
                    onClick={clearAllDetailIds}
                  />
                )}
              </>,
              <IconButton
                key="toggle-query-detail-panel"
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
