import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { Query } from "@shared/types";
import { Explore } from "@shared/types/query";
import api from "api";
import { Box, Button, Panel } from "components";
import { PanelSeparator } from "components/advanced";
import { useAppSelector } from "redux/hooks";
import { floorNumberToOneDecimal } from "utils/utils";
import { MemoizedExplorerBox } from "./Explorer/ExplorerBox";
import {
  ExploreActionType,
  exploreDiff,
  exploreReducer,
  ExploreState,
  exploreStateInitial,
} from "./Explorer/state";
import { MemoizedQueryBox } from "./Query/QueryBox";
import { queryDiff, queryReducer, queryStateInitial } from "./Query/state";
import { TbColumnInsertRight } from "react-icons/tb";

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

  const [exploreState, exploreStateDispatch] = useReducer(
    exploreReducer,
    exploreStateInitial
  );

  const prevQueryState = useRef<Query.INode>(queryState);
  const prevExploreState = useRef<ExploreState>(exploreState);

  useEffect(() => {
    if (queryDiff(prevQueryState.current, queryState)) {
      invalidateQuery();
      prevQueryState.current = queryState;
    }
  }, [queryState]);

  useEffect(() => {
    if (exploreDiff(prevExploreState.current, exploreState)) {
      invalidateQuery();
      prevExploreState.current = exploreState;
    }
  }, [exploreState.explore]);

  const invalidateQuery = () => {
    queryClient.invalidateQueries({
      queryKey: ["query"],
    });
  };

  const {
    data: queryData,
    error: queryError,
    isFetching: queryIsFetching,
  } = useQuery({
    queryKey: ["query", queryState, exploreState.explore.columns],
    queryFn: async () => {
      const res = await api.query({
        query: queryState,
        explore: exploreState.explore,
      });
      exploreStateDispatch({
        type: ExploreActionType.setEntities,
        payload: res.data.entities,
      });
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });

  console.log("response", queryData);

  const handleSeparatorXPositionChange = (xPosition: number) => {
    if (querySeparatorXPosition !== xPosition) {
      setquerySeparatorXPosition(xPosition);

      const separatorXPercentPosition = floorNumberToOneDecimal(
        xPosition / onePercentOfLayoutWidth
      );
      localStorage.setItem(
        "querySeparatorXPosition",
        separatorXPercentPosition.toString()
      );
    }
  };

  const onePercentOfLayoutWidth = useMemo(
    () => layoutWidth / 100,
    [layoutWidth]
  );

  const localStorageSeparatorXPosition = localStorage.getItem(
    "querySeparatorXPosition"
  );
  const [querySeparatorXPosition, setquerySeparatorXPosition] =
    useState<number>(
      localStorageSeparatorXPosition
        ? floorNumberToOneDecimal(
            Number(localStorageSeparatorXPosition) * onePercentOfLayoutWidth
          )
        : layoutWidth / 2
    );

  const [currentLayoutWidth, setcurrentLayoutWidth] = useState(layoutWidth);

  useEffect(() => {
    const onePercentOfLastLayoutWidth = currentLayoutWidth / 100;
    const separatorXPercentPosition = floorNumberToOneDecimal(
      querySeparatorXPosition / onePercentOfLastLayoutWidth
    );
    setquerySeparatorXPosition(
      separatorXPercentPosition * onePercentOfLayoutWidth
    );
    localStorage.setItem(
      "querySeparatorXPosition",
      separatorXPercentPosition.toString()
    );
    setcurrentLayoutWidth(layoutWidth);
  }, [layoutWidth]);

  return (
    <>
      {querySeparatorXPosition > 0 && (
        <PanelSeparator
          leftSideMinWidth={400}
          leftSideMaxWidth={layoutWidth - 400}
          separatorXPosition={querySeparatorXPosition}
          setSeparatorXPosition={(xPosition) =>
            handleSeparatorXPositionChange(xPosition)
          }
        />
      )}

      <Panel width={querySeparatorXPosition}>
        <Box borderColor="white" height={contentHeight} label="Search">
          <MemoizedQueryBox
            state={queryState}
            dispatch={queryStateDispatch}
            data={queryData}
            isQueryFetching={queryIsFetching}
            queryError={queryError}
          />
        </Box>
      </Panel>
      <Panel width={layoutWidth - querySeparatorXPosition}>
        <Box
          borderColor="white"
          height={contentHeight}
          label="Explorer"
          buttons={[
            <Button
              icon={<TbColumnInsertRight size={17} />}
              label="new column"
              color={
                exploreState.explore.view.showNewColumn ? "info" : "primary"
              }
              onClick={() =>
                exploreState.explore.view.showNewColumn
                  ? exploreStateDispatch({
                      type: ExploreActionType.hideNewColumn,
                    })
                  : exploreStateDispatch({
                      type: ExploreActionType.showNewColumn,
                    })
              }
            />,
          ]}
        >
          <MemoizedExplorerBox
            state={exploreState.explore}
            dispatch={exploreStateDispatch}
            entities={exploreState.entities}
            // data={queryData}
            isQueryFetching={queryIsFetching}
            queryError={queryError}
          />
        </Box>
      </Panel>
    </>
  );
};
