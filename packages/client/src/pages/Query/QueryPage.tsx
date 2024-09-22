import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { Query } from "@shared/types";
import { Explore } from "@shared/types/query";
import api from "api";
import { Box, Panel } from "components";
import { LayoutSeparatorHorizontal } from "components/advanced";
import { useAppSelector } from "redux/hooks";
import { floorNumberToOneDecimal } from "utils/utils";
import { MemoizedExplorerBox } from "./Explorer/ExplorerBox";
import {
  exploreDiff,
  exploreReducer,
  exploreStateInitial,
} from "./Explorer/state";
import { MemoizedQueryBox } from "./Query/QueryBox";
import { queryDiff, queryReducer, queryStateInitial } from "./Query/state";
import { getAllEdges, getAllNodes } from "./Query/utils";
import { QueryValidity, QueryValidityProblem } from "./types";

interface QueryPage {}
export const QueryPage: React.FC<QueryPage> = ({}) => {
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  const queryClient = useQueryClient();

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
        if (!Query.isSourceNodeValid(node.type, edge.type)) {
          isValid = false;
          problems.push({
            source: edge.id,
            text: "Invalid edge",
          });
        }
      });
    });

    // if edge has an invalid target node
    allEdges.forEach((edge) => {
      if (!Query.isTargetNodeValid(edge.node.type, edge.type)) {
        isValid = false;
        problems.push({
          source: edge.node.id,
          text: "Invalid target node",
        });
      }
    });

    return {
      problems,
      isValid,
    };
  }, [queryState]);

  const [exploreState, exploreStateDispatch] = useReducer(
    exploreReducer,
    exploreStateInitial
  );

  const prevQueryState = useRef<Query.INode>(queryState);
  const prevExploreState = useRef<Explore.IExplore>(exploreState);

  useEffect(() => {
    if (queryDiff(prevQueryState.current, queryState)) {
      handleInvalidateQuery();
      prevQueryState.current = queryState;
    }
  }, [queryState]);

  useEffect(() => {
    if (exploreDiff(prevExploreState.current, exploreState)) {
      handleInvalidateQuery();
      prevExploreState.current = exploreState;
    }
  }, [exploreState]);

  const handleInvalidateQuery = () => {
    queryClient.invalidateQueries({
      queryKey: ["query"],
    });
  };

  const {
    data: queryData,
    error: queryError,
    isFetching: queryIsFetching,
  } = useQuery({
    queryKey: ["query", queryState, exploreState],
    queryFn: async () => {
      if (queryStateValidity.isValid && api.isLoggedIn()) {
        const res = await api.query({
          query: queryState,
          explore: exploreState,
        });
        return res.data;
      }
    },

    enabled: queryStateValidity.isValid && api.isLoggedIn(),
  });

  // console.log("response", queryData);

  const onePercentOfContentHeight = useMemo(
    () => contentHeight / 100,
    [contentHeight]
  );

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
        ? floorNumberToOneDecimal(
            Number(localStorageSeparatorYPosition) * onePercentOfContentHeight
          )
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
          borderColor="white"
          height={querySeparatorYPosition}
          label="Search"
        >
          <MemoizedQueryBox
            state={queryState}
            dispatch={queryStateDispatch}
            data={queryData}
            isQueryFetching={queryIsFetching}
            queryError={queryError}
            queryStateValidity={queryStateValidity}
          />
        </Box>
        <Box
          borderColor="white"
          height={contentHeight - querySeparatorYPosition}
          label="Explorer"
        >
          <MemoizedExplorerBox
            state={exploreState}
            dispatch={exploreStateDispatch}
            data={queryData}
            isQueryFetching={queryIsFetching}
            queryError={queryError}
          />
        </Box>
      </Panel>
    </>
  );
};
