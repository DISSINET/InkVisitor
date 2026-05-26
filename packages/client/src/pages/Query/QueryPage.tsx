import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { Query } from "@inkvisitor/shared/types";
import api from "api";
import { Box, Button, Panel } from "components";
import { LayoutSeparatorHorizontal, LayoutSeparatorVertical } from "components/advanced";
import { useSearchParams } from "hooks/useSearchParamsContext";
import { MemoizedEntityDetailBox } from "pages/Main/containers/EntityDetailBox/EntityDetailBox";
import { BiRefresh } from "react-icons/bi";
import { RiMenuFoldFill, RiMenuUnfoldFill } from "react-icons/ri";
import { VscCloseAll } from "react-icons/vsc";
import { toast } from "react-toastify";
import { COLLAPSED_PANEL_WIDTH } from "Theme/constants";
import { useAppSelector } from "redux/hooks";
import { floorNumberToOneDecimal } from "utils/utils";
import { MemoizedExplorerBox } from "./Explorer/ExplorerBox";
import { exploreReducer, exploreStateInitial } from "./Explorer/state";
import { MemoizedQueryBox } from "./Query/QueryBox";
import { queryReducer, queryStateInitial } from "./Query/state";
import { getAllEdges, getAllNodes } from "./Query/utils";
import {
  QUERY_LEFT_PANEL_MIN_WIDTH,
  QUERY_PAGE_SEPARATOR_X_PERCENT_POSITION,
  QUERY_RIGHT_PANEL_MIN_WIDTH,
  QueryValidity,
  QueryValidityProblem,
} from "./types";
import { invalidateAllExplorerQueries, useQueryData } from "./useQueryData";
import { buildStableSignature } from "./utils";
interface QueryPage {}
export const QueryPage: React.FC<QueryPage> = ({}) => {
  const layoutWidth: number = useAppSelector((state) => state.layout.layoutWidth);
  const contentHeight: number = useAppSelector((state) => state.layout.contentHeight);
  const { selectedDetailId, detailIdArray, clearAllDetailIds, appendDetailId, setSelectedDetailId } =
    useSearchParams();
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
        if (!Query.isEdgeValidity(node, edge)) {
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

  const queryClient = useQueryClient();

  const handleInvalidateQuery = () => {
    invalidateAllExplorerQueries(queryClient);
  };

  const stableSignature = useMemo(() => {
    return buildStableSignature(queryState as any, exploreState as any);
  }, [queryState, exploreState]);

  const onePercentOfContentHeight = useMemo(() => contentHeight / 100, [contentHeight]);
  const onePercentOfLayoutWidth = useMemo(() => layoutWidth / 100, [layoutWidth]);

  const handleExport = (rowIndices: number[], selectedColumnIds?: string[]) => {
    toast.success("Exporting data...");
    const exportExplore = selectedColumnIds
      ? {
          ...exploreState,
          columns: exploreState.columns.filter((c) => selectedColumnIds.includes(c.id)),
        }
      : exploreState;
    api.queryExport(queryState, exportExplore, rowIndices);
  };

  const handleSeparatorYPositionChange = (xPosition: number) => {
    if (querySeparatorYPosition !== xPosition) {
      setQuerySeparatorYPosition(xPosition);

      const separatorYPercentPosition = floorNumberToOneDecimal(
        xPosition / onePercentOfContentHeight
      );
      localStorage.setItem("querySeparatorYPosition", separatorYPercentPosition.toString());
    }
  };

  const localStorageSeparatorYPosition = localStorage.getItem("querySeparatorYPosition");
  const [querySeparatorYPosition, setQuerySeparatorYPosition] = useState<number>(
    localStorageSeparatorYPosition
      ? Number(localStorageSeparatorYPosition) * onePercentOfContentHeight
      : contentHeight / 2
  );

  const [currentContentHeight, setCurrentContentHeight] = useState(contentHeight);

  useEffect(() => {
    const onePercentOfLastContentHeight = currentContentHeight / 100;
    const separatorXPercentPosition = floorNumberToOneDecimal(
      querySeparatorYPosition / onePercentOfLastContentHeight
    );
    setQuerySeparatorYPosition(separatorXPercentPosition * onePercentOfContentHeight);
    localStorage.setItem("querySeparatorYPosition", separatorXPercentPosition.toString());
    setCurrentContentHeight(contentHeight);
  }, [contentHeight]);

  const handleSeparatorXPositionChange = (xPosition: number) => {
    if (querySeparatorXPosition !== xPosition) {
      setQuerySeparatorXPosition(xPosition);

      const separatorXPercentPosition = floorNumberToOneDecimal(
        xPosition / onePercentOfLayoutWidth
      );
      localStorage.setItem("querySeparatorXPosition", separatorXPercentPosition.toString());
    }
  };

  const localStorageSeparatorXPosition = localStorage.getItem("querySeparatorXPosition");
  const [querySeparatorXPosition, setQuerySeparatorXPosition] = useState<number>(
    localStorageSeparatorXPosition
      ? Number(localStorageSeparatorXPosition) * onePercentOfLayoutWidth
      : QUERY_PAGE_SEPARATOR_X_PERCENT_POSITION * onePercentOfLayoutWidth
  );

  const [currentLayoutWidth, setCurrentLayoutWidth] = useState(layoutWidth);

  useEffect(() => {
    const onePercentOfLastLayoutWidth = currentLayoutWidth / 100;
    const separatorXPercentPosition = floorNumberToOneDecimal(
      querySeparatorXPosition / onePercentOfLastLayoutWidth
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
  });

  const isDetailOpen = !!(selectedDetailId || detailIdArray.length > 0);

  const queryDetailPanelExpandedStorageKey = "queryDetailPanelExpanded";
  const [queryDetailPanelExpanded, setQueryDetailPanelExpanded] = useState(
    () => localStorage.getItem(queryDetailPanelExpandedStorageKey) !== "false"
  );
  const savedSeparatorXRef = useRef<number | null>(null);

  const toggleQueryDetailPanel = () => {
    setQueryDetailPanelExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(queryDetailPanelExpandedStorageKey, String(next));
      if (!next) {
        savedSeparatorXRef.current = querySeparatorXPosition;
      }
      return next;
    });
  };

  const openEntityInDetail = useCallback(
    (entityId: string) => {
      setQueryDetailPanelExpanded((prev) => {
        if (prev) {
          return prev;
        }
        localStorage.setItem(queryDetailPanelExpandedStorageKey, "true");
        return true;
      });

      if (detailIdArray.includes(entityId)) {
        setSelectedDetailId(entityId);
      } else {
        appendDetailId(entityId);
      }
    },
    [appendDetailId, detailIdArray, setSelectedDetailId]
  );

  useEffect(() => {
    if (queryDetailPanelExpanded && savedSeparatorXRef.current !== null) {
      setQuerySeparatorXPosition(savedSeparatorXRef.current);
      savedSeparatorXRef.current = null;
    }
  }, [queryDetailPanelExpanded]);

  const detailPanelWidth = queryDetailPanelExpanded
    ? layoutWidth - querySeparatorXPosition
    : COLLAPSED_PANEL_WIDTH;
  const firstPanelWidth = isDetailOpen ? layoutWidth - detailPanelWidth : layoutWidth;

  return (
    <>
      {querySeparatorYPosition > 0 && (
        <LayoutSeparatorHorizontal
          width={firstPanelWidth}
          topPositionMin={34}
          topPositionMax={contentHeight - 34}
          separatorYPosition={querySeparatorYPosition}
          setSeparatorYPosition={(yPosition) => handleSeparatorYPositionChange(yPosition)}
        />
      )}

      {isDetailOpen && queryDetailPanelExpanded && querySeparatorXPosition > 0 && (
        <LayoutSeparatorVertical
          leftSideMinWidth={QUERY_LEFT_PANEL_MIN_WIDTH}
          leftSideMaxWidth={layoutWidth - QUERY_RIGHT_PANEL_MIN_WIDTH}
          separatorXPosition={querySeparatorXPosition}
          setSeparatorXPosition={(xPosition) => handleSeparatorXPositionChange(xPosition)}
        />
      )}

      <Panel width={firstPanelWidth}>
        <Box noFrame borderColor="white" height={querySeparatorYPosition} label="Search">
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
            <Button
              key="refresh queries"
              tooltipLabel="refresh data"
              inverted
              icon={<BiRefresh />}
              onClick={handleInvalidateQuery}
            />,
          ]}
        >
          <MemoizedExplorerBox
            state={exploreState}
            height={contentHeight - querySeparatorYPosition}
            dispatch={exploreStateDispatch}
            data={queryData}
            isQueryFetching={queryIsFetching}
            queryError={queryError}
            onExport={handleExport}
            stableSignature={stableSignature}
            getCachedEntity={getCachedEntity}
            onOpenEntityInDetail={openEntityInDetail}
          />
        </Box>
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
                  queryDetailPanelExpanded ? "minimize detail panel" : "expand detail panel"
                }
                icon={queryDetailPanelExpanded ? <RiMenuUnfoldFill /> : <RiMenuFoldFill />}
                onClick={toggleQueryDetailPanel}
              />,
            ]}
          >
            <MemoizedEntityDetailBox
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
