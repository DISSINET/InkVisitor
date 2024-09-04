import { Query } from "@shared/types";
import { Explore } from "@shared/types/query";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Box, Panel } from "components";
import { PanelSeparator } from "components/advanced";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useAppSelector } from "redux/hooks";
import { floorNumberToOneDecimal } from "utils/utils";

const initialQuery: Query.INode = {
  type: Query.NodeType.X,
  params: {
    classes: [],
    label: "",
  },
  edges: [],
  operator: Query.NodeOperator.And,
};

interface QueryAction {
  type: QueryActionType;
  payload: any;
}
enum QueryActionType {
  addNode,
  removeNode,
  addEdge,
  removeEdge,
}

const queryReducer = (state: Query.INode, action: QueryAction) => {
  switch (action.type) {
    case QueryActionType.addNode:
      return state;
    case QueryActionType.removeNode:
      return state;
    case QueryActionType.addEdge:
      return state;
    case QueryActionType.removeEdge:
      return state;
    default:
      return state;
  }
};

const initialExplore: Explore.IExplore = {
  view: {},
  columns: [],
  sort: undefined,
  filters: [],
  limit: 100,
  offset: 0,
};

interface ExploreAction {
  type: ExploreActionType;
  payload: any;
}
enum ExploreActionType {
  addColumn,
  removeColumn,
}

const explorerReducer = (state: Explore.IExplore, action: ExploreAction) => {
  switch (action.type) {
    case ExploreActionType.addColumn:
      return state;
    case ExploreActionType.removeColumn:
      return state;
    default:
      return state;
  }
};

interface QueryPage {}
export const QueryPage: React.FC<QueryPage> = ({}) => {
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  const [queryState, queryDispatch] = useReducer(queryReducer, initialQuery);

  const [exploreState, exploreDispatch] = useReducer(
    explorerReducer,
    initialExplore
  );

  const queryId = 1;
  const exploreId = 1;

  const {
    data: queryData,
    error: queryError,
    isFetching: queryIsFetching,
  } = useQuery({
    queryKey: ["query", { queryId, exploreId }],
    queryFn: async () => {
      const res = await api.query({
        query: queryState,
        explore: exploreState,
      });
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });

  console.log(queryData);

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
          {/* <MemoizedQueryBox /> */}
        </Box>
      </Panel>
      <Panel width={layoutWidth - querySeparatorXPosition}>
        <Box borderColor="white" height={contentHeight} label="Explorer">
          {/* <MemoizedExplorerBox /> */}
        </Box>
      </Panel>
    </>
  );
};
