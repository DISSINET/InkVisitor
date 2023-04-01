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
  const {
    territoryId,
    setTerritoryId,
    detailIdArray,
    removeDetailId,
    appendDetailId,
  } = useSearchParams();

  const deleteTerritoryMutation = useMutation(
    async () => await api.entityDelete(territoryActant.id),
    {
      onSuccess: () => {
        toast.info(`Territory [${territoryActant.label}] deleted!`);
        if (territoryId === territoryActant.id) {
          setTerritoryId("");
        }
        removeDetailId(territoryActant.id);
        queryClient.invalidateQueries("detail-tab-entities");
        queryClient.invalidateQueries("tree");
        queryClient.invalidateQueries("statement");
        queryClient.invalidateQueries("bookmarks");
        onClose();
      },
      onError: (error) => {
        if (
          (error as any).error === "InvalidDeleteError" &&
          (error as any).data &&
          (error as any).data.length > 0
        ) {
          const { data } = error as any;
          toast.info("Click to open conflicting entity in detail", {
            autoClose: 6000,
            pauseOnHover: true,
            onClick: () => {
              appendDetailId(data[0]);
            },
          });
          onClose();
        }
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
