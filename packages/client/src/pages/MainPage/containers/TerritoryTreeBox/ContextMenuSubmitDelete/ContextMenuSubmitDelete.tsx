import { IEntity } from "@shared/types";
import api from "api";
import { Submit } from "components";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";

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
  const { territoryId, setTerritoryId, detailId, removeDetailId } =
    useSearchParams();

  const deleteTerritoryMutation = useMutation(
    async () => await api.entityDelete(territoryActant.id),
    {
      onSuccess: () => {
        toast.info(`Territory [${territoryActant.label}] deleted!`);
        queryClient.invalidateQueries("tree");
        queryClient.invalidateQueries("statement");
        queryClient.invalidateQueries("bookmarks");
        if (territoryId === territoryActant.id) {
          setTerritoryId("");
        }
        if (detailId.includes(territoryActant.id)) {
          removeDetailId(territoryActant.id);
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
