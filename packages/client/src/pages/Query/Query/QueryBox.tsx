import { IResponseQuery, Query } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useAppSelector } from "redux/hooks";

interface QueryBoxProps {
  state: Query.INode;
  dispatch: React.Dispatch<any>;
  data: IResponseQuery | undefined;
  isQueryFetching: boolean;
  queryError: Error | null;
}

export const QueryBox: React.FC<QueryBoxProps> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
}) => {
  const queryClient = useQueryClient();

  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  return <div>Here comes the Query</div>;
};

export const MemoizedQueryBox = React.memo(QueryBox);
