import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Box, Button, Loader } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks/useSearchParamsContext";
import React from "react";
import { VscClose, VscCloseAll } from "react-icons/vsc";
import { useAppSelector } from "redux/hooks";
import { QueryEntityDetail } from "./QueryEntityDetail/QueryEntityDetail";

interface QueryEntityDetailBox {}
export const QueryEntityDetailBox: React.FC<QueryEntityDetailBox> = ({}) => {
  const contentHeight: number = useAppSelector((state) => state.layout.contentHeight);
  const { selectedDetailId, clearAllDetailIds } = useSearchParams();

  const { data: entity, isFetching } = useQuery({
    queryKey: ["entity", selectedDetailId],
    queryFn: async () => {
      const res = await api.detailGet(selectedDetailId);
      return res.data;
    },
    enabled: !!selectedDetailId && api.isLoggedIn(),
  });

  if (!selectedDetailId) {
    return null;
  }

  const handleClose = () => {
    clearAllDetailIds();
  };

  return (
    <Box
      label="Detail"
      borderColor="white"
      height={contentHeight}
      disableScroll
      buttons={[
        <Button
          inverted
          tooltipLabel="close all tabs"
          icon={<VscCloseAll style={{ transform: "scale(1.3)" }} />}
          onClick={handleClose}
        />,
      ]}
    >
      <QueryEntityDetail entity={entity} isFetching={isFetching} />
    </Box>
  );
};

export const MemoizedQueryEntityDetailBox = React.memo(QueryEntityDetailBox);
