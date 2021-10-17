import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";

import api from "api";
import { IActant } from "@shared/types";
import { Submit } from "components";
import useKeypress from "hooks/useKeyPress";
import { useSearchParams } from "hooks";

interface ContextMenuSubmitDelete {
  territoryActant: IActant;
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
  const {
    territoryId,
    setTerritoryId,
    actantId,
    setActantId,
  } = useSearchParams();

  const deleteTerritoryMutation = useMutation(
    async () => await api.actantsDelete(territoryActant.id),
    {
      onSuccess: () => {
        toast.info(`Territory [${territoryActant.label}] deleted!`);
        queryClient.invalidateQueries("tree");
        queryClient.invalidateQueries("statement");
        if (territoryId === territoryActant.id) {
          setTerritoryId("");
        }
        if (actantId === territoryActant.id) {
          setActantId("");
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

  useKeypress("Enter", onSubmitDelete);
  useKeypress("Escape", onClose);

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
