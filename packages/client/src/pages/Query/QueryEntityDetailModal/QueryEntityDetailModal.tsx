import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Button, Loader, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks/useSearchParamsContext";
import React from "react";
import { QueryEntityDetail } from "./QueryEntityDetail/QueryEntityDetail";

interface QueryEntityDetailModal {}
export const QueryEntityDetailModal: React.FC<QueryEntityDetailModal> = ({}) => {
  const { selectedDetailId, setSelectedDetailId } = useSearchParams();

  const {
    status,
    data: entity,
    error: entityError,
    isFetching,
  } = useQuery({
    queryKey: ["entity", selectedDetailId],
    queryFn: async () => {
      const res = await api.detailGet(selectedDetailId);
      return res.data;
    },
    enabled: !!selectedDetailId && api.isLoggedIn(),
  });

  const handleCloseDetailsModal = () => {
    setSelectedDetailId("");
  };

  return (
    <Modal showModal width={"fat"} onClose={handleCloseDetailsModal}>
      <ModalHeader
        title="Entity Detail"
        content={
          <div style={{ display: "grid" }}>
            {entity && <EntityTag fullWidth entity={entity} />}{" "}
            <Loader show={isFetching} size={20} />
          </div>
        }
        onClose={handleCloseDetailsModal}
      />
      <ModalContent enableScroll noPadding>
        <QueryEntityDetail entity={entity} isFetching={isFetching} />
      </ModalContent>
      <ModalFooter>
        <Button label="Close" onClick={handleCloseDetailsModal} />
      </ModalFooter>
    </Modal>
  );
};
