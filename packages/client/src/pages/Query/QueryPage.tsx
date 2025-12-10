import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useReducer, useState } from "react";

import { Query } from "@shared/types";
import api from "api";
import { Box, Button, Loader, Panel } from "components";
import { LayoutSeparatorHorizontal } from "components/advanced";
import { BiRefresh } from "react-icons/bi";
import { toast } from "react-toastify";
import { useAppSelector } from "redux/hooks";
import { floorNumberToOneDecimal } from "utils/utils";
import { buildStableSignature } from "./utils";
import { MemoizedExplorerBox } from "./Explorer/ExplorerBox";
import { exploreReducer, exploreStateInitial } from "./Explorer/state";
import { MemoizedQueryBox } from "./Query/QueryBox";
import { queryReducer, queryStateInitial } from "./Query/state";
import { getAllEdges, getAllNodes } from "./Query/utils";
import { QueryValidity, QueryValidityProblem } from "./types";
import { useQueryData, clearRowCache } from "./useQueryData";

interface QueryPage {}
export const QueryPage: React.FC<QueryPage> = ({}) => {
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  const [queryState, queryStateDispatch] = useReducer(
    queryReducer,
    queryStateInitial
  );

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

  const [exploreState, exploreStateDispatch] = useReducer(
    exploreReducer,
    exploreStateInitial
  );

  const queryClient = useQueryClient();
  const handleInvalidateQuery = () => {
    // Clear the custom row cache store
    clearRowCache();
    // Invalidate React Query cache
    queryClient.invalidateQueries({
      queryKey: ["query"],
    });
    // Remove all query-related queries to force refetch
    queryClient.removeQueries({
      queryKey: ["query"],
    });
  };

  const stableSignature = useMemo(() => {
    return buildStableSignature(queryState as any, exploreState as any);
  }, [queryState, exploreState]);

  const onePercentOfContentHeight = useMemo(
    () => contentHeight / 100,
    [contentHeight]
  );

  const handleExport = (rowIndices: number[]) => {
    toast.success("Exporting data...");
    api.queryExport(queryState, exploreState, rowIndices);
  };

  const invalidateActiveQuery = () => {
    queryClient.invalidateQueries({
      queryKey: ["query", stableSignature],
      exact: false,
    });
  };

  const handleSeparatorYPositionChange = (xPosition: number) => {
    if (querySeparatorYPosition !== xPosition) {
      setQuerySeparatorYPosition(xPosition);

      const separatorYPercentPosition = floorNumberToOneDecimal(
        xPosition / onePercentOfContentHeight
      );
      localStorage.setItem(
        "querySeparatorYPosition",
        separatorYPercentPosition.toString()
      );
    }
  };

  const localStorageSeparatorYPosition = localStorage.getItem(
    "querySeparatorYPosition"
  );
  const [querySeparatorYPosition, setQuerySeparatorYPosition] =
    useState<number>(
      localStorageSeparatorYPosition
        ? Number(localStorageSeparatorYPosition) * onePercentOfContentHeight
        : contentHeight / 2
    );

  const [currentContentHeight, setCurrentContentHeight] =
    useState(contentHeight);

  useEffect(() => {
    const onePercentOfLastContentHeight = currentContentHeight / 100;
    const separatorXPercentPosition = floorNumberToOneDecimal(
      querySeparatorYPosition / onePercentOfLastContentHeight
    );
    setQuerySeparatorYPosition(
      separatorXPercentPosition * onePercentOfContentHeight
    );
    localStorage.setItem(
      "querySeparatorYPosition",
      separatorXPercentPosition.toString()
    );
    setCurrentContentHeight(contentHeight);
  }, [contentHeight]);

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

  return (
    <>
      {querySeparatorYPosition > 0 && (
        <LayoutSeparatorHorizontal
          topPositionMin={34}
          topPositionMax={contentHeight - 34}
          separatorYPosition={querySeparatorYPosition}
          setSeparatorYPosition={(yPosition) =>
            handleSeparatorYPositionChange(yPosition)
          }
        />
      )}

      <Panel width={layoutWidth}>
        <Box
          noFrame
          borderColor="white"
          height={querySeparatorYPosition}
          label="Search"
        >
          <MemoizedQueryBox
            state={queryState}
            dispatch={queryStateDispatch}
            isQueryFetching={queryIsFetching}
            queryError={queryError}
            queryStateValidity={queryStateValidity}
          />
        </Box>
        <Box
          noFrame
          borderColor="white"
          height={contentHeight - querySeparatorYPosition}
          label="Explorer"
          buttons={[
            // doesn't refresh the detail data for individual entities
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
            invalidateActiveQuery={invalidateActiveQuery}
            stableSignature={stableSignature}
            getCachedEntity={getCachedEntity}
          />
          <Loader show={queryIsFetching} />
        </Box>
      </Panel>
    </>
  );
};
