import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";

import api from "api";
import { IEntity } from "@shared/types";
import { Submit } from "components";
import { useSearchParams } from "hooks";

interface ContextMenuSubmitDelete {
  territoryActant: IEntity;
  onClose: () => void;
}
export const ContextMenuSubmitDelete: React.FC<ContextMenuSubmitDelete> = ({
  onClose,
  territoryActant,
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  const queryClient = useQueryClient();
  const { territoryId, setTerritoryId, detailId, setDetailId } =
    useSearchParams();

  const deleteTerritoryMutation = useMutation(
    async () => await api.actantsDelete(territoryActant.id),
    {
      onSuccess: () => {
        toast.info(`Territory [${territoryActant.label}] deleted!`);
        queryClient.invalidateQueries("tree");
        queryClient.invalidateQueries("statement");
        queryClient.invalidateQueries("bookmarks");
        if (territoryId === territoryActant.id) {
          setTerritoryId("");
        }
        if (detailId === territoryActant.id) {
          setDetailId("");
        }
        onClose();
      },
      onError: () => {
        toast.error(`Error: Territory [${territoryActant.label}] not deleted!`);
      },
    }
  );

  const onSubmitDelete = () => {
    deleteTerritoryMutation.mutate();
  };

  return (
    <Submit
      title={"Delete Territory"}
      text={`Do you really want do delete Territory [${territoryActant.label}]?`}
      show={showModal}
      onSubmit={() => onSubmitDelete()}
      onCancel={() => onClose()}
      loading={deleteTerritoryMutation.isLoading}
    />
  );
};
