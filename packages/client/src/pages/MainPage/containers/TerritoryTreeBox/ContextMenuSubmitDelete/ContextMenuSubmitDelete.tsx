import { IEntity } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Submit, ToastWithLink } from "components";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getShortLabelByLetterCount } from "utils";

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
        toast.info(
          <ToastWithLink
            children={`Territory [${getShortLabelByLetterCount(
              territoryActant.label,
              120
            )}] deleted!`}
            linkText="Restore"
            onLinkClick={async () => {
              const response = await api.entityRestore(territoryActant.id);
              toast.info("Entity restored");
              queryClient.invalidateQueries(["tree"]);
              queryClient.invalidateQueries(["detail-tab-entities"]);
              queryClient.invalidateQueries(["statement"]);
            }}
          />,
          {
            autoClose: 5000,
          }
        );

        if (territoryId === territoryActant.id) {
          setTerritoryId("");
        }
        removeDetailId(territoryActant.id);
        queryClient.invalidateQueries(["detail-tab-entities"]);
        queryClient.invalidateQueries(["tree"]);
        queryClient.invalidateQueries(["statement"]);
        queryClient.invalidateQueries(["bookmarks"]);
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
      text={`Do you really want do delete Territory?`}
      entityToSubmit={territoryActant}
      show={showModal}
      onSubmit={() => onSubmitDelete()}
      onCancel={() => onClose()}
      loading={deleteTerritoryMutation.isLoading}
    />
  );
};
